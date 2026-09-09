# Cognis

### From Signal to Conviction.

**Cognis is an early-stage crypto venture diagnostic and investment-screening agent for Binance Agent OS, productizing VC-style questioning, market analysis, evidence gathering, and investment-committee decision-making.**

Instead of relying on scattered research, spreadsheets, token dashboards, and subjective investment notes, Cognis provides a structured workspace for evaluating ventures from initial screening through committee readiness.

---

## The Problem

Early-stage crypto investment decisions require analysts to combine several different forms of diligence:

- Founder and team assessment
- Problem and customer validation
- Product and technical evaluation
- Market and distribution analysis
- Token and protocol economics
- Competitive positioning
- Regulatory and operational risk
- Fund and ecosystem fit
- On-chain and market intelligence

Much of this information lives across disconnected tools.

This makes diligence difficult to standardize, evidence difficult to trace, and investment decisions difficult to defend.

**Cognis turns this process into a structured investment workflow.**

---

## How Cognis Works

```text
Venture Intake
      ↓
Token Verification
      ↓
Create Assessment
      ↓
Structured VC Diligence
      ↓
Evidence + Binance Intelligence
      ↓
Progress & Blocker Analysis
      ↓
Committee Readiness
      ↓
Investment Committee Review
```

An analyst creates a venture, Cognis generates a structured assessment, and the venture moves through a consistent diligence process.

For crypto ventures, Cognis enriches the assessment with live Binance market and token intelligence.

---

## Core Features

### Venture Screening Queue

A central workspace for monitoring ventures currently moving through the investment pipeline.

The queue exposes:

- Venture
- Assessment stage
- Progress
- Signal state
- Blockers
- Next actions
- Committee readiness

All venture and assessment state is persisted through the backend rather than being stored as frontend fixtures.

---

### Venture Intake

Analysts can create new ventures directly inside Cognis.

Core information includes:

- Venture name
- Category
- Stage
- Description
- Website
- Token status

For tokenized ventures, Cognis also captures:

- Token symbol
- Chain ID
- Contract address

Chain ID + contract address are treated as the authoritative token identity.

---

### Structured Investment Assessment

Every venture receives a standardized eight-domain diligence framework:

1. **Problem and Customer**
2. **Product and Technical Moat**
3. **Market and Distribution**
4. **Team and Execution**
5. **Token and Protocol Economics**
6. **Competitive Landscape**
7. **Regulatory and Operational Risk**
8. **Fund / Ecosystem Fit**

Each domain contains investment questions that analysts can investigate and respond to.

Responses are persisted and contribute to the assessment's completion state.

For ventures without a token, Token and Protocol Economics is automatically treated as **Not Applicable**.

---

## Binance Agent OS Integration

Cognis uses Binance ecosystem intelligence as part of the investment diligence workflow rather than treating market data as a separate dashboard.

The integration runs through the Cognis backend.

```text
Cognis UI
    │
    ▼
Express API
    │
    ▼
Cognis Binance Service
    │
    ▼
Binance / Agent OS Intelligence
    │
    ├── Token Search
    ├── Token Information
    ├── Token Audit
    └── Market Rankings
```

The browser never needs to call Binance directly.

### Binance capabilities used

Cognis currently integrates capabilities corresponding to:

- `query-token-info`
- `query-token-audit`
- `crypto-market-rank`

The broader project environment also includes:

- `binance-trading-signal`
- `binance-leaderboard`
- `query-address-info`

These provide a foundation for deeper investment intelligence as Cognis evolves.

---

## Live Market Evidence

For verified crypto ventures, Cognis can surface contextual Binance intelligence such as:

- Token identity
- Current price
- Trading volume
- Market capitalization
- Liquidity
- Holder information
- Token security/audit information
- Market rankings

Live market information is fetched when required rather than copied into the Cognis database.

This keeps market evidence current while the analyst's actual diligence work remains persistent.

---

## Evidence-Based Diligence

Cognis separates an analyst's opinion from the evidence supporting it.

Assessment questions can have:

- Analyst responses
- Evidence
- Evidence requests
- Review state
- Blocker state

Evidence requests and analyst responses persist across sessions.

This creates a more defensible investment trail than a collection of disconnected notes.

---

## Progress & Committee Readiness

Assessment progress is derived from actual question state rather than a manually entered percentage.

```text
Progress =
Completed Applicable Questions
──────────────────────────────
Total Applicable Questions
```

Questions marked **Not Applicable** are excluded.

Cognis also derives unresolved blockers from the assessment.

These signals feed into a deterministic committee-readiness state so analysts can see whether a venture has enough diligence completed to move forward.

The current MVP intentionally avoids pretending to make autonomous investment decisions.

**Cognis supports investment judgment — it does not replace it.**

---

## Crypto and Non-Crypto Assessment

Cognis adapts its workflow based on the venture.

### Crypto / Tokenized Venture

