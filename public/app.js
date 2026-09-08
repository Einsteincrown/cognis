const queueView = document.querySelector('#queueView');
const assessmentView = document.querySelector('#assessmentView');
const toast = document.querySelector('#toast');
const response = document.querySelector('#response');
const API_URL = '';
const BINANCE_BACKEND_URL = API_URL;
let toastTimer;
let binanceRequestTimer;
let activeAssessment = null;
let activeDomainId = 'market';
let activeQuestionIndex = 0;
let workspaceData = null;
let currentIntakeStep = 1;
let queueFilter = 'all';

let assessmentDomains = [];

function getVentureMonogram(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getVentureHue(name = '') {
  const hash = [...name].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0);
  return 190 + (hash % 145);
}

async function loadWorkspace() {
  const workspaceResponse = await fetch(`${API_URL}/api/workspace`, { headers: { Accept: 'application/json' } });
  if (!workspaceResponse.ok) throw new Error('Workspace load failed');
  workspaceData = await workspaceResponse.json();
  ventureAssessments = Object.fromEntries(workspaceData.ventures.map((venture) => [venture.id, {
    ...venture,
    assessmentId: venture.assessment?.id,
    avatar: getVentureMonogram(venture.name),
    avatarHue: getVentureHue(venture.name),
    updated: 'Updated just now',
    progress: `${venture.assessment?.progress || 0}%`,
    checks: venture.assessment?.checks || '0 checks',
    stage: venture.assessment?.stage || 'Intake',
  }]));
  renderQueueFromWorkspace();
}

function renderQueueFromWorkspace() {
  const body = document.querySelector('.assessment-table tbody');
  if (!body || !workspaceData) return;
  body.innerHTML = workspaceData.ventures.map((venture) => {
    const assessment = venture.assessment || {};
    const signal = assessment.signalState || 'Unclear';
    const blockers = assessment.domains?.filter((domain) => domain.blockerCount).length || 0;
    const stage = assessment.stage || 'Intake';
    const signalClass = signal === 'Caution' || signal === 'Unclear' ? 'signal-caution' : 'signal-positive';
    return `<tr class="assessment-row" data-assessment="${venture.id}" data-stage="${stage}" data-needs-review="${signal === 'Caution' || blockers > 0}"><td><div class="venture-cell"><span class="venture-avatar" style="--avatar-hue:${getVentureHue(venture.name)}" aria-hidden="true">${getVentureMonogram(venture.name)}</span><span><strong>${venture.name}</strong><small>${venture.category}</small></span></div></td><td>${venture.category}</td><td>${stage}</td><td><div class="evidence-meter"><strong>${assessment.progress || 0}%</strong><span class="meter"><i style="width:${assessment.progress || 0}%"></i></span></div></td><td><span class="signal-chip ${signalClass}">${signal}</span></td><td>Review assessment</td><td>Just now</td><td><button class="row-arrow" type="button" aria-label="Open ${venture.name} assessment">⋮</button></td></tr>`;
  }).join('');
  updateQueueSummary();
  body.querySelectorAll('[data-assessment]').forEach((item) => item.addEventListener('click', openAssessment));
  applyQueueFilters();
}

function updateQueueSummary() {
  if (!workspaceData) return;
  const ventures = workspaceData.ventures || [];
  const inProgress = ventures.filter(({ assessment }) => ['Questioning', 'Analysis'].includes(assessment?.stage)).length;
  const counts = {
    all: ventures.length,
    review: workspaceData.summary?.needsReview || 0,
    progress: inProgress,
    committee: workspaceData.summary?.committeeReady || 0,
  };

  Object.entries(counts).forEach(([key, value]) => {
    const node = document.querySelector(`[data-queue-count="${key}"]`);
    if (node) node.textContent = String(value).padStart(2, '0');
  });

  const summaryCounts = {
    active: workspaceData.summary?.activeAssessments || 0,
    review: workspaceData.summary?.needsReview || 0,
    committee: workspaceData.summary?.committeeReady || 0,
    stale: workspaceData.summary?.staleEvidence || 0,
  };
  Object.entries(summaryCounts).forEach(([key, value]) => {
    const node = document.querySelector(`[data-summary-count="${key}"]`);
    if (node) node.textContent = value;
  });
}

