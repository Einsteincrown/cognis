const canonicalDomains = [
  {
    key: 'problem',
    label: 'Problem and customer',
    status: 'Complete',
    questions: [{
      prompt: 'What problem exists, for whom, and how is it currently solved?',
      context: 'Test whether the stated customer pain is specific, frequent, and materially underserved.',
      state: 'Reviewed',
      response: 'The customer pain is defined, with the remaining work focused on validating urgency across the target cohort.',
      evidence: [{ type: 'Founder-provided', content: 'Customer pain and target segment are described in the venture memo.', sourceLabel: 'Venture thesis memo' }],
    }],
  },
  {
    key: 'product',
    label: 'Product and technical moat',
    status: 'Complete',
    questions: [{
      prompt: 'What is the product doing today versus what is still planned?',
      context: 'Separate demonstrated product capability from roadmap claims and identify the defensible mechanism.',
      state: 'Reviewed',
      response: 'Core product capability is demonstrated; moat confidence depends on continued usage and implementation depth.',
      evidence: [{ type: 'Inferred', content: 'The current product surface supports the core workflow described by the team.', sourceLabel: 'Product review notes' }],
    }],
  },
  {
    key: 'market',
    label: 'Market and distribution',
    status: '1 blocker',
    blockerCount: 1,
    questions: [
      { prompt: "What makes the venture's distribution durable once incentives normalize?", context: 'Separate repeat behavior from incentive-driven volume and test whether distribution remains durable after incentives change.', state: 'Needs evidence', isBlocker: true, response: '', evidence: [{ type: 'Missing', content: 'Post-incentive cohort retention with a defined active-user denominator.', sourceLabel: '+ Request from founder', requested: true }] },
      { prompt: 'What evidence supports usage, demand, retention, or willingness to pay?', context: 'Validate the denominator, cohort window, and methodology behind usage claims before treating them as market traction.', state: 'Needs evidence', evidence: [{ type: 'Missing', content: 'Dated retention cohorts and methodology are not yet attached.', sourceLabel: '+ Request from founder', requested: true }] },
      { prompt: 'What has changed in the market to make this venture timely?', context: 'Connect the market timing claim to observable protocol, liquidity, or distribution conditions.', evidence: [{ type: 'Missing', content: 'Current market timing claim needs a dated external signal.', sourceLabel: '+ Request source', requested: true }] },
    ],
  },
  {
    key: 'team',
    label: 'Team and execution',
    status: '2 checks left',
    questions: [{ prompt: 'Which team capability is most important to execute the next milestone?', context: 'Test whether ownership, operating history, and the next milestone are concrete enough to support execution confidence.', evidence: [{ type: 'Missing', content: 'Milestone ownership and delivery evidence are still required.', sourceLabel: '+ Request from founder', requested: true }] }],
  },
  {
    key: 'token',
    label: 'Token and protocol economics',
    status: 'Not started',
    questions: [{ prompt: 'How do token mechanics support durable protocol value rather than short-term activity?', context: 'Review supply, liquidity, holder concentration, and the relationship between token demand and protocol usage.', tokenQuery: 'WBNB', binanceMode: 'details', evidence: [{ type: 'Missing', content: 'Token utility, supply assumptions, and market evidence need to be reconciled.', sourceLabel: '+ Request token model', requested: true }] }],
  },
  {
    key: 'competitive',
    label: 'Competitive landscape',
    status: 'Not started',
    questions: [{ prompt: 'What is genuinely defensible relative to comparable ventures and protocols?', context: 'Compare the product mechanism, distribution advantage, and evidence quality against credible alternatives.', evidence: [{ type: 'Missing', content: 'Comparable protocol set and comparison criteria are not yet recorded.', sourceLabel: '+ Request comparison set', requested: true }] }],
  },
  {
    key: 'regulatory',
    label: 'Regulatory and operational risk',
    status: 'Not started',
    questions: [{ prompt: 'Which regulatory or operational assumptions could change the launch and distribution plan?', context: 'Separate known obligations, jurisdictional uncertainty, and protocol dependencies from general risk language.', tokenQuery: 'WBNB', binanceMode: 'audit', evidence: [{ type: 'Missing', content: 'Contract and operational risk review has not started.', sourceLabel: '+ Request risk evidence', requested: true }] }],
  },
  {
    key: 'fit',
    label: 'Fund / ecosystem fit',
    status: 'Not started',
    questions: [{ prompt: 'Where can the fund provide strategic value beyond capital?', context: 'Make the fit claim specific to distribution, ecosystem access, expertise, or follow-on support.', evidence: [{ type: 'Missing', content: 'Specific fund contribution and success conditions are not yet recorded.', sourceLabel: '+ Request fit evidence', requested: true }] }],
  },
];

function getAssessmentStructure({ ventureName, hasToken }) {
  return canonicalDomains.map((domain) => {
    if (domain.key === 'token' && !hasToken) {
      return { ...domain, status: 'Not applicable', questions: domain.questions.map((question) => ({ ...question, state: 'Not applicable', tokenQuery: null, binanceMode: null, evidence: [] })) };
    }
    return {
      ...domain,
      questions: domain.questions.map((question) => ({
        ...question,
        prompt: question.prompt.replace('the venture', ventureName || 'the venture'),
        response: question.response?.replace('Orbital', ventureName || 'the venture') || '',
        evidence: question.evidence.map((item) => ({ ...item, content: item.content.replace('Orbital', ventureName || 'the venture'), sourceLabel: item.sourceLabel.replace('Orbital', ventureName || 'the venture') })),
      })),
    };
  });
}

module.exports = { getAssessmentStructure };
