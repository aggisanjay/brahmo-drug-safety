import { NextRequest, NextResponse } from 'next/server';
import { runSafetyChecks } from '@/lib/safety-engine';
import type { Patient } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient, newDrug, question } = body as {
      patient: Patient;
      newDrug?: string;
      question?: string;
    };

    if (!patient) {
      return NextResponse.json({ error: 'Patient data is required' }, { status: 400 });
    }

    const result = await runSafetyChecks(patient, newDrug, question);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Safety check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Safety check failed' },
      { status: 500 }
    );
  }
}
