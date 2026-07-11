import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (date) {
      where.date = date;
    }

    const waterEntries = await db.waterEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(waterEntries);
  } catch (error) {
    console.error('Error fetching water entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, glasses, date } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    if (glasses === undefined) {
      return NextResponse.json(
        { error: 'glasses is required' },
        { status: 400 }
      );
    }

    // Check if entry already exists for this date
    const existing = await db.waterEntry.findFirst({
      where: { userId, date },
    });

    if (existing) {
      // Update existing entry by adding glasses
      const updated = await db.waterEntry.update({
        where: { id: existing.id },
        data: { glasses: existing.glasses + glasses },
      });
      return NextResponse.json(updated);
    }

    const waterEntry = await db.waterEntry.create({
      data: {
        userId,
        glasses,
        date,
      },
    });

    return NextResponse.json(waterEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating water entry:', error);
    return NextResponse.json(
      { error: 'Failed to create water entry' },
      { status: 500 }
    );
  }
}
