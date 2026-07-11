import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const category = searchParams.get('category');

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
    if (category) {
      where.category = category;
    }

    const symptoms = await db.symptomEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(symptoms);
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch symptoms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, severity, date, notes } = body;

    if (!userId || !category || !date) {
      return NextResponse.json(
        { error: 'userId, category, and date are required' },
        { status: 400 }
      );
    }

    const symptom = await db.symptomEntry.create({
      data: {
        userId,
        category,
        severity: severity ?? 1,
        date,
        notes,
      },
    });

    return NextResponse.json(symptom, { status: 201 });
  } catch (error) {
    console.error('Error creating symptom entry:', error);
    return NextResponse.json(
      { error: 'Failed to create symptom entry' },
      { status: 500 }
    );
  }
}