function applyQueueFilters() {
  const searchTerm = document.querySelector('#ventureSearch')?.value.trim().toLowerCase() || '';
  const selectedStage = document.querySelector('#stageFilter')?.value || 'all';
  document.querySelectorAll('.assessment-table tbody .assessment-row').forEach((row) => {
    const matchesSearch = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
    const matchesStage = selectedStage === 'all' || row.dataset.stage === selectedStage || row.querySelector('.stage')?.textContent.trim() === selectedStage;
    const stageText = row.dataset.stage || row.children[2]?.textContent.trim();
    const matchesQueue = queueFilter === 'all'
      || (queueFilter === 'review' && (row.dataset.needsReview === 'true' || row.querySelector('.signal-caution')))
      || (queueFilter === 'progress' && ['Questioning', 'Analysis'].includes(stageText))
      || (queueFilter === 'committee' && stageText === 'Committee ready');
    row.hidden = !(matchesSearch && matchesStage && matchesQueue);
  });
  const visibleRows = [...document.querySelectorAll('.assessment-table tbody .assessment-row')].filter((row) => !row.hidden);
  document.querySelector('#emptyFilter')?.classList.toggle('is-hidden', visibleRows.length > 0);
}

function setIntakeStep(step) {
  currentIntakeStep = Math.max(1, Math.min(3, step));
  document.querySelectorAll('[data-intake-step]').forEach((panel) => panel.classList.toggle('is-hidden', Number(panel.dataset.intakeStep) !== currentIntakeStep));
  document.querySelectorAll('[data-step-indicator]').forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle('is-current', indicatorStep === currentIntakeStep);
    indicator.classList.toggle('is-complete', indicatorStep < currentIntakeStep);
    indicator.setAttribute('aria-current', indicatorStep === currentIntakeStep ? 'step' : 'false');
  });
  document.querySelector('#intakeBack')?.classList.toggle('is-hidden', currentIntakeStep === 1);
  document.querySelector('#intakeContinue')?.classList.toggle('is-hidden', currentIntakeStep === 3);
  document.querySelector('#intakeSubmit')?.classList.toggle('is-hidden', currentIntakeStep !== 3);
  if (currentIntakeStep === 3) renderIntakeReview();
}

function renderIntakeReview() {
  const form = document.querySelector('#intakeForm');
  const review = document.querySelector('#intakeReview');
  if (!form || !review) return;
  const values = [
    ['Venture', form.querySelector('#intakeName')?.value || 'Not provided'],
    ['Category', form.querySelector('#intakeCategory')?.value || 'Not provided'],
    ['Stage', form.querySelector('#intakeStage')?.value || 'Not provided'],
    ['Website', form.querySelector('#intakeWebsite')?.value || 'Not provided'],
    ['Token', form.querySelector('#intakeHasToken')?.checked ? `${form.querySelector('#intakeTokenSymbol')?.value || 'Unnamed'} · chain ${form.querySelector('#intakeTokenChain')?.value || 'not selected'}` : 'No token'],
  ];
  review.innerHTML = values.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
}

async function continueIntake() {
  const form = document.querySelector('#intakeForm');
  const errorNode = document.querySelector('#intakeFormError');
  errorNode?.classList.remove('show');
  if (currentIntakeStep === 1) {
    const required = ['#intakeName', '#intakeCategory', '#intakeStage', '#intakeDescription'].map((selector) => form.querySelector(selector));
    const invalid = required.find((field) => !field.value.trim());
    if (invalid) {
      errorNode.textContent = 'Complete the required venture details before continuing.';
      errorNode.classList.add('show');
      invalid.focus();
      return;
    }
  }
  if (currentIntakeStep === 2 && form.querySelector('#intakeHasToken')?.checked && !(await verifyIntakeToken())) return;
  setIntakeStep(currentIntakeStep + 1);
}

