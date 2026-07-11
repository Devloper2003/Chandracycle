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

    const sleepEntries = await db.sleepEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sleepEntries);
  } catch (error) {
    console.error('Error fetching sleep entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sleep entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, hoursSlept, quality, date, bedTime, wakeTime, notes } = body;

    if (!userId || hoursSlept === undefined || !date) {
      return NextResponse.json(
        { error: 'userId, hoursSlept, and date are required' },
        { status: 400 }
      );
    }

    const sleepEntry = await db.sleepEntry.create({
      data: {
        userId,
        hoursSlept,
        quality: quality ?? 3,
        date,
        bedTime,
        wakeTime,
        notes,
      },
    });

    return NextResponse.json(sleepEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating sleep entry:', error);
    return NextResponse.json(
      { error: 'Failed to create sleep entry' },
      { status: 500 }
    );
  }
}
