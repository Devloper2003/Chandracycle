import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (type) {
      where.type = type;
    }

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON content for each report
    const parsedReports = reports.map((report) => ({
      ...report,
      content: JSON.parse(report.content),
    }));

    return NextResponse.json(parsedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, startDate, endDate } = body;

    if (!userId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, type, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const validTypes = ['daily', 'weekly', 'monthly', 'annual'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Aggregate data from various sources
    const [symptoms, moodEntries, sleepEntries, cycles] = await Promise.all([
      db.symptomEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
      }),
      db.moodEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
      }),
      db.sleepEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
      }),
      db.cycle.findMany({
        where: { userId, startDate: { gte: startDate, lte: endDate } },
      }),
    ]);

    // Calculate aggregated metrics
    const symptomSummary: Record<string, number> = {};
    for (const s of symptoms) {
      symptomSummary[s.category] = (symptomSummary[s.category] ?? 0) + 1;
    }

    const moodCounts: Record<string, number> = {};
    let totalEnergy = 0;
    let totalStress = 0;
    for (const m of moodEntries) {
      moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;
      totalEnergy += m.energy;
      totalStress += m.stress;
    }

    const avgEnergy = moodEntries.length > 0 ? totalEnergy / moodEntries.length : 0;
    const avgStress = moodEntries.length > 0 ? totalStress / moodEntries.length : 0;

    let totalSleep = 0;
    let totalQuality = 0;
    for (const s of sleepEntries) {
      totalSleep += s.hoursSlept;
      totalQuality += s.quality;
    }
    const avgSleep = sleepEntries.length > 0 ? totalSleep / sleepEntries.length : 0;
    const avgSleepQuality = sleepEntries.length > 0 ? totalQuality / sleepEntries.length : 0;

    const reportContent = {
      period: { startDate, endDate, type },
      summary: {
        totalSymptomEntries: symptoms.length,
        totalMoodEntries: moodEntries.length,
        totalSleepEntries: sleepEntries.length,
        totalCycles: cycles.length,
      },
      symptoms: symptomSummary,
      mood: {
        distribution: moodCounts,
        averageEnergy: Math.round(avgEnergy * 10) / 10,
        averageStress: Math.round(avgStress * 10) / 10,
      },
      sleep: {
        averageHours: Math.round(avgSleep * 10) / 10,
        averageQuality: Math.round(avgSleepQuality * 10) / 10,
      },
      cycles: cycles.map((c) => ({
        startDate: c.startDate,
        cycleLength: c.cycleLength,
        ovulationDate: c.ovulationDate,
      })),
    };

    const report = await db.report.create({
      data: {
        userId,
        type,
        startDate,
        endDate,
        content: JSON.stringify(reportContent),
      },
    });

    return NextResponse.json(
      { ...report, content: reportContent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