function openIntakeForm() {
  showWorkspaceView('intake');
  const form = document.querySelector('#intakeForm');
  const tokenFields = document.querySelector('#tokenFields');
  const hasTokenInput = document.querySelector('#intakeHasToken');
  if (form) form.reset();
  if (tokenFields) tokenFields.style.display = 'none';
  if (hasTokenInput) hasTokenInput.checked = false;
  const statusNode = document.querySelector('#tokenVerificationStatus');
  if (statusNode) {
    statusNode.textContent = '';
    statusNode.className = 'verification-status';
  }
  const errorNode = document.querySelector('#intakeFormError');
  if (errorNode) {
    errorNode.textContent = '';
    errorNode.classList.remove('show');
  }
  setIntakeStep(1);
}

function closeIntakeForm() {
  showWorkspaceView('queue');
}

function toggleTokenFields() {
  const hasTokenInput = document.querySelector('#intakeHasToken');
  const tokenFields = document.querySelector('#tokenFields');
  if (!hasTokenInput || !tokenFields) return;
  tokenFields.style.display = hasTokenInput.checked ? 'block' : 'none';
  if (!hasTokenInput.checked) {
    const statusNode = document.querySelector('#tokenVerificationStatus');
    if (statusNode) {
      statusNode.textContent = '';
      statusNode.className = 'verification-status';
    }
  }
}

