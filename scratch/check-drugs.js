const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.endsWith('\r')) value = value.slice(0, -1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

console.log("Parsed Supabase URL:", env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Parsed Key length:", env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAll() {
  const { data: drugs, error: err1 } = await supabase.from('drugs').select('*');
  console.log("Drugs error:", err1);
  console.log("Drugs count:", drugs ? drugs.length : null);
  if (drugs && drugs.length > 0) {
    console.log("Sample drug:", drugs[0]);
  }

  const { data: interactions, error: err2 } = await supabase.from('drug_interactions').select('*');
  console.log("Interactions count:", interactions ? interactions.length : null);

  const { data: allergies, error: err3 } = await supabase.from('allergy_cross_reactivity').select('*');
  console.log("Allergies count:", allergies ? allergies.length : null);
}

checkAll();
