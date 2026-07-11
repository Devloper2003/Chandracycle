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

    const pregnancyData = await db.pregnancyData.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(pregnancyData);
  } catch (error) {
    console.error('Error fetching pregnancy data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pregnancy data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      week,
      day,
      weight,
      symptoms,
      mood,
      date,
      bloodPressure,
      babySize,
      appointmentDue,
      vaccinationDue,
      medicineTaken,
      notes,
    } = body;

    if (!userId || week === undefined || !date) {
      return NextResponse.json(
        { error: 'userId, week, and date are required' },
        { status: 400 }
      );
    }

    const pregnancyEntry = await db.pregnancyData.create({
      data: {
        userId,
        week,
        day: day ?? 0,
        weight,
        bloodPressure,
        babySize,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        mood,
        appointmentDue,
        vaccinationDue,
        medicineTaken,
        notes,
        date,
      },
    });

    return NextResponse.json(pregnancyEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating pregnancy data:', error);
    return NextResponse.json(
      { error: 'Failed to create pregnancy data' },
      { status: 500 }
    );
  }
}
