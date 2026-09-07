# Venture Diagnostic Agent
## Product Architecture + UI/UX Plan

Status: pre-implementation planning only
Target: Binance Agent OS
Product stage: early-stage crypto venture diagnostic and investment screening

## 1. Product Intent

The product turns an early crypto venture into an investment-committee-ready brief through structured questioning, evidence collection, market analysis, risk assessment, and an explicit recommendation. It is an analyst copilot, not an autonomous investment authority.

Primary user:
- Venture investor, accelerator partner, ecosystem lead, or investment analyst screening an early-stage crypto venture.

Primary job:
- Move from an unstructured venture pitch to a traceable `advance`, `hold`, or `pass` recommendation.

Operating principles:
- Every material conclusion must point to evidence, an assumption, or an unresolved question.
- The agent separates founder claims from independently verified facts.
- Uncertainty is visible rather than collapsed into a false precision score.
- The human investment committee owns the final decision.
- Binance Agent OS is treated as the orchestration surface; provider-specific data access remains behind adapters.

Non-goals for the first build:
- Automated trading or token execution.
- Definitive legal, tax, or compliance advice.
- A public founder CRM.
- A black-box investment score with no explanation.

## 2. Sloppi Routing Applied

This is a large greenfield application, so the selected Sloppi path is the full new-project lifecycle:

1. Understand product, users, stakes, and density.
2. Research analyst workstations, evidence-heavy fintech interfaces, and guided assessment flows.
3. Synthesize a design thesis before styling.
4. Build content architecture around questions, evidence, and decisions.
5. Define the design system and persistent `DESIGN.md` contract.
6. Inspect the implementation environment before scaffolding.
7. Implement incrementally.
8. Render and inspect mobile, tablet, desktop, and wide desktop.
9. Run visual and anti-slop audits.
10. Refine by impact and cost.

Relevant Sloppi modules for the next phase:
- `research/protocol.md`: research questions and reference constellation.
- `content/methodology.md`: content density and attention budget.
- `content/page-architecture.md`: section justification and non-generic composition.
- `design-system/methodology.md`: nine pre-token inquiries and design contract.
- `design-system/typography.md`: analytical type hierarchy and tabular figures.
- `design-system/color.md`: semantic risk/status color roles and contrast.
- `design-system/layout.md`: dense multi-column dock architecture.
- `implementation/interaction-implementation.md`: state model and focus behavior.
- `implementation/responsive-implementation.md`: mobile transformation.
- `audit/visual-audit.md` and `audit/anti-slop-audit.md`: rendered QA.

## 3. Design Thesis

A calm, audit-grade analyst workstation for making uncertain crypto opportunities legible. The interface combines dense, tabular evidence with a guided conversational investigation, using a warm neutral canvas, ink-like typography, and restrained signal colors; it rejects neon crypto spectacle, decorative score rings, generic SaaS cards, and unexplained AI confidence.

Selected visual tension:
- Dense + legible
- Technical + fiduciary
- Conversational + evidentiary
- Fast screening + deliberate decision-making

Chosen composition model:
- Dense multi-column dock for the application shell.
- Asymmetric two-column assessment views for question context and response work.
- Evidence tables and decision matrices instead of repeated card grids.
- Single-column guided steps only when the user must answer one question at a time.

## 4. Core User Flow

```text
Workspace
  -> Create assessment
  -> Enter venture identity and thesis
  -> Import or paste source material
  -> Agent builds an evidence inventory
  -> Founder / market / product / token / team questions
  -> Analyst answers, edits, or defers questions
  -> Market and comparable analysis
  -> Risk register and unresolved issues
  -> Agent produces an investment brief
  -> Analyst challenges findings and marks evidence quality
  -> Investment committee decision
  -> Export decision memo and preserve an audit trail
```

Assessment lifecycle:
- `Draft`: basic venture record exists.
- `Intake`: source material is being collected and normalized.
- `Questioning`: assessment questions are active.
- `Analysis`: market, product, token, team, and risk analyses are being assembled.
- `Committee ready`: required evidence and unresolved items are visible.
- `In committee`: decision discussion and votes are recorded.
- `Decided`: advance, hold, or pass is recorded with rationale.
- `Monitoring`: optional post-decision follow-up, deferred from first release.

Every stage has:
- Exit criteria.
- Completion percentage based on completed required checks, not time.
- Blocking issues.
- Evidence freshness and confidence.
- A visible next action.

## 5. Main Screens

### 5.1 Workspace / Screening Queue
Purpose: orient the analyst and surface the next highest-value action.

Primary regions:
- Left rail: workspace navigation and assessment filters.
- Header: active workspace, search, create assessment, user/role.
- Main queue: ventures grouped by lifecycle state.
- Right utility rail: due diligence alerts, stale evidence, committee calendar.

