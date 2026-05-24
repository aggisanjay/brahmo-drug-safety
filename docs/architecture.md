# Drug Safety Engine — Architecture

## Overview
A deterministic drug safety layer that runs **before** AI responds, ensuring 100% detection of drug interactions, allergy conflicts, and renal dosing issues from a verified database.

## Architecture Diagram

```
Doctor's Question
    │
    ▼
┌─────────────────────────────────────────────┐
│  SAFETY ENGINE (~30ms, deterministic)        │
│  ┌──────────────────────────────────────┐   │
│  │ 1. Drug Interaction Check            │   │
│  │    → Database lookup of all pairs     │   │
│  ├──────────────────────────────────────┤   │
│  │ 2. Allergy Conflict Check            │   │
│  │    → Direct match + cross-reactivity  │   │
│  ├──────────────────────────────────────┤   │
│  │ 3. Renal Dosing Check                │   │
│  │    → eGFR threshold comparison        │   │
│  ├──────────────────────────────────────┤   │
│  │ 4. Clinical Calculators              │   │
│  │    → eGFR CKD-EPI 2021               │   │
│  │    → CHA₂DS₂-VASc                    │   │
│  └──────────────────────────────────────┘   │
│              │                               │
│              ▼                               │
│  ┌──────────────────────────────────────┐   │
│  │ Constraint Text Generator            │   │
│  │ ⛔ HARD BLOCK (importance 10)        │   │
│  │ ⚠️ SEVERE / MODERATE warnings        │   │
│  │ ℹ️ Information alerts                │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
    │                           │
    ▼                           ▼
┌──────────┐           ┌──────────────┐
│ Generic  │           │  Enhanced    │
│   LLM    │           │    LLM       │
│ (no      │           │ (with safety │
│ safety)  │           │ constraints) │
└──────────┘           └──────────────┘
    │                           │
    ▼                           ▼
┌─────────────────────────────────────┐
│     Side-by-Side Comparison UI       │
└─────────────────────────────────────┘
```

## Key Design Decisions

### 1. Deterministic Safety > AI Reasoning
All safety checks use database lookups. Zero AI involvement in interaction detection. This ensures 100% detection rate for any drug pair in the database.

### 2. In-Memory Caching
All drugs, interactions, and cross-reactivity data are cached in memory with a 5-minute TTL. This means:
- First request: ~100ms (database fetch)
- Subsequent requests: ~5ms (memory lookup)
- 12 medications = 66 pairs checked in <10ms from cache

### 3. Normalized Drug Names
Drug names are normalized (lowercase, no spaces) for fuzzy matching. E.g., "Amoxicillin-Clavulanate" → "amoxicillinclavulanate".

### 4. Multi-Provider LLM Support
The API auto-detects the LLM provider from the API key prefix:
- `sk-ant-*` → Anthropic (Claude)
- `sk-*` → OpenAI (GPT)
- `gsk_*` → Groq (Llama)
- Other → Google (Gemini)

### 5. Scalability
- New drug = 1 INSERT into `drugs` table. No code changes.
- New interaction = 1 INSERT into `drug_interactions` table. Engine picks it up on next cache refresh.
- New calculator = 1 function + registration. Framework supports it.

## Database Schema

| Table | Rows | Purpose |
|-------|------|---------|
| `drugs` | 50 | All medications with renal dosing JSONB |
| `drug_interactions` | 30 | Interaction pairs with severity + management |
| `allergy_cross_reactivity` | 8 | Cross-reactivity rules between drug classes |

## Tech Stack
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **LLM:** Supports Claude, GPT, Gemini, and Groq (Llama)
- **Caching:** In-memory with 5-min TTL

## Innovation Features
1. **Existing medication scanning** — also checks current medications for interactions with each other
2. **Drug extraction from questions** — automatically detects drug names in doctor's free-text questions
3. **Alert fatigue management** — alerts sorted by importance, grouped by severity
4. **Auto eGFR calculation** — computes from creatinine if not provided
5. **Drug-not-in-database warning** — alerts when a mentioned drug isn't in the system
