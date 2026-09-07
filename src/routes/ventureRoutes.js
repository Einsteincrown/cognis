const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../utils/prisma');
const { getAssessmentStructure } = require('../services/assessmentTemplate');
const { searchTokenMarket, getTokenDetails } = require('../services/binanceService');

const router = express.Router();
const includeAssessment = {
  domains: { orderBy: { position: 'asc' }, include: { questions: { orderBy: { position: 'asc' }, include: { response: true, evidence: { orderBy: { createdAt: 'asc' } } } } } },
};

function validateWebsite(url) {
  if (!url) return true;
  try { new URL(url); return true; } catch (e) { return false; }
}

async function verifyToken(symbol, chainId, contractAddress) {
  const validChains = new Set(['1', '56', '8453', 'CT_501']);
  if (!validChains.has(String(chainId))) throw new Error('Unsupported chain ID');
  if (!contractAddress?.trim()) throw new Error('Contract address required');
  const searchResult = await searchTokenMarket({ keyword: symbol, chainIds: chainId });
  const found = (searchResult.items || []).find((item) => String(item.chainId) === String(chainId) && item.contractAddress?.toLowerCase() === contractAddress.toLowerCase());
  if (!found) throw new Error('Token not found on specified chain');
  const details = await getTokenDetails({ chainId, contractAddress });
  if (String(details.chainId) !== String(chainId)) throw new Error('Token metadata chainId mismatch');
  if (details.contractAddress?.toLowerCase() !== contractAddress.toLowerCase()) throw new Error('Token metadata contract mismatch');
  if (details.symbol?.toUpperCase() !== symbol.toUpperCase()) throw new Error('Token symbol mismatch');
  return { symbol: details.symbol, chainId: details.chainId, contractAddress: details.contractAddress };
}

function isApplicableQuestion(question) {
  return question?.state !== 'Not applicable';
}

function isCompletedQuestion(question) {
  const reviewedState = ['Reviewed', 'Complete', 'Verified'];
  return reviewedState.includes(question?.state) || question?.response?.status === 'Reviewed' || Boolean(question?.response?.body?.trim());
}

function serializeQuestion(question) {
  const completed = isCompletedQuestion(question);
  return {
    id: question.id,
    prompt: question.prompt,
    context: question.context,
    state: question.state,
    isApplicable: isApplicableQuestion(question),
    isCompleted: completed,
    isBlocker: Boolean(question.isBlocker),
    response: question.response?.body || '',
    tokenQuery: question.tokenQuery,
    binanceMode: question.binanceMode,
    evidence: question.evidence.map((item) => ({ id: item.id, type: item.type, text: item.content, source: item.sourceLabel, request: item.status === 'REQUESTED' })),
  };
}

function deriveAssessmentMetrics(assessment) {
  const questions = (assessment?.domains || []).flatMap((domain) => domain.questions || []);
  const applicableQuestions = questions.filter((question) => isApplicableQuestion(question));
  const completedQuestions = applicableQuestions.filter((question) => isCompletedQuestion(question));
  const blockerQuestions = applicableQuestions.filter((question) => question.isBlocker && !isCompletedQuestion(question));
  const totalApplicable = applicableQuestions.length;
  const completedApplicable = completedQuestions.length;
  const progress = totalApplicable ? Math.round((completedApplicable / totalApplicable) * 100) : 0;
  const blockerCount = blockerQuestions.length;
  const committeeReady = blockerCount === 0 && totalApplicable > 0 && completedApplicable / totalApplicable >= 0.75;
  return { totalApplicable, completedApplicable, progress, blockerCount, committeeReady, remainingBlockers: blockerQuestions.map((question) => question.prompt) };
}

function serializeAssessment(assessment) {
  const metrics = deriveAssessmentMetrics(assessment);
  return {
    id: assessment.id,
    ventureId: assessment.ventureId,
    stage: assessment.stage,
    signalState: assessment.signalState,
    status: assessment.status,
    ownerDisplayName: assessment.ownerDisplayName,
    committee: { at: assessment.committeeAt, status: assessment.committeeStatus, condition: assessment.committeeCondition },
    progress: metrics.progress,
    checks: `${metrics.completedApplicable} of ${metrics.totalApplicable} checks`,
    blockerCount: metrics.blockerCount,
    committeeReady: metrics.committeeReady,
    remainingBlockers: metrics.remainingBlockers,
    totalApplicableQuestions: metrics.totalApplicable,
    completedApplicableQuestions: metrics.completedApplicable,
    domains: assessment.domains.map((domain) => ({ id: domain.id, key: domain.key, label: domain.label, status: domain.status, blockerCount: domain.questions.filter((question) => isApplicableQuestion(question) && question.isBlocker && !isCompletedQuestion(question)).length || domain.blockerCount || 0, questions: domain.questions.map(serializeQuestion) })),
  };
}