Key data:
- Venture name and category.
- Stage and last activity.
- Current recommendation direction, if any.
- Evidence completeness.
- Risk severity.
- Next required action.

No fabricated KPIs. Empty states explain what data is missing and why it matters.

### 5.2 Venture Intake
Purpose: create a defensible starting record.

Inputs:
- Venture name, URL, founder contact, geography, sector, stage.
- One-sentence thesis.
- Fund / ecosystem thesis fit.
- Fundraising round, target, valuation or token assumptions when known.
- Source imports: deck, memo, docs, repository, token docs, links, transcripts.

Interaction model:
- Structured form with autosave.
- Import queue that reports parsed, needs review, and failed items.
- Claim extraction preview before claims enter the evidence inventory.

### 5.3 Assessment Overview
Purpose: show the venture’s current state across the screening model.

Structure:
- Persistent venture header with stage, owner, and decision status.
- Progress rail for assessment domains.
- Main “decision surface” with thesis, current signal, blockers, and next action.
- Evidence freshness strip.
- Unresolved questions list.

Assessment domains:
- Problem and customer.
- Product and technical moat.
- Market and distribution.
- Team and execution.
- Token and protocol economics.
- Competitive landscape.
- Regulatory and operational risk.
- Fund / ecosystem fit.

### 5.4 Questioning Workspace
Purpose: productize VC-style questioning without pretending conversation alone is diligence.

Layout:
- Left: domain navigator and question completion.
- Center: active question thread with agent prompt, founder/analyst response, follow-up questions, and editable answer synthesis.
- Right: evidence inspector showing supporting claims, contradictions, confidence, and source links.

Controls:
- Answer question.
- Ask follow-up.
- Mark not applicable.
- Defer with reason.
- Flag contradiction.
- Request evidence.
- Edit agent synthesis.

### 5.5 Market Analysis
Purpose: make market claims testable and comparable.

Views:
- Market thesis and assumptions.
- Comparable ventures and protocols.
- Category map.
- Adoption / usage signals.
- Distribution channels.
- Market timing and catalysts.
- Assumption ledger.

Presentation:
- Comparison matrix for comparable ventures.
- Evidence-linked trend rows rather than decorative charts.
- Source date and method shown beside every external signal.

### 5.6 Risk Register
Purpose: turn diffuse concerns into owned, testable risk items.

Risk dimensions:
- Regulatory / jurisdiction.
- Token design and unlocks.
- Security and protocol dependencies.
- Treasury and runway.
- Team / governance.
- Market / liquidity.
- Distribution concentration.
- Data quality.

Each risk item contains:
- Severity.
- Likelihood.
- Impact.
- Evidence.
- Unknowns.
- Mitigation or diligence request.
- Owner.
- Status: open, monitoring, mitigated, accepted.

### 5.7 Analysis / Results
Purpose: synthesize the assessment while preserving traceability.

Top area:
- Recommendation direction: advance, hold, or pass.
- Confidence band, not a single pseudo-precise score.
- Three strongest supporting signals.
- Three material concerns.
- Decision blockers.

Main sections:
- Executive thesis.
- Domain-by-domain findings.
- Evidence ledger.
- Contradictions and missing data.
- Scenario view: base, upside, downside.
- Recommended next diligence actions.

Every generated statement can expand to show:
- Source.
- Source type.
- Timestamp.
- Extracted claim.
- Analyst edit history.
- Confidence and caveat.

### 5.8 Investment Committee Decision
Purpose: create a deliberate human decision checkpoint.

Structure:
- Pre-read summary with recommendation and unresolved risks.
- Decision questions requiring explicit response.
- Committee member positions: advance, hold, pass, abstain.
- Discussion notes linked to evidence or questions.
- Decision conditions and follow-ups.
- Final rationale, owner, and date.

Decision states:
- Pending committee.
- Advance with conditions.
- Advance.
- Hold for diligence.
- Pass.
- Reopen assessment.

The UI must make “hold” a first-class outcome rather than forcing a binary yes/no decision.

## 6. Dashboard Structure

Desktop shell:
- `240px` navigation rail.
- Fluid primary canvas.
- Optional `320px` context rail on assessment screens.
- Sticky venture header inside the primary canvas.
- Internal scrolling for long evidence lists and question threads.

Dashboard hierarchy:
1. Global context: workspace, venture, lifecycle, owner.
2. Decision state: recommendation direction, blockers, confidence band.
3. Work queue: next required actions and stale items.
4. Evidence health: verified, founder-provided, inferred, missing, contradictory.
5. Domain progress: question and evidence completion.
6. Activity trail: recent changes and committee events.

