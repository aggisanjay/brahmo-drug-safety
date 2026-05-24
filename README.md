# 🛡️ Drug Safety Engine — Make AI Safe for Doctors

A deterministic drug safety layer that runs **before** AI responds, ensuring 100% detection of drug interactions, allergy conflicts, and renal dosing issues.

## Quick Start

### Prerequisites
- Node.js v18+
- Supabase account (free tier)
- LLM API key (Anthropic/OpenAI/Google — free credits sufficient)

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd brahmo-drug-safety
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, anon key, and LLM API key

# 3. Set up database
# Go to Supabase SQL Editor, run:
#   supabase/schema.sql  (creates tables)
#   supabase/seed.sql    (loads 50 drugs + 30 interactions)

# 4. Start development server
npm run dev
# Open http://localhost:3000
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
LLM_API_KEY=your_api_key_here
```

The LLM API key auto-detects the provider:
- `sk-ant-*` → Anthropic Claude
- `sk-*` → OpenAI GPT
- Other → Google Gemini

## Features

### 4 Deterministic Safety Checks
1. **Drug Interaction Check** — Looks up all medication pairs in database
2. **Allergy Conflict Check** — Direct match + cross-reactivity between drug classes
3. **Renal Dosing Check** — Compares drug thresholds against patient eGFR
4. **Clinical Calculators** — eGFR (CKD-EPI 2021) + CHA₂DS₂-VASc

## Data & Reference Sources
- **56 Medications** with renal dosing rules (including 6 newly added scenario-specific drugs)
- **33 Drug Interaction Pairs** (CONTRAINDICATED / SEVERE / MODERATE / MINOR)
- **8 Allergy Cross-Reactivity Rules** (direct drug class matching and cross-reactivity risk percentages)
- **10 Pre-loaded Patient Profiles** (covering 4 key clinical demo scenarios)

For detailed information on the scientific guidelines, medical consensus, and equations (e.g., CKD-EPI 2021, CHA₂DS₂-VASc) behind this clinical database, see [data_sources.md](data_sources.md).

### Architecture
See [docs/architecture.md](docs/architecture.md) for full details on the deterministic safety shield design.

## Demo Scenarios

| # | Patient | Question | What the safety engine catches |
|---|---------|----------|-------------------------------|
| 1 | 78M polypharmacy | Add Clarithromycin? | Clarithromycin + Atorvastatin (rhabdomyolysis), + Amlodipine (hypotension) |
| 2 | 65M penicillin anaphylaxis | Use Amoxicillin-Clavulanate? | HARD BLOCK — same drug class, anaphylaxis documented |
| 3 | 35F ICU, eGFR 18 | Gabapentin 300mg TDS? | Toxic accumulation — needs 100mg OD at this eGFR |
| 4 | 68M AF + HF | Still needs anticoagulation? | CHA₂DS₂-VASc = 6, stroke risk 9.8%/year |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              ← Main demo page
│   └── api/
│       ├── safety-check/     ← Safety engine API
│       └── claude/           ← LLM API (multi-provider)
├── lib/
│   ├── supabase.ts           ← Database client
│   ├── safety-engine.ts      ← Core safety checks + caching
│   ├── calculators.ts        ← eGFR + CHA₂DS₂-VASc
│   ├── patients.ts           ← 10 pre-loaded patients
│   └── types.ts              ← TypeScript definitions
└── components/
    ├── PatientCard.tsx        ← Patient summary display
    ├── SafetyAlerts.tsx       ← Safety check results
    └── ResponseComparison.tsx ← Side-by-side AI comparison
```

## License
MIT