async function verifyIntakeToken() {
  const hasTokenInput = document.querySelector('#intakeHasToken');
  const symbol = document.querySelector('#intakeTokenSymbol')?.value?.trim();
  const chainId = document.querySelector('#intakeTokenChain')?.value?.trim();
  const contractAddress = document.querySelector('#intakeTokenContract')?.value?.trim();
  const statusNode = document.querySelector('#tokenVerificationStatus');

  if (!hasTokenInput || !hasTokenInput.checked) {
    if (statusNode) {
      statusNode.textContent = 'No token verification is required for a non-token venture.';
      statusNode.className = 'verification-status pending';
    }
    return true;
  }

  if (!symbol || !chainId || !contractAddress) {
    if (statusNode) {
      statusNode.textContent = 'Enter the token symbol, chain, and contract address before verifying.';
      statusNode.className = 'verification-status error';
    }
    return false;
  }

  if (statusNode) {
    statusNode.textContent = 'Verifying token...';
    statusNode.className = 'verification-status pending';
  }

  try {
    const response = await fetch(`${API_URL}/api/token-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, chainId, contractAddress }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || 'Token verification failed.');
    if (statusNode) {
      statusNode.textContent = `Verified ${payload.token.symbol} on chain ${payload.token.chainId}.`;
      statusNode.className = 'verification-status success';
    }
    return true;
  } catch (error) {
    if (statusNode) {
      statusNode.textContent = error.message || 'Token verification failed.';
      statusNode.className = 'verification-status error';
    }
    return false;
  }
}

async function submitIntakeForm(event) {
  event.preventDefault();
  if (currentIntakeStep < 3) {
    await continueIntake();
    return;
  }
  const form = event.currentTarget;
  const errorNode = document.querySelector('#intakeFormError');
  const name = form.querySelector('#intakeName')?.value?.trim();
  const category = form.querySelector('#intakeCategory')?.value?.trim();
  const stage = form.querySelector('#intakeStage')?.value?.trim();
  const description = form.querySelector('#intakeDescription')?.value?.trim();
  const website = form.querySelector('#intakeWebsite')?.value?.trim();
  const hasToken = form.querySelector('#intakeHasToken')?.checked || false;
  const tokenSymbol = form.querySelector('#intakeTokenSymbol')?.value?.trim();
  const tokenChainId = form.querySelector('#intakeTokenChain')?.value?.trim();
  const tokenContractAddress = form.querySelector('#intakeTokenContract')?.value?.trim();

  if (!name || !category || !stage || !description) {
    if (errorNode) {
      errorNode.textContent = 'Please complete all required fields.';
      errorNode.classList.add('show');
    }
    return;
  }

  if (website && !/^https?:\/\//i.test(website)) {
    if (errorNode) {
      errorNode.textContent = 'Website must start with http:// or https://';
      errorNode.classList.add('show');
    }
    return;
  }

  if (hasToken) {
    const verified = await verifyIntakeToken();
    if (!verified) {
      if (errorNode) {
        errorNode.textContent = 'Token verification must succeed before creating the venture.';
        errorNode.classList.add('show');
      }
      return;
    }
  }

  try {
    const payload = {
      name,
      category,
      stage,
      description,
      website: website || undefined,
      hasToken,
      tokenSymbol: hasToken ? tokenSymbol : undefined,
      tokenChainId: hasToken ? tokenChainId : undefined,
      tokenContractAddress: hasToken ? tokenContractAddress : undefined,
    };

    const response = await fetch(`${API_URL}/api/ventures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error || 'Venture creation failed.');

    const venture = result.venture;
    const assessment = result.assessment;
    if (venture?.id && assessment?.id) {
      const ventureRecord = { id: venture.id, name: venture.name, category: venture.category, assessmentId: assessment.id, avatar: getVentureMonogram(venture.name), avatarHue: getVentureHue(venture.name), updated: 'Updated just now', progress: `${assessment.progress || 0}%`, checks: assessment.checks || '0 checks', stage: assessment.stage || 'Intake' };
      ventureAssessments[venture.id] = ventureRecord;
      await openAssessment({ currentTarget: { dataset: { assessment: venture.id } } });
      showToast('Venture created and assessment opened.');
      return;
    }

    showToast('Venture created.');
    closeIntakeForm();
  } catch (error) {
    if (errorNode) {
      errorNode.textContent = error.message || 'Venture creation failed.';
      errorNode.classList.add('show');
    }
    showToast(error.message || 'Venture creation failed.');
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

let ventureAssessments = {};

function getActiveQuestion() {
  const domain = assessmentDomains.find((item) => item.id === activeDomainId) || assessmentDomains[0];
  return domain.questions[activeQuestionIndex] || domain.questions[0];
}

function renderDomainRail() {
  const domainNav = document.querySelector('.domain-rail nav');
  if (!domainNav) return;

  domainNav.innerHTML = assessmentDomains.map((domain, index) => {
    const domainMarker = domain.marker
      || (domain.blockerCount ? String(domain.blockerCount) : null)
      || (/complete/i.test(domain.status || '') ? '✓' : '—');
    return `
    <button class="domain-item ${domain.id === activeDomainId ? 'is-active' : ''} ${index < 2 ? 'is-current' : ''}" type="button" data-domain-id="${domain.id}">
      <span class="domain-number">${String(index + 1).padStart(2, '0')}</span>
      <span><strong>${domain.label}</strong><small>${domain.status}</small></span>
      <b class="domain-marker" aria-label="${domain.blockerCount ? `${domain.blockerCount} blockers` : domain.status || 'Not started'}">${domainMarker}</b>
    </button>
  `;
  }).join('');

  domainNav.querySelectorAll('[data-domain-id]').forEach((item) => {
    item.addEventListener('click', () => {
      activeDomainId = item.dataset.domainId;
      activeQuestionIndex = 0;
      renderAssessmentDetail();
    });
  });
}

function renderEvidenceInspector(question) {
  const inspector = document.querySelector('.evidence-inspector');
  if (!inspector) return;

  const claims = question.evidence || [];
  inspector.querySelectorAll('.claim-block').forEach((claim) => claim.remove());
  inspector.querySelector('#binanceEvidenceBlock')?.remove();

  const footnote = inspector.querySelector('.inspector-footnote');
  claims.forEach((claim) => {
    const block = document.createElement('div');
    block.className = 'claim-block';
    block.innerHTML = `
      <span class="evidence-badge ${claim.className}">${claim.type}</span>
      <p>${claim.text}</p>
      <button class="source-link ${claim.request ? 'source-request' : ''}" type="button">${claim.source}${claim.request ? '' : ' <span>↗</span>'}</button>
    `;
    if (claim.request) {
      block.querySelector('button').addEventListener('click', async () => {
        await fetch(`${API_URL}/api/questions/${question.id}/evidence`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requested: true, content: claim.text, sourceLabel: claim.source }) });
        showToast('Evidence request saved to the assessment trail.');
      });
    }
    inspector.insertBefore(block, footnote);
  });
}