function serializeVenture(venture) {
  const assessment = venture.assessments[0];
  const serialized = assessment ? serializeAssessment(assessment) : null;
  return { id: venture.id, name: venture.name, category: venture.category, description: venture.description, website: venture.website, isDemo: venture.isDemo, hasToken: venture.hasToken, tokenSymbol: venture.tokenSymbol, tokenChainId: venture.tokenChainId, tokenContractAddress: venture.tokenContractAddress, assessment: serialized, progress: serialized?.progress || 0, committeeReady: serialized?.committeeReady || false };
}

async function latestAssessment(ventureId) {
  return prisma.assessment.findFirst({ where: { ventureId, status: 'active' }, orderBy: { updatedAt: 'desc' }, include: includeAssessment });
}

router.post('/token-verification', async (req, res, next) => {
  try {
    const { symbol, chainId, contractAddress } = req.body || {};
    if (!symbol?.trim()) return res.status(400).json({ error: 'symbol is required' });
    if (!chainId?.trim()) return res.status(400).json({ error: 'chainId is required' });
    if (!contractAddress?.trim()) return res.status(400).json({ error: 'contractAddress is required' });
    const verified = await verifyToken(symbol.trim(), chainId.trim(), contractAddress.trim());
    res.json({ status: 'verified', token: verified });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Token verification failed' });
  }
});

router.post('/ventures', async (req, res, next) => {
  try {
    const { name, category, stage, description, website, hasToken, tokenSymbol, tokenChainId, tokenContractAddress } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    if (!category?.trim()) return res.status(400).json({ error: 'category is required' });
    if (!stage?.trim()) return res.status(400).json({ error: 'stage is required' });
    if (!description?.trim()) return res.status(400).json({ error: 'description is required' });
    if (website && !validateWebsite(website)) return res.status(400).json({ error: 'website is invalid' });
    let verifiedToken = null;
    if (hasToken) {
      if (!tokenSymbol?.trim()) return res.status(400).json({ error: 'tokenSymbol is required for tokenized ventures' });
      if (!tokenChainId?.trim()) return res.status(400).json({ error: 'tokenChainId is required for tokenized ventures' });
      if (!tokenContractAddress?.trim()) return res.status(400).json({ error: 'tokenContractAddress is required for tokenized ventures' });
      try { verifiedToken = await verifyToken(tokenSymbol.trim(), tokenChainId.trim(), tokenContractAddress.trim()); } catch (error) { return res.status(400).json({ error: `Token verification failed: ${error.message}` }); }
    }
    const ventureId = randomUUID();
    const assessmentId = randomUUID();
    const structure = getAssessmentStructure({ ventureName: name, hasToken });
    const transaction = await prisma.$transaction(async (tx) => {
      const venture = await tx.venture.create({
        data: {
          id: ventureId,
          name: name.trim(),
          website: website?.trim() || null,
          category: category.trim(),
          description: description.trim(),
          hasToken: hasToken || false,
          tokenSymbol: verifiedToken?.symbol || null,
          tokenChainId: verifiedToken?.chainId || null,
          tokenContractAddress: verifiedToken?.contractAddress || null,
          isDemo: false,
        },
      });
      const assessment = await tx.assessment.create({
        data: {
          id: assessmentId,
          ventureId,
          stage: stage.trim(),
          ownerDisplayName: 'Alex Morgan',
          domains: {
            create: structure.map((domain, domainIndex) => ({
              id: `${assessmentId}-${domain.key}`,
              key: domain.key,
              label: domain.label,
              position: domainIndex,
              status: domain.status,
              blockerCount: domain.blockerCount || 0,
              questions: {
                create: domain.questions.map((question, questionIndex) => ({
                  id: `${assessmentId}-${domain.key}-${questionIndex + 1}`,
                  prompt: question.prompt,
                  context: question.context,
                  position: questionIndex,
                  state: question.state,
                  isBlocker: question.isBlocker || false,
                  tokenQuery: question.tokenQuery || null,
                  binanceMode: question.binanceMode || null,
                  response: question.response ? { create: { id: `${assessmentId}-${domain.key}-${questionIndex + 1}-response`, body: question.response, status: 'Reviewed' } } : undefined,
                  evidence: {
                    create: question.evidence.map((item, evidenceIndex) => ({
                      id: `${assessmentId}-${domain.key}-${questionIndex + 1}-evidence-${evidenceIndex + 1}`,
                      type: item.type,
                      status: item.requested ? 'REQUESTED' : 'ACTIVE',
                      content: item.content,
                      sourceLabel: item.sourceLabel,
                      requestedAt: item.requested ? new Date() : null,
                    })),
                  },
                })),
              },
            })),
          },
        },
      });
      return { venture, assessment };
    });
    const { assessment } = transaction;
    const fullAssessment = await prisma.assessment.findUnique({ where: { id: assessment.id }, include: includeAssessment });
    res.status(201).json({ venture: { id: ventureId, name, website: website?.trim() || null, category, description, hasToken, tokenSymbol: verifiedToken?.symbol || null, tokenChainId: verifiedToken?.chainId || null, tokenContractAddress: verifiedToken?.contractAddress || null, isDemo: false }, assessment: serializeAssessment(fullAssessment) });
  } catch (error) { next(error); }
});

