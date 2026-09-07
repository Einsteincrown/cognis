const { PrismaClient } = require('@prisma/client');
const { getAssessmentStructure } = require('../src/services/assessmentTemplate');

const prisma = new PrismaClient();

const ventures = [
  { id: 'orbital', name: 'Orbital', category: 'Perpetuals infrastructure', stage: 'Analysis', signalState: 'Caution', progress: '68%', checks: '12 of 18 checks', isDemo: true, hasToken: true, tokenSymbol: 'WBNB', tokenChainId: '56', tokenContractAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
  { id: 'mosaic', name: 'Mosaic', category: 'Cross-chain identity', stage: 'Questioning', signalState: 'Promising', progress: '42%', checks: '8 of 18 checks', isDemo: true, hasToken: false },
  { id: 'tessera', name: 'Tessera', category: 'On-chain credit', stage: 'Committee ready', signalState: 'Positive', progress: '91%', checks: '16 of 18 checks', isDemo: true, hasToken: false },
  { id: 'meridian', name: 'Meridian', category: 'DeFi risk tooling', stage: 'Intake', signalState: 'Unclear', progress: '18%', checks: '3 of 18 checks', isDemo: true, hasToken: false },
  { id: 'wbnb-market-evidence-demo', name: 'WBNB Market Evidence Demo', category: 'Verified market evidence', stage: 'Analysis', signalState: 'Promising', progress: '42%', checks: '8 of 18 checks', isDemo: false, hasToken: true, tokenSymbol: 'WBNB', tokenChainId: '56', tokenContractAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
];

function id(...parts) { return parts.join('-'); }

async function main() {
  await prisma.evidence.deleteMany();
  await prisma.analystResponse.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessmentDomain.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.venture.deleteMany();

  for (const venture of ventures) {
    const assessmentId = id(venture.id, 'assessment-1');
    const structure = getAssessmentStructure({ ventureName: venture.name, hasToken: venture.hasToken });

    await prisma.venture.create({
      data: {
        id: venture.id,
        name: venture.name,
        category: venture.category,
        description: `${venture.name} is a ${venture.category} venture.`,
        isDemo: venture.isDemo,
        hasToken: venture.hasToken,
        tokenSymbol: venture.tokenSymbol || null,
        tokenChainId: venture.tokenChainId || null,
        tokenContractAddress: venture.tokenContractAddress || null,
        assessments: {
          create: {
            id: assessmentId,
            stage: venture.stage,
            signalState: venture.signalState,
            ownerDisplayName: 'Alex Morgan',
            committeeAt: venture.id === 'tessera' ? new Date('2026-09-10T16:00:00.000Z') : null,
            committeeStatus: venture.id === 'tessera' ? '2 pre-reads ready' : null,
            committeeCondition: venture.id === 'tessera' ? '1 decision condition open' : null,
            domains: {
              create: structure.map((domain, domainIndex) => ({
                id: id(assessmentId, domain.key),
                key: domain.key,
                label: domain.label,
                position: domainIndex,
                status: domain.status,
                blockerCount: domain.blockerCount || 0,
                questions: {
                  create: domain.questions.map((question, questionIndex) => ({
                    id: id(assessmentId, domain.key, questionIndex + 1),
                    prompt: question.prompt,
                    context: question.context,
                    position: questionIndex,
                    state: question.state || 'Suggested',
                    isBlocker: Boolean(question.isBlocker),
                    tokenQuery: question.tokenQuery || null,
                    binanceMode: question.binanceMode || null,
                    response: question.response ? {
                      create: {
                        id: id(assessmentId, domain.key, questionIndex + 1, 'response'),
                        body: question.response,
                        status: question.state === 'Reviewed' ? 'Reviewed' : 'Needs evidence',
                      },
                    } : undefined,
                    evidence: {
                      create: question.evidence.map((item, evidenceIndex) => ({
                        id: id(assessmentId, domain.key, questionIndex + 1, 'evidence', evidenceIndex + 1),
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
        },
      },
    });
  }

  console.log(`Seeded ${ventures.length} ventures with assessments, domains, questions, responses, and evidence.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