function renderAssessmentDetail() {
  if (!activeAssessment) return;
  const question = getActiveQuestion();
  const domain = assessmentDomains.find((item) => item.id === activeDomainId) || assessmentDomains[0];
  const headerAvatar = document.querySelector('.assessment-heading .venture-avatar');
  const title = document.querySelector('#assessmentTitle');
  const headerMeta = document.querySelector('.assessment-heading p:last-child');
  const headerStage = document.querySelector('.assessment-header-actions .stage');
  const progress = document.querySelector('.progress-total strong');
  const progressLabel = document.querySelector('.progress-total span');
  const progressTrack = document.querySelector('.progress-track i');
  const currentDomainTitle = document.querySelector('.assessment-intro h2');
  const currentDomainDescription = document.querySelector('.assessment-intro p');
  const signal = document.querySelector('.assessment-intro .signal-chip');
  const questionIndex = document.querySelector('.question-index');
  const questionState = document.querySelector('.question-state');
  const questionTitle = document.querySelector('.question-card h3');
  const questionContext = document.querySelector('.question-context');
  const questionDots = document.querySelector('.question-nav > span');

  headerAvatar.className = 'venture-avatar';
  headerAvatar.style.setProperty('--avatar-hue', activeAssessment.avatarHue || getVentureHue(activeAssessment.name));
  headerAvatar.textContent = activeAssessment.avatar;
  title.textContent = activeAssessment.name;
  headerMeta.innerHTML = `${activeAssessment.category} <span class="header-separator">·</span> ${activeAssessment.updated}`;
  headerStage.textContent = activeAssessment.stage;
  const progressValue = Math.max(0, Math.min(100, Number.parseFloat(activeAssessment.progress) || 0));
  progress.textContent = `${progressValue}%`;
  progressLabel.textContent = activeAssessment.checks;
  progressTrack.style.width = `${progressValue}%`;
  currentDomainTitle.textContent = domain.label;
  currentDomainDescription.textContent = `Work through the ${domain.label.toLowerCase()} claims and record what is supported, unresolved, or contradicted.`;
  signal.innerHTML = `<i></i> ${question.state === 'Needs evidence' ? 'Caution' : question.state}`;
  signal.className = `signal-chip ${question.state === 'Needs evidence' ? 'signal-caution' : 'signal-neutral'}`;
  questionIndex.textContent = `Question ${activeQuestionIndex + 1} / ${domain.questions.length}`;
  questionState.innerHTML = `<span class="status-dot ${question.state === 'Needs evidence' ? 'status-dot-amber' : ''}"></span> ${question.state}`;
  questionTitle.textContent = question.prompt;
  questionContext.textContent = question.context;
  response.value = question.response || '';
  questionDots.innerHTML = domain.questions.map((item, index) => `<i class="question-dot ${index < activeQuestionIndex ? 'is-done' : ''} ${index === activeQuestionIndex ? 'is-current' : ''}" data-question-index="${index}"></i>`).join('');
  questionDots.querySelectorAll('[data-question-index]').forEach((dot) => {
    dot.addEventListener('click', () => {
      activeQuestionIndex = Number(dot.dataset.questionIndex);
      renderAssessmentDetail();
    });
  });
  const questionNavButtons = document.querySelectorAll('.question-nav .button');
  questionNavButtons[0].onclick = () => {
    if (activeQuestionIndex > 0) {
      activeQuestionIndex -= 1;
      renderAssessmentDetail();
    }
  };
  questionNavButtons[1].onclick = () => {
    if (activeQuestionIndex < domain.questions.length - 1) {
      activeQuestionIndex += 1;
      renderAssessmentDetail();
    }
  };
  questionNavButtons[0].disabled = activeQuestionIndex === 0;
  questionNavButtons[1].disabled = activeQuestionIndex === domain.questions.length - 1;
  renderDomainRail();
  renderEvidenceInspector(question);
  scheduleBinanceLoad();
}

