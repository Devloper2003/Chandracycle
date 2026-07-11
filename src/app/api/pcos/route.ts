import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const pcosRecords = await db.pCOSRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(pcosRecords);
  } catch (error) {
    console.error('Error fetching PCOS records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PCOS records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      date,
      irregularPeriods,
      excessHair,
      acne,
      weightGain,
      hairLoss,
      skinTags,
      fatigue,
      moodChanges,
      sleepIssues,
      exerciseMinutes,
      dietQuality,
      notes,
    } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    // Calculate risk score: (count of true symptoms / total symptoms) * 100
    const symptoms = [
      irregularPeriods ?? false,
      excessHair ?? false,
      acne ?? false,
      weightGain ?? false,
      hairLoss ?? false,
      skinTags ?? false,
      fatigue ?? false,
      moodChanges ?? false,
      sleepIssues ?? false,
    ];

    const trueCount = symptoms.filter(Boolean).length;
    const riskScore = (trueCount / symptoms.length) * 100;

    const pcosRecord = await db.pCOSRecord.create({
      data: {
        userId,
        date,
        irregularPeriods: irregularPeriods ?? false,
        excessHair: excessHair ?? false,
        acne: acne ?? false,
        weightGain: weightGain ?? false,
        hairLoss: hairLoss ?? false,
        skinTags: skinTags ?? false,
        fatigue: fatigue ?? false,
        moodChanges: moodChanges ?? false,
        sleepIssues: sleepIssues ?? false,
        riskScore,
        exerciseMinutes: exerciseMinutes ?? 0,
        dietQuality: dietQuality ?? 3,
        notes,
      },
    });

    return NextResponse.json(pcosRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating PCOS record:', error);
    return NextResponse.json(
      { error: 'Failed to create PCOS record' },
      { status: 500 }
    );
  }
}