```text
Venture
   ↓
Token metadata provided
   ↓
Backend token verification
   ↓
Chain + contract validation
   ↓
Token Economics activated
   ↓
Live Binance evidence available
```

### Non-Token Venture

```text
Venture
   ↓
No token
   ↓
Standard VC assessment
   ↓
Token Economics → Not Applicable
   ↓
No unnecessary Binance market evidence
```

This prevents crypto-specific analysis from being forced onto ventures where it does not make sense.

---

## WBNB Demo

The seed environment includes a verified crypto example:

**WBNB Market Evidence Demo**

```text
Symbol: WBNB
Chain ID: 56
Contract:
0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c
```

This venture can be used to demonstrate the complete Binance intelligence workflow.

---

## Architecture

```text
┌───────────────────────────────────────────────┐
│                  Cognis UI                    │
│                                               │
│ Screening Queue │ Intake │ Assessment │ IC   │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│               Express Backend                 │
│                                               │
│ Venture API                                   │
│ Assessment API                                │
│ Evidence API                                  │
│ Binance API Adapter                           │
└───────────────┬──────────────────┬────────────┘
                │                  │
                ▼                  ▼
       ┌────────────────┐   ┌─────────────────┐
       │Prisma/PostgreSQL│   │ Binance Services│
       │                │   │                 │
       │ Ventures       │   │ Token Info      │
       │ Assessments    │   │ Token Audit     │
       │ Questions      │   │ Market Ranking  │
       │ Responses      │   │                 │
       │ Evidence       │   │                 │
       └────────────────┘   └─────────────────┘
```

---

## Data Model

The persistent MVP is built around six primary entities:

```text
Venture
   │
   └── Assessment
          │
          └── AssessmentDomain
                   │
                   └── AssessmentQuestion
                          │
                          ├── AnalystResponse
                          │
                          └── Evidence
```

This allows Cognis to maintain a structured history of the investment assessment rather than storing diligence as unstructured frontend state.

---

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Data

- Prisma ORM
- PostgreSQL

### Market Intelligence

- Binance Agent OS / Binance Web3 data services

### Development

- Codex
- Binance Skills Hub
- Git / GitHub

---

## API

The Cognis backend exposes APIs for the core workflow.

### Ventures

```http
GET   /api/ventures
POST  /api/ventures
GET   /api/ventures/:ventureId
PATCH /api/ventures/:ventureId
```

### Assessments

```http
GET  /api/ventures/:ventureId/assessments
POST /api/ventures/:ventureId/assessments

GET   /api/assessments/:assessmentId
PATCH /api/assessments/:assessmentId
```

### Analyst Responses

```http
PATCH /api/questions/:questionId/response
```

### Evidence

```http
GET   /api/questions/:questionId/evidence
POST  /api/questions/:questionId/evidence

PATCH /api/evidence/:evidenceId
```

### Token Verification

```http
POST /api/token-verification
```

Additional Binance routes provide token search, token intelligence, token audit, and market-ranking functionality.

---

## Running Cognis Locally

Clone the repository:

```bash
git clone https://github.com/Einsteincrown/cognis.git
cd cognis
```

Install dependencies:

```bash
npm install
```

Set up the database:

```bash
npm run setup:db -- "postgresql://USER:PASSWORD@POOLER_HOST:6543/DATABASE?pgbouncer=true" --direct-url="postgresql://USER:PASSWORD@POOLER_HOST:5432/DATABASE"
```

Or, if `.env` already contains PostgreSQL `DATABASE_URL` and `DIRECT_URL` values:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Start Cognis:

```bash
npm start
```

Then open:

```text
http://localhost:3001
```

---

## Demo Flow

For a quick demonstration:

1. Open the **Screening Queue**.
2. Select **New Venture**.
3. Enter the venture information.
4. For a crypto venture, provide its token details.
5. Verify the token.
6. Create the venture and assessment.
7. Navigate through the eight diligence domains.
8. Save analyst responses.
9. Review or request evidence.
10. Inspect contextual Binance intelligence.
11. Monitor progress and unresolved blockers.
12. Determine whether the venture is ready for committee review.

---

## Current MVP Scope

Cognis currently focuses on the core investment-screening loop:

```text
Screen
→ Investigate
→ Validate
→ Document
→ Review
→ Decide
```

The MVP deliberately does **not** include:

- Wallet custody
- Token trading
- Payments
- Autonomous investment execution
- Multi-user permissions
- CRM functionality
- Autonomous investment recommendations

The focus is building a strong diligence and decision-support foundation first.

---

## Vision

Crypto investors have access to enormous amounts of data.

The harder problem is turning that data into **structured investment conviction**.

Cognis aims to become the intelligence layer between:

```text
Market Signal
      ↓
Research
      ↓
Evidence
      ↓
Investment Thesis
      ↓
Committee Decision
```

**Cognis — From Signal to Conviction.**

---

## Repository

Built as an early-stage crypto venture diagnostic and investment-screening system for the Binance Agent OS ecosystem.
