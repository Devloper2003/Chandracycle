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

    const menopauseData = await db.menopauseData.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(menopauseData);
  } catch (error) {
    console.error('Error fetching menopause data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menopause data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      hotFlashes,
      nightSweats,
      moodChanges,
      sleepIssues,
      anxiety,
      date,
      vaginalDryness,
      jointPain,
      weightChange,
      notes,
    } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    const menopauseEntry = await db.menopauseData.create({
      data: {
        userId,
        date,
        hotFlashes: hotFlashes ?? 0,
        nightSweats: nightSweats ?? 0,
        moodChanges: moodChanges ?? false,
        sleepIssues: sleepIssues ?? false,
        vaginalDryness: vaginalDryness ?? false,
        jointPain: jointPain ?? false,
        weightChange,
        anxiety: anxiety ?? 0,
        notes,
      },
    });

    return NextResponse.json(menopauseEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating menopause data:', error);
    return NextResponse.json(
      { error: 'Failed to create menopause data' },
      { status: 500 }
    );
  }
}
