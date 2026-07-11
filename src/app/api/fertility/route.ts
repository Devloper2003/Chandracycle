import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    const fertilityData = await db.fertilityData.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(fertilityData);
  } catch (error) {
    console.error('Error fetching fertility data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fertility data' },
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
      basalTemp,
      cervicalMucus,
      opkResult,
      intercourse,
      notes,
    } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    // Calculate fertility score based on signals
    let fertilityScore = 0;
    if (basalTemp !== undefined) {
      // Higher basal temp (above 37°C / 98.6°F) can indicate ovulation
      fertilityScore += basalTemp >= 37 ? 25 : 10;
    }
    if (cervicalMucus) {
      const mucusScores: Record<string, number> = {
        dry: 0,
        sticky: 5,
        creamy: 15,
        watery: 20,
        eggwhite: 25,
      };
      fertilityScore += mucusScores[cervicalMucus] ?? 0;
    }
    if (opkResult === 'positive') {
      fertilityScore += 30;
    }

    // Determine ovulation confirmation
    const ovulationConfirmed =
      basalTemp !== undefined &&
      basalTemp >= 37 &&
      (opkResult === 'positive' || cervicalMucus === 'eggwhite');

    if (ovulationConfirmed) {
      fertilityScore += 20;
    }

    // Cap at 100
    fertilityScore = Math.min(fertilityScore, 100);

    const fertilityEntry = await db.fertilityData.create({
      data: {
        userId,
        date,
        basalTemp,
        cervicalMucus,
        opkResult,
        fertilityScore,
        ovulationConfirmed,
        intercourse: intercourse ?? false,
        notes,
      },
    });

    return NextResponse.json(fertilityEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating fertility data:', error);
    return NextResponse.json(
      { error: 'Failed to create fertility data' },
      { status: 500 }
    );
  }
}
