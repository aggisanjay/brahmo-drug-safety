import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient, question, constraintText, mode } = body as {
      patient: {
        name: string; age: number; sex: string;
        medications: { name: string; dose: string }[];
        allergies: { allergen: string; reaction: string; severity: string }[];
        labs: Record<string, number | undefined>;
        vitals?: Record<string, number | undefined>;
        conditions?: { name: string; active: boolean }[];
      };
      question: string;
      constraintText?: string;
      mode: 'generic' | 'enhanced';
    };

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'LLM_API_KEY not configured' }, { status: 500 });
    }

    // Build patient summary for context
    const patientSummary = buildPatientSummary(patient);

    let systemPrompt: string;

    if (mode === 'enhanced' && constraintText) {
      systemPrompt = `You are a clinical decision support AI assistant for doctors. You provide evidence-based medical advice.\n\n${constraintText}\n\nPatient Information:\n${patientSummary}\n\nIMPORTANT: You MUST acknowledge and address every safety constraint listed above. For HARD BLOCKS, you must refuse the proposed action and suggest safe alternatives. Structure your response clearly with safety concerns first.`;
    } else {
      systemPrompt = `You are a helpful medical AI assistant. Provide general clinical guidance when asked.\n\nPatient Information:\n${patientSummary}`;
    }

    // Determine which API to call based on common providers
    const provider = detectProvider(apiKey);
    let responseText: string;

    if (provider === 'anthropic') {
      responseText = await callAnthropic(apiKey, systemPrompt, question);
    } else if (provider === 'openai') {
      responseText = await callOpenAI(apiKey, systemPrompt, question);
    } else if (provider === 'groq') {
      responseText = await callGroq(apiKey, systemPrompt, question);
    } else {
      responseText = await callGemini(apiKey, systemPrompt, question);
    }

    return NextResponse.json({
      content: responseText,
      model: provider,
      type: mode,
    });
  } catch (error) {
    console.error('LLM API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LLM API call failed' },
      { status: 500 }
    );
  }
}

function detectProvider(apiKey: string): 'anthropic' | 'openai' | 'groq' | 'gemini' {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.startsWith('gsk_')) return 'groq';
  return 'gemini';
}

function buildPatientSummary(patient: {
  name: string; age: number; sex: string;
  medications: { name: string; dose: string }[];
  allergies: { allergen: string; reaction: string; severity: string }[];
  labs: Record<string, number | undefined>;
  vitals?: Record<string, number | undefined>;
  conditions?: { name: string; active: boolean }[];
}): string {
  let summary = `${patient.name} | ${patient.age}${patient.sex}\n`;
  summary += `Medications: ${patient.medications.map(m => `${m.name} ${m.dose}`).join(', ')}\n`;
  summary += `Allergies: ${patient.allergies.map(a => `${a.allergen} (${a.reaction})`).join(', ')}\n`;

  const labEntries = Object.entries(patient.labs).filter(([, v]) => v !== undefined);
  if (labEntries.length > 0) {
    summary += `Labs: ${labEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
  }

  if (patient.vitals) {
    const vitalEntries = Object.entries(patient.vitals).filter(([, v]) => v !== undefined);
    if (vitalEntries.length > 0) {
      summary += `Vitals: ${vitalEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    }
  }

  if (patient.conditions) {
    summary += `Conditions: ${patient.conditions.filter(c => c.active).map(c => c.name).join(', ')}\n`;
  }

  return summary;
}

async function callAnthropic(apiKey: string, systemPrompt: string, question: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  if (data.content && data.content[0]) {
    return data.content[0].text || '';
  }
  return "Error: Could not retrieve text response from Anthropic.";
}

async function callOpenAI(apiKey: string, systemPrompt: string, question: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || '';
  }
  return "Error: Could not retrieve text response from OpenAI.";
}

async function callGroq(apiKey: string, systemPrompt: string, question: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || '';
  }
  return "Error: Could not retrieve text response from Groq.";
}

async function callGemini(apiKey: string, systemPrompt: string, question: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 4000 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0]) {
    const candidate = data.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
      return candidate.content.parts[0].text || '';
    }
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      return `Response was blocked or interrupted by the model (Reason: ${candidate.finishReason}).`;
    }
  }
  return "Error: Could not retrieve text response from Gemini.";
}
