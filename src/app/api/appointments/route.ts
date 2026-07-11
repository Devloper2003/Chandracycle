import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      doctorName,
      specialty,
      date,
      time,
      type,
      notes,
    } = body;

    if (!userId || !doctorName || !date || !time) {
      return NextResponse.json(
        { error: 'userId, doctorName, date, and time are required' },
        { status: 400 }
      );
    }

    const validTypes = ['in_person', 'video', 'chat'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        userId,
        doctorName,
        specialty: specialty ?? 'General',
        date,
        time,
        type: type ?? 'in_person',
        status: 'upcoming',
        notes,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