Responsive transformation:
- Desktop: three-region dock.
- Tablet: navigation collapses; context rail becomes a tabbed drawer.
- Mobile: one primary task per screen; evidence inspector becomes a bottom sheet; tables become labeled stacked rows; committee decision uses a focused stepper.
- No horizontal scrolling for core actions.

## 7. Venture Assessment Flow

### Phase A: Intake
1. Create venture record.
2. Capture thesis and stage.
3. Import source materials.
4. Review extracted claims.
5. Confirm evidence provenance.

Exit criteria: venture identity and initial source inventory are complete.

### Phase B: Baseline Questions
1. What problem exists, for whom, and how is it currently solved?
2. What has changed in the market to make this venture timely?
3. What is the product doing today versus planned?
4. What evidence supports usage, demand, retention, or willingness to pay?
5. What is genuinely defensible?

Exit criteria: each answer has a response status and at least one evidence state or explicit unknown.

### Phase C: Domain Analysis
Run domain modules in parallel where possible, but preserve dependencies:
- Product before moat.
- Market before sizing assumptions.
- Token mechanics before token upside.
- Team claims before execution confidence.
- Regulatory context before launch or distribution assumptions.

Exit criteria: all required domains have findings, open questions, and evidence quality labels.

### Phase D: Adversarial Review
The agent asks what would disprove the current thesis, surfaces contradictions, and tests downside scenarios.

Exit criteria: strongest counterargument and material unknowns are recorded.

### Phase E: Recommendation Draft
The agent generates a recommendation direction with conditions, not a final verdict.

Exit criteria: analyst has reviewed the draft and either accepted, edited, or rejected each material finding.

## 8. VC Questioning Flow

Question anatomy:
- Question intent.
- Why it matters.
- Expected evidence.
- Primary prompt.
- Follow-up branches.
- Red flags.
- Acceptable uncertainty.
- Completion rule.

Example:

```text
Intent: test whether usage is real and durable.
Prompt: Which user behavior demonstrates repeat value, and what cohort evidence supports it?
Evidence expected: dated usage data, cohort definition, methodology, source.
Follow-up: What changed after the last product or incentive shift?
Red flags: vanity metrics, undefined active user, no denominator, incentives mistaken for retention.
Completion: claim is supported, qualified, or explicitly unresolved.
```

Question categories:
- Founder thesis.
- Customer pain and behavior.
- Product reality.
- Distribution.
- Moat and competition.
- Team execution.
- Token / protocol economics.
- Legal and operational exposure.
- Fund fit and strategic value.
- Downside and failure modes.

Conversation states:
- Suggested.
- In progress.
- Answered.
- Needs evidence.
- Contradicted.
- Deferred.
- Not applicable.
- Reviewed by analyst.

Agent behavior rules:
- Ask one high-value question at a time in guided mode.
- Explain why a follow-up is being asked.
- Never convert missing evidence into a negative fact.
- Never treat founder-provided claims as verified.
- Allow analyst override with a reason.
- Preserve the raw response separately from the synthesized finding.

## 9. Analysis and Evidence Model

Evidence classes:
- `Verified`: independently checked or directly observable with method recorded.
- `Founder-provided`: supplied by the venture and not independently verified.
- `Inferred`: derived by the agent from available sources.
- `Missing`: expected but unavailable.
- `Contradictory`: sources materially disagree.
- `Stale`: source is outside the configured freshness window.

Evidence record:
- Claim.
- Source title and URL or uploaded artifact.
- Source type.
- Source owner.
- Published / observed date.
- Extraction location.
- Evidence class.
- Analyst notes.
- Confidence band.
- Last reviewed date.

Display rules:
- Every key finding has an evidence class adjacent to it.
- Confidence is shown as a labeled band with rationale, never only color or a percentage.
- Risk severity is paired with text and iconography.
- Charts include source, date range, denominator, and method.
- Missing data is visually distinct from negative performance.

## 10. Provisional Design System

### Visual language
- Audit-grade, calm, precise, and slightly editorial.
- Warm paper-like canvas with dark ink text and cool mineral surfaces.
- Hairline dividers and surface shifts create structure; shadows are rare.
- Signal colors are reserved for state and severity.
- No neon gradients, crypto coin imagery, floating glass cards, decorative blobs, or “AI magic” sparkle motifs.

### Typography
Roles:
- Display / section headings: a restrained high-character sans or contemporary grotesk, selected after reference research.
- UI and body: neutral humanist sans with strong small-size legibility.
- Data: monospace with tabular figures for timestamps, amounts, and metrics.

Rules:
- Use a minor-third scale for dense screens.
- Preserve `16px` body text on mobile.
- Use `text-wrap: balance` for headings.
- Keep long-form explanation near `65ch`.
- Numeric columns use tabular figures and consistent alignment.

