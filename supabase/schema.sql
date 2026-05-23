CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS drugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name TEXT NOT NULL UNIQUE,
  generic_name_normalized TEXT NOT NULL UNIQUE,
  drug_class TEXT NOT NULL,
  renal_dosing JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drugs_normalized ON drugs (generic_name_normalized);
CREATE INDEX idx_drugs_class ON drugs (drug_class);

CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_a_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  drug_b_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('CONTRAINDICATED', 'SEVERE', 'MODERATE', 'MINOR')),
  mechanism TEXT NOT NULL,
  clinical_effect TEXT NOT NULL,
  management TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drug_a_id, drug_b_id)
);

CREATE INDEX idx_interactions_drug_a ON drug_interactions (drug_a_id);
CREATE INDEX idx_interactions_drug_b ON drug_interactions (drug_b_id);

CREATE TABLE IF NOT EXISTS allergy_cross_reactivity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_class_a TEXT NOT NULL,
  drug_class_b TEXT NOT NULL,
  cross_reactivity_pct NUMERIC NOT NULL,
  clinical_guidance TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drug_class_a, drug_class_b)
);

CREATE INDEX idx_cross_react_class_a ON allergy_cross_reactivity (drug_class_a);

-- Disable Row Level Security to ensure tables are publicly queryable by the demo app
ALTER TABLE drugs DISABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_cross_reactivity DISABLE ROW LEVEL SECURITY;