router.get('/workspace', async (req, res, next) => {
  try {
    const ventures = await prisma.venture.findMany({ orderBy: { createdAt: 'asc' }, include: { assessments: { where: { status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 1, include: includeAssessment } } });
    const serialized = ventures.map(serializeVenture);
    const assessments = serialized.map((item) => item.assessment).filter(Boolean);
    const nextActions = assessments.map((assessment) => {
      const firstBlocked = assessment.remainingBlockers?.[0];
      if (firstBlocked) return { ventureId: assessment.ventureId, assessmentId: assessment.id, title: `Review blocker: ${firstBlocked.slice(0, 60)}` };
      if (assessment.progress < 100) return { ventureId: assessment.ventureId, assessmentId: assessment.id, title: 'Continue assessment' };
      if (assessment.committeeReady) return { ventureId: assessment.ventureId, assessmentId: assessment.id, title: 'Prepare for committee' };
      return { ventureId: assessment.ventureId, assessmentId: assessment.id, title: 'Review assessment' };
    });
    const nextCommittee = assessments.filter((assessment) => assessment.committee?.at).sort((a, b) => new Date(a.committee.at) - new Date(b.committee.at))[0]?.committee || null;
    res.json({
      ventures: serialized,
      summary: {
        activeAssessments: assessments.length,
        needsReview: assessments.filter((assessment) => assessment.signalState === 'Caution' || assessment.signalState === 'Unclear' || assessment.blockerCount > 0).length,
        staleEvidence: assessments.reduce((count, assessment) => count + assessment.domains.flatMap((domain) => domain.questions).reduce((domainCount, question) => domainCount + question.evidence.filter((item) => item.request).length, 0), 0),
        committeeReady: assessments.filter((assessment) => assessment.committeeReady).length,
      },
      nextActions,
      committee: nextCommittee,
    });
  } catch (error) { next(error); }
});

router.get('/ventures/:ventureId', async (req, res, next) => {
  try {
    const venture = await prisma.venture.findUnique({ where: { id: req.params.ventureId }, include: { assessments: { where: { status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 1, include: includeAssessment } } });
    if (!venture) return res.status(404).json({ error: 'Venture not found' });
    res.json(serializeVenture(venture));
  } catch (error) { next(error); }
});

router.patch('/ventures/:ventureId', async (req, res, next) => {
  try {
    const venture = await prisma.venture.findUnique({ where: { id: req.params.ventureId } });
    if (!venture) return res.status(404).json({ error: 'Venture not found' });
    const updates = {};
    if (req.body?.name !== undefined) updates.name = req.body.name.trim();
    if (req.body?.category !== undefined) updates.category = req.body.category.trim();
    if (req.body?.description !== undefined) updates.description = req.body.description.trim();
    if (req.body?.website !== undefined) updates.website = req.body.website ? req.body.website.trim() : null;
    if (req.body?.hasToken !== undefined) updates.hasToken = Boolean(req.body.hasToken);
    if (req.body?.tokenSymbol !== undefined) updates.tokenSymbol = req.body.tokenSymbol ? req.body.tokenSymbol.trim() : null;
    if (req.body?.tokenChainId !== undefined) updates.tokenChainId = req.body.tokenChainId ? req.body.tokenChainId.trim() : null;
    if (req.body?.tokenContractAddress !== undefined) updates.tokenContractAddress = req.body.tokenContractAddress ? req.body.tokenContractAddress.trim() : null;
    if (Object.keys(updates).length === 0) return res.json(serializeVenture({ ...venture, assessments: [] }));
    const updated = await prisma.venture.update({ where: { id: req.params.ventureId }, data: updates, include: { assessments: { where: { status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 1, include: includeAssessment } } });
    res.json(serializeVenture(updated));
  } catch (error) { next(error); }
});

router.get('/ventures', async (req, res, next) => {
  try { res.json({ items: (await prisma.venture.findMany({ orderBy: { createdAt: 'asc' }, include: { assessments: { where: { status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 1, include: includeAssessment } } })).map(serializeVenture) }); } catch (error) { next(error); }
});

router.get('/ventures/:ventureId/assessments', async (req, res, next) => {
  try { res.json({ items: (await prisma.assessment.findMany({ where: { ventureId: req.params.ventureId }, orderBy: { updatedAt: 'desc' }, include: includeAssessment })).map(serializeAssessment) }); } catch (error) { next(error); }
});

router.post('/ventures/:ventureId/assessments', async (req, res, next) => {
  try {
    const venture = await prisma.venture.findUnique({ where: { id: req.params.ventureId } });
    if (!venture) return res.status(404).json({ error: 'Venture not found' });
    const assessmentId = randomUUID();
    const structure = getAssessmentStructure({ ventureName: venture.name, hasToken: venture.hasToken });
    const assessment = await prisma.$transaction(async (tx) => {
      return await tx.assessment.create({
        data: {
          id: assessmentId,
          ventureId: venture.id,
          stage: req.body?.stage || 'Intake',
          ownerDisplayName: req.body?.ownerDisplayName || 'Alex Morgan',
          domains: {
            create: structure.map((domain, domainIndex) => ({
              id: `${assessmentId}-${domain.key}`,
              key: domain.key,
              label: domain.label,
              position: domainIndex,
              status: domain.status,
              blockerCount: domain.blockerCount || 0,
              questions: {
                create: domain.questions.map((question, questionIndex) => ({
                  id: `${assessmentId}-${domain.key}-${questionIndex + 1}`,
                  prompt: question.prompt,
                  context: question.context,
                  position: questionIndex,
                  state: question.state,
                  isBlocker: question.isBlocker || false,
                  tokenQuery: question.tokenQuery || null,
                  binanceMode: question.binanceMode || null,
                  response: question.response ? { create: { id: `${assessmentId}-${domain.key}-${questionIndex + 1}-response`, body: question.response, status: 'Reviewed' } } : undefined,
                  evidence: {
                    create: question.evidence.map((item, evidenceIndex) => ({
                      id: `${assessmentId}-${domain.key}-${questionIndex + 1}-evidence-${evidenceIndex + 1}`,
                      type: item.type,
                      status: item.requested ? 'REQUESTED' : 'ACTIVE',
                      content: item.content,
                      sourceLabel: item.sourceLabel,
                      requestedAt: item.requested ? new Date() : null,
                    })),
                  },
                })),
              },
            })),
          },
        },
      });
    });
    res.status(201).json(serializeAssessment(assessment));
  } catch (error) { next(error); }
});

router.get('/assessments/:assessmentId', async (req, res, next) => {
  try { const assessment = await prisma.assessment.findUnique({ where: { id: req.params.assessmentId }, include: includeAssessment }); if (!assessment) return res.status(404).json({ error: 'Assessment not found' }); res.json(serializeAssessment(assessment)); } catch (error) { next(error); }
});

router.patch('/assessments/:assessmentId', async (req, res, next) => {
  try { const assessment = await prisma.assessment.update({ where: { id: req.params.assessmentId }, data: { stage: req.body?.stage, signalState: req.body?.signalState, status: req.body?.status }, include: includeAssessment }); res.json(serializeAssessment(assessment)); } catch (error) { next(error); }
});

router.patch('/questions/:questionId/response', async (req, res, next) => {
  try { const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''; if (!body) return res.status(400).json({ error: 'body is required' }); const response = await prisma.analystResponse.upsert({ where: { questionId: req.params.questionId }, create: { id: randomUUID(), questionId: req.params.questionId, body, status: 'Reviewed' }, update: { body, status: 'Reviewed' } }); await prisma.assessmentQuestion.update({ where: { id: req.params.questionId }, data: { state: 'Reviewed' } }); res.json(response); } catch (error) { next(error); }
});

router.get('/questions/:questionId/evidence', async (req, res, next) => {
  try {
    const evidence = await prisma.evidence.findMany({ where: { questionId: req.params.questionId }, orderBy: { createdAt: 'asc' } });
    res.json({ items: evidence });
  } catch (error) { next(error); }
});

router.post('/questions/:questionId/evidence', async (req, res, next) => {
  try { const evidence = await prisma.evidence.create({ data: { id: randomUUID(), questionId: req.params.questionId, type: req.body?.type || 'Missing', status: req.body?.requested ? 'REQUESTED' : 'ACTIVE', content: req.body?.content || 'Evidence requested from founder.', sourceLabel: req.body?.sourceLabel || '+ Request from founder', requestedAt: req.body?.requested ? new Date() : null } }); res.status(201).json(evidence); } catch (error) { next(error); }
});

router.patch('/evidence/:evidenceId', async (req, res, next) => {
  try { const evidence = await prisma.evidence.update({ where: { id: req.params.evidenceId }, data: { type: req.body?.type, status: req.body?.status, content: req.body?.content, sourceLabel: req.body?.sourceLabel } }); res.json(evidence); } catch (error) { next(error); }
});

module.exports = router;
