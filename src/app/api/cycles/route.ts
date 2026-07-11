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

    const cycles = await db.cycle.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error fetching cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cycles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      startDate,
      endDate,
      cycleLength,
      periodLength,
      notes,
    } = body;

    if (!userId || !startDate) {
      return NextResponse.json(
        { error: 'userId and startDate are required' },
        { status: 400 }
      );
    }

    // Get user's cycle length for calculations
    const user = await db.user.findUnique({ where: { id: userId } });
    const effectiveCycleLength = cycleLength ?? user?.cycleLength ?? 28;
    const effectivePeriodLength = periodLength ?? user?.periodLength ?? 5;

    // Calculate ovulation date: cycleLength - 14 days from next period start
    // Next period start = startDate + cycleLength
    const periodStart = new Date(startDate);
    const nextPeriodStart = new Date(periodStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + effectiveCycleLength);

    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    // Fertile window: 5 days before ovulation through ovulation day
    const fertilityWindowStart = new Date(ovulationDate);
    fertilityWindowStart.setDate(fertilityWindowStart.getDate() - 5);

    const fertilityWindowEnd = new Date(ovulationDate);

    const cycle = await db.cycle.create({
      data: {
        userId,
        startDate,
        endDate,
        cycleLength: effectiveCycleLength,
        periodLength: effectivePeriodLength,
        ovulationDate: ovulationDate.toISOString().split('T')[0],
        fertilityWindowStart: fertilityWindowStart.toISOString().split('T')[0],
        fertilityWindowEnd: fertilityWindowEnd.toISOString().split('T')[0],
        notes,
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('Error creating cycle:', error);
    return NextResponse.json(
      { error: 'Failed to create cycle' },
      { status: 500 }
    );
  }
}