async function openAssessment(event) {
  const item = event.currentTarget;
  const assessmentId = item.dataset.assessment || item.dataset.openAssessment || 'orbital';
  const venture = ventureAssessments[assessmentId] || ventureAssessments.orbital;
  if (!venture?.assessmentId) return;
  const assessmentResponse = await fetch(`${API_URL}/api/assessments/${venture.assessmentId}`);
  if (!assessmentResponse.ok) return showToast('Assessment could not be loaded.');
  const assessment = await assessmentResponse.json();
  activeAssessment = { ...venture, ...assessment, domains: assessment.domains };
  assessmentDomains = assessment.domains.map((domain) => ({ ...domain, id: domain.key }));
  activeDomainId = 'market';
  activeQuestionIndex = 0;
  queueView.classList.add('is-hidden');
  assessmentView.classList.remove('is-hidden');
  renderAssessmentDetail();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAssessment() {
  window.clearTimeout(binanceRequestTimer);
  activeAssessment = null;
  assessmentView.classList.add('is-hidden');
  showWorkspaceView('queue');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ensureBinanceEvidenceBlock() {
  let block = document.getElementById('binanceEvidenceBlock');
  if (!block) {
    block = document.createElement('div');
    block.id = 'binanceEvidenceBlock';
    block.className = 'binance-evidence is-hidden';
    block.innerHTML = `
      <div class="binance-header">
        <span class="section-kicker">Evidence source</span>
        <strong>Binance</strong>
      </div>
      <div id="binanceEvidenceContent" class="binance-content"></div>
    `;

    const evidenceInspector = document.querySelector('.evidence-inspector');
    if (evidenceInspector) {
      evidenceInspector.appendChild(block);
    }
  }
  return block;
}

function getRelevantTokenSymbol() {
  const activeQuestion = getActiveQuestion();
  if (activeAssessment?.tokenSymbol) return activeAssessment.tokenSymbol;
  if (activeQuestion.tokenQuery) return activeQuestion.tokenQuery;

  const sourceText = [
    document.querySelector('#assessmentTitle')?.textContent || '',
    document.querySelector('.question-card h3')?.textContent || '',
    document.querySelector('.question-context')?.textContent || '',
    response?.value || '',
  ].join(' ');

  if (!sourceText) return null;

  const tokens = ['BNB', 'ETH', 'ETHEREUM', 'BTC', 'SOL', 'SOLANA', 'USDT', 'USDC', 'ADA', 'ARB', 'AVAX', 'LINK', 'APT', 'OP', 'DOGE', 'SUI'];
  const normalized = sourceText.toUpperCase();
  const match = tokens.find((token) => normalized.includes(token));
  return match || null;
}

function renderBinanceLoadingState() {
  const block = ensureBinanceEvidenceBlock();
  const content = document.getElementById('binanceEvidenceContent');
  if (!content) return;

  block.classList.remove('is-hidden');
  content.innerHTML = `
    <div class="binance-state">
      <span class="binance-pill">Loading Binance evidence</span>
      <p>Checking the live Binance market data relevant to this venture claim.</p>
    </div>
  `;
}

function renderBinanceUnavailableState() {
  const block = ensureBinanceEvidenceBlock();
  const content = document.getElementById('binanceEvidenceContent');
  if (!content) return;

  block.classList.add('is-hidden');
  content.innerHTML = '';
}

function formatUsd(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num);
}

function renderBinanceSuccessState(data) {
  const block = ensureBinanceEvidenceBlock();
  const content = document.getElementById('binanceEvidenceContent');
  if (!content) return;

  const summary = data.summary || {};
  const rankingItems = Array.isArray(data.rankings?.items) ? data.rankings.items.slice(0, 3) : [];
  const riskLevel = data.audit?.riskLevel;
  const riskLevelText = data.audit?.riskLevelEnum || (riskLevel === 0 ? 'LOW' : riskLevel != null ? 'UNKNOWN' : 'N/A');
  const evidenceMode = data.mode || 'market';

  block.classList.remove('is-hidden');
  content.innerHTML = `
    <div class="binance-summary-grid">
      <div class="binance-metric">
        <span class="binance-label">Token</span>
        <strong>${summary.symbol || 'N/A'}</strong>
      </div>
      <div class="binance-metric">
        <span class="binance-label">Price</span>
        <strong>${formatUsd(summary.price)}</strong>
      </div>
      <div class="binance-metric">
        <span class="binance-label">24h volume</span>
        <strong>${formatUsd(summary.volume24h)}</strong>
      </div>
      <div class="binance-metric">
        <span class="binance-label">Market cap</span>
        <strong>${formatUsd(summary.marketCap)}</strong>
      </div>
      <div class="binance-metric">
        <span class="binance-label">Liquidity</span>
        <strong>${formatUsd(summary.liquidity)}</strong>
      </div>
      <div class="binance-metric">
        <span class="binance-label">Holders</span>
        <strong>${summary.holders || 'N/A'}</strong>
      </div>
    </div>
    ${evidenceMode === 'market' ? `
      <div class="binance-subsection">
        <div class="binance-subtitle">Market ranking</div>
        ${rankingItems.length ? `
          <ul class="binance-list">
            ${rankingItems.map((item) => `
              <li>
                <span>#${item.rank ?? '—'}</span>
                <span>${item.symbol || 'Token'}</span>
                <span>${formatUsd(item.marketCap)}</span>
              </li>
            `).join('')}
          </ul>
        ` : `<p class="binance-empty">No live ranking data available for this market.</p>`}
      </div>
    ` : ''}
    ${evidenceMode === 'audit' ? `
      <div class="binance-subsection">
        <div class="binance-subtitle">Token audit</div>
        <p class="binance-audit">
          ${data.audit?.isSupported ? `Risk: ${riskLevelText}` : 'Audit unavailable for this asset on the selected chain.'}
        </p>
      </div>
    ` : ''}
  `;
}

function renderBinanceErrorState(message) {
  const block = ensureBinanceEvidenceBlock();
  const content = document.getElementById('binanceEvidenceContent');
  if (!content) return;

  block.classList.remove('is-hidden');
  content.innerHTML = `
    <div class="binance-state binance-state-error">
      <span class="binance-pill binance-pill-error">Binance unavailable</span>
      <p>${message || 'Live Binance evidence could not be loaded right now.'}</p>
    </div>
  `;
}

async function loadBinanceEvidence() {
  const detectedToken = getRelevantTokenSymbol();
  if (!detectedToken) {
    renderBinanceUnavailableState();
    return;
  }

  renderBinanceLoadingState();

  try {
    const evidenceMode = getActiveQuestion().binanceMode || 'market';
    const searchUrl = `${BINANCE_BACKEND_URL}/api/binance/tokens/search?keyword=${encodeURIComponent(detectedToken)}&chainIds=56`;
    const searchResponse = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (!searchResponse.ok) {
      throw new Error('Token search failed');
    }

    const searchData = await searchResponse.json();
    const match = activeAssessment?.tokenContractAddress ? { symbol: activeAssessment.tokenSymbol, chainId: activeAssessment.tokenChainId, contractAddress: activeAssessment.tokenContractAddress } : ((searchData.items || []).find((item) => item.symbol && item.symbol.toUpperCase() === detectedToken) || (searchData.items || [])[0]);

    if (!match || !match.contractAddress) {
      renderBinanceUnavailableState();
      return;
    }

    const detailsResponse = evidenceMode === 'audit' ? null : fetch(`${BINANCE_BACKEND_URL}/api/binance/tokens/${match.chainId || '56'}/${encodeURIComponent(match.contractAddress)}`);
    const rankingsResponse = evidenceMode === 'market' ? fetch(`${BINANCE_BACKEND_URL}/api/binance/market/rank?chainId=${match.chainId || '56'}&rankType=10&period=50&sortBy=70&page=1&size=3`) : null;
    const auditResponse = evidenceMode === 'audit' ? fetch(`${BINANCE_BACKEND_URL}/api/binance/tokens/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainId: match.chainId || '56', contractAddress: match.contractAddress }),
    }) : null;
    const responses = await Promise.all([detailsResponse, rankingsResponse, auditResponse]);

    if (responses.some((item) => item && !item.ok)) {
      throw new Error('One or more Binance data sources failed');
    }

    const details = responses[0] ? await responses[0].json() : {};
    const rankings = responses[1] ? await responses[1].json() : { items: [] };
    const audit = responses[2] ? await responses[2].json() : {};

    renderBinanceSuccessState({
      mode: evidenceMode,
      summary: {
        symbol: details.symbol || match.symbol,
        price: details.price,
        volume24h: details.volume24h,
        marketCap: details.marketCap,
        liquidity: details.liquidity,
        holders: details.holders,
      },
      rankings,
      audit,
    });
  } catch (error) {
    console.error('Binance evidence fetch failed:', error);
    renderBinanceErrorState('Live Binance evidence could not be loaded right now.');
  }
}

function scheduleBinanceLoad() {
  window.clearTimeout(binanceRequestTimer);
  binanceRequestTimer = window.setTimeout(() => {
    loadBinanceEvidence();
  }, 350);
}

document.querySelectorAll('[data-assessment], [data-open-assessment]').forEach((item) => {
  item.addEventListener('click', openAssessment);
});

document.querySelector('#backToQueue').addEventListener('click', closeAssessment);
document.querySelector('#newAssessment').addEventListener('click', openIntakeForm);
document.querySelector('#draftRecommendation').addEventListener('click', () => showToast('Draft recommendation created from reviewed findings.'));
document.querySelector('#requestEvidence').addEventListener('click', () => showToast('Evidence request queued for the founder.'));
document.querySelector('#inspectorRequest').addEventListener('click', () => showToast('Evidence request queued for the founder.'));
document.querySelector('#saveResponse').addEventListener('click', async () => {
  const savedText = response.value.trim();
  if (!savedText) {
    response.focus();
    showToast('Add an analyst response before saving.');
    return;
  }
  const activeQuestion = getActiveQuestion();
  const saveResult = await fetch(`${API_URL}/api/questions/${activeQuestion.id}/response`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: savedText }) });
  if (!saveResult.ok) return showToast('Response could not be saved.');
  activeQuestion.response = savedText;
  activeQuestion.state = 'Reviewed';
  showToast('Response saved to the assessment trail.');
  renderAssessmentDetail();
});

function showWorkspaceView(viewId) {
  window.clearTimeout(binanceRequestTimer);
  activeAssessment = null;
  assessmentView.classList.add('is-hidden');
  queueView.classList.toggle('is-hidden', viewId !== 'queue');
  document.querySelectorAll('[data-workspace-view]').forEach((view) => {
    view.classList.toggle('is-hidden', view.dataset.workspaceView !== viewId);
  });
  document.querySelectorAll('.nav-item[data-view]').forEach((navItem) => {
    navItem.classList.toggle('is-active', navItem.dataset.view === viewId);
  });
  const activeNavItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  const breadcrumb = document.querySelector('.breadcrumbs strong');
  if (breadcrumb && activeNavItem) breadcrumb.textContent = activeNavItem.textContent.trim();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
  item.addEventListener('click', () => showWorkspaceView(item.dataset.view));
});

document.querySelectorAll('[data-action="new-assessment"]').forEach((item) => {
  item.addEventListener('click', openIntakeForm);
});
document.querySelectorAll('[data-action="open-assessment"]').forEach((item) => {
  item.addEventListener('click', openAssessment);
});
document.querySelector('[data-action="test-connection"]')?.addEventListener('click', () => showToast('Binance Agent OS is connected and responding.'));
document.querySelector('#intakeHasToken')?.addEventListener('change', toggleTokenFields);
document.querySelector('#intakeVerifyToken')?.addEventListener('click', verifyIntakeToken);
document.querySelector('#intakeCancel')?.addEventListener('click', closeIntakeForm);
document.querySelector('#intakeCancelBtn')?.addEventListener('click', closeIntakeForm);
document.querySelector('#intakeForm')?.addEventListener('submit', submitIntakeForm);
document.querySelector('#intakeContinue')?.addEventListener('click', continueIntake);
document.querySelector('#intakeBack')?.addEventListener('click', () => setIntakeStep(currentIntakeStep - 1));
document.querySelector('#ventureSearch')?.addEventListener('input', applyQueueFilters);
document.querySelector('#stageFilter')?.addEventListener('change', applyQueueFilters);
document.querySelectorAll('[data-queue-filter]').forEach((button) => button.addEventListener('click', () => {
  queueFilter = button.dataset.queueFilter;
  document.querySelectorAll('[data-queue-filter]').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  applyQueueFilters();
}));

document.querySelector('#openQuestionDomain')?.addEventListener('click', () => {
  document.querySelector('#response').focus();
});

if (response) {
  response.addEventListener('input', scheduleBinanceLoad);
}

ensureBinanceEvidenceBlock();
renderBinanceUnavailableState();
loadWorkspace().catch((error) => {
  console.error('Workspace load failed:', error);
  showToast('Workspace data could not be loaded.');
});