### Color roles
Semantic roles, not component-specific raw colors:
- Canvas and alternate canvas.
- Surface, hover, active.
- Primary, secondary, and muted text.
- Brand action.
- Info, success, warning, danger.
- Evidence classes: verified, founder-provided, inferred, missing, contradictory, stale.
- Focus ring and structural borders.

Accessibility requirements:
- WCAG AA minimum for interactive and supporting text.
- Critical state never conveyed by color alone.
- Visible `2px` focus ring.
- Touch targets at least `44px`.

### Geometry and elevation
- Mostly square or lightly rounded utility surfaces; maximum radius `8px` unless a control needs stronger grouping.
- Structural boundaries use `1px` borders.
- Elevation comes from canvas/surface contrast and sticky positioning, not floating card stacks.
- Tables and logs use row dividers and zebra contrast only where scanning benefits.

### Spacing and density
- Base unit: `4px`; primary rhythm: `8px`.
- Dense data rows: `8px` to `12px` vertical padding.
- Guided question blocks: `16px` to `24px` padding.
- Major screen transitions: `32px` to `48px`.
- Preserve a quiet margin around decision-critical content.

### Motion
- Short state transitions for question completion, evidence expansion, and drawer movement.
- No perpetual motion or decorative parallax.
- Motion communicates state continuity and preserves spatial orientation.
- Respect reduced-motion preferences.

### Core components
- Workspace rail.
- Venture header.
- Assessment domain navigator.
- Evidence badge and evidence inspector.
- Question thread.
- Evidence ledger table.
- Risk register row.
- Confidence band.
- Decision matrix.
- Committee vote control.
- Source citation.
- Activity trail.
- Empty, loading, stale, error, and permission states.

## 11. Screen-Level Information Architecture

Primary navigation:
- Queue.
- Assessments.
- Evidence.
- Market analysis.
- Risk register.
- Committee.
- Settings / integrations.

Within a venture:
- Overview.
- Questions.
- Analysis.
- Evidence.
- Risks.
- Decision.
- Activity.

Global utilities:
- Search.
- Command menu.
- Notifications.
- Help / definitions.
- Role and workspace switcher.

## 12. First Implementation Slice

Do not build the entire product at once. The first vertical slice should prove the core loop:

1. Screening queue.
2. Create one venture assessment.
3. Assessment overview.
4. One questioning domain with 3 to 5 question states.
5. Evidence inspector with mocked but clearly labeled evidence classes.
6. Draft recommendation summary.

Defer until that slice is validated:
- Full market data integrations.
- Automated document ingestion.
- Committee collaboration beyond a basic decision record.
- Token analytics dashboards.
- Monitoring workflows.

Success criteria for slice one:
- A user can understand what to do next within 10 seconds.
- A user can distinguish verified evidence from assumptions within 3 seconds.
- A user can answer, defer, or request evidence for every question.
- A user can trace the draft recommendation to its supporting findings.
- The interface remains usable at desktop and mobile widths.

## 13. Plan Review

### What is strong
- The product has a clear operational job: screening and preparing a decision, not generic “AI analysis.”
- Evidence provenance is a first-class object, which prevents the UI from overstating model certainty.
- The hold state and conditions make the decision model realistic for venture work.
- The questioning flow is structured enough to be auditable while still allowing conversational interaction.
- The architecture supports a small first vertical slice instead of forcing a complete platform build.
- The layout model follows Sloppi’s dense multi-column dock guidance and avoids generic card-grid composition.

### Risks and unresolved decisions
- Binance Agent OS integration boundaries are unspecified. Before implementation, define the agent tool contract, auth model, source adapters, and whether Binance-specific data is available in the first slice.
- “Verified” must have an explicit verification policy. A URL fetch alone is not equivalent to independent validation.
- Market analysis can become misleading if comparable selection and data freshness are not visible. The first slice should use labeled fixtures, not implied live data.
- The assessment taxonomy may be too broad for a first release. The first slice should choose one domain, likely problem/customer plus product reality, and keep other domains visible as locked or upcoming.
- Committee permissions, reviewer roles, and audit retention need product decisions before collaborative implementation.
- Mobile is appropriate for review and triage, but not necessarily for dense evidence authoring. This should be validated with target users.

### Cheap validation checks before UI code
- Confirm the Binance Agent OS invocation and tool schema available to the build.
- Interview or test with one analyst using a five-question paper prototype.
- Test whether users understand the six evidence classes without a glossary.
- Test whether `advance`, `hold`, and `pass` are sufficient decision states.
- Define a single fixture venture with real-looking but explicitly synthetic evidence for the prototype.

### Review verdict
Proceed to research and a `DESIGN.md` contract only after the integration boundary and first-slice fixture are defined. The information architecture is coherent and implementation-ready at the planning level; it is intentionally not ready for full UI coding until evidence semantics and the first domain scope are locked.
