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
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    const moodEntries = await db.moodEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(moodEntries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mood, energy, stress, date, notes } = body;

    if (!userId || !mood || !date) {
      return NextResponse.json(
        { error: 'userId, mood, and date are required' },
        { status: 400 }
      );
    }

    const moodEntry = await db.moodEntry.create({
      data: {
        userId,
        mood,
        energy: energy ?? 3,
        stress: stress ?? 3,
        date,
        notes,
      },
    });

    return NextResponse.json(moodEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    return NextResponse.json(
      { error: 'Failed to create mood entry' },
      { status: 500 }
    );
  }
}
