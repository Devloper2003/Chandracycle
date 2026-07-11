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

    // Fetch recent data for analysis
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [user, symptoms, moodEntries, sleepEntries, cycles, pcosRecords] =
      await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.symptomEntry.findMany({
          where: { userId, date: { gte: thirtyDaysAgoStr } },
          orderBy: { date: 'desc' },
        }),
        db.moodEntry.findMany({
          where: { userId, date: { gte: thirtyDaysAgoStr } },
          orderBy: { date: 'desc' },
        }),
        db.sleepEntry.findMany({
          where: { userId, date: { gte: thirtyDaysAgoStr } },
          orderBy: { date: 'desc' },
        }),
        db.cycle.findMany({
          where: { userId },
          orderBy: { startDate: 'desc' },
          take: 6,
        }),
        db.pCOSRecord.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 3,
        }),
      ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const insights: Array<{
      category: string;
      title: string;
      description: string;
      severity: 'info' | 'warning' | 'action';
      confidence: number;
    }> = [];

    // === Cycle Regularity Analysis ===
    if (cycles.length >= 2) {
      const cycleLengths = cycles
        .filter((c) => c.cycleLength !== null)
        .map((c) => c.cycleLength as number);

      if (cycleLengths.length >= 2) {
        const avgCycleLength =
          cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        const variance =
          cycleLengths.reduce(
            (sum, len) => sum + Math.pow(len - avgCycleLength, 2),
            0
          ) / cycleLengths.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev > 7) {
          insights.push({
            category: 'cycle',
            title: 'Irregular Cycle Detected',
            description: `Your cycle length varies by ±${Math.round(stdDev)} days. This level of irregularity may warrant a consultation with your healthcare provider.`,
            severity: 'warning',
            confidence: 85,
          });
        } else if (stdDev > 3) {
          insights.push({
            category: 'cycle',
            title: 'Slight Cycle Variation',
            description: `Your cycle length varies by ±${Math.round(stdDev)} days. Some variation is normal, but keep tracking to identify patterns.`,
            severity: 'info',
            confidence: 75,
          });
        } else {
          insights.push({
            category: 'cycle',
            title: 'Regular Cycle Pattern',
            description: `Your average cycle is ${Math.round(avgCycleLength)} days with minimal variation. This indicates a healthy, regular cycle.`,
            severity: 'info',
            confidence: 90,
          });
        }
      }
    }

    // === Symptom Pattern Analysis ===
    const symptomCounts: Record<string, number> = {};
    for (const s of symptoms) {
      symptomCounts[s.category] = (symptomCounts[s.category] ?? 0) + 1;
    }

    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topSymptoms.length > 0) {
      const symptomList = topSymptoms
        .map(([name, count]) => `${name} (${count}x)`)
        .join(', ');
      insights.push({
        category: 'symptoms',
        title: 'Top Reported Symptoms',
        description: `Your most frequent symptoms in the last 30 days: ${symptomList}. Tracking these helps identify triggers and patterns.`,
        severity: 'info',
        confidence: 80,
      });
    }

    // Check for severe symptoms
    const severeSymptoms = symptoms.filter((s) => s.severity >= 4);
    if (severeSymptoms.length >= 3) {
      insights.push({
        category: 'symptoms',
        title: 'Frequent Severe Symptoms',
        description: `You've reported ${severeSymptoms.length} severe symptom entries recently. Consider discussing these with your healthcare provider.`,
        severity: 'action',
        confidence: 90,
      });
    }

    // === Mood Trend Analysis ===
    if (moodEntries.length >= 5) {
      const recentMoods = moodEntries.slice(0, 10);
      const avgEnergy =
        recentMoods.reduce((sum, m) => sum + m.energy, 0) / recentMoods.length;
      const avgStress =
        recentMoods.reduce((sum, m) => sum + m.stress, 0) / recentMoods.length;

      const negativeMoods = ['anxious', 'sad', 'irritable', 'tired'];
      const negativeCount = recentMoods.filter((m) =>
        negativeMoods.includes(m.mood)
      ).length;
      const negativeRatio = negativeCount / recentMoods.length;

      if (negativeRatio > 0.6) {
        insights.push({
          category: 'mood',
          title: 'Elevated Negative Mood Pattern',
          description: `Over ${Math.round(negativeRatio * 100)}% of your recent mood entries are negative. Your average stress is ${avgStress.toFixed(1)}/5. Consider mindfulness exercises or speaking with a counselor.`,
          severity: 'warning',
          confidence: 82,
        });
      } else if (avgStress > 3.5) {
        insights.push({
          category: 'mood',
          title: 'High Stress Levels',
          description: `Your average stress level is ${avgStress.toFixed(1)}/5. Incorporating relaxation techniques like deep breathing, meditation, or yoga could help.`,
          severity: 'info',
          confidence: 78,
        });
      } else {
        insights.push({
          category: 'mood',
          title: 'Positive Mood Trend',
          description: `Your mood appears stable with good energy levels (avg ${avgEnergy.toFixed(1)}/5) and manageable stress (${avgStress.toFixed(1)}/5). Keep up your current wellness routine!`,
          severity: 'info',
          confidence: 85,
        });
      }
    }

    // === Sleep Quality Analysis ===
    if (sleepEntries.length >= 3) {
      const avgSleepHours =
        sleepEntries.reduce((sum, s) => sum + s.hoursSlept, 0) /
        sleepEntries.length;
      const avgSleepQuality =
        sleepEntries.reduce((sum, s) => sum + s.quality, 0) /
        sleepEntries.length;

      if (avgSleepHours < 6) {
        insights.push({
          category: 'sleep',
          title: 'Insufficient Sleep',
          description: `You're averaging ${avgSleepHours.toFixed(1)} hours of sleep. The recommended amount is 7-9 hours. Poor sleep can affect mood, energy, and cycle regularity.`,
          severity: 'warning',
          confidence: 88,
        });
      } else if (avgSleepQuality < 2.5) {
        insights.push({
          category: 'sleep',
          title: 'Low Sleep Quality',
          description: `Your average sleep quality is ${avgSleepQuality.toFixed(1)}/5. Even with adequate hours, poor quality sleep can impact your overall health.`,
          severity: 'info',
          confidence: 80,
        });
      } else {
        insights.push({
          category: 'sleep',
          title: 'Healthy Sleep Pattern',
          description: `You're averaging ${avgSleepHours.toFixed(1)} hours with quality ${avgSleepQuality.toFixed(1)}/5. Good sleep is essential for hormonal balance.`,
          severity: 'info',
          confidence: 85,
        });
      }
    }

    // === PCOS Risk Insights ===
    if (pcosRecords.length > 0) {
      const latestRecord = pcosRecords[0];
      if (latestRecord.riskScore && latestRecord.riskScore > 60) {
        insights.push({
          category: 'pcos',
          title: 'Elevated PCOS Risk Score',
          description: `Your latest PCOS risk score is ${Math.round(latestRecord.riskScore)}%. We recommend consulting with an endocrinologist for a comprehensive evaluation.`,
          severity: 'action',
          confidence: 92,
        });
      } else if (latestRecord.riskScore && latestRecord.riskScore > 30) {
        insights.push({
          category: 'pcos',
          title: 'Moderate PCOS Risk',
          description: `Your PCOS risk score is ${Math.round(latestRecord.riskScore)}%. Continue tracking symptoms and maintain a healthy lifestyle with regular exercise and balanced nutrition.`,
          severity: 'info',
          confidence: 85,
        });
      }
    }

    // === Symptom-Cycle Correlation ===
    if (cycles.length > 0 && symptoms.length > 0) {
      const latestCycle = cycles[0];
      if (latestCycle.startDate) {
        const cycleStart = new Date(latestCycle.startDate);
        const cycleDaySymptoms = symptoms.map((s) => {
          const symptomDate = new Date(s.date);
          const dayDiff = Math.floor(
            (symptomDate.getTime() - cycleStart.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return { ...s, cycleDay: dayDiff };
        });

        // Check for luteal phase symptoms (last 14 days of cycle)
        const lutealSymptoms = cycleDaySymptoms.filter(
          (s) =>
            s.cycleDay > (latestCycle.cycleLength ?? 28) - 14 &&
            s.cycleDay <= (latestCycle.cycleLength ?? 28)
        );

        if (lutealSymptoms.length > 5) {
          insights.push({
            category: 'correlation',
            title: 'Luteal Phase Symptom Cluster',
            description: `You tend to experience more symptoms in the luteal phase (after ovulation). This could indicate PMS/PMDD. Track these patterns to discuss with your doctor.`,
            severity: 'info',
            confidence: 72,
          });
        }
      }
    }

    // === General Wellness Insight ===
    if (insights.length === 0) {
      insights.push({
        category: 'general',
        title: 'Keep Tracking!',
        description:
          'Continue logging your symptoms, mood, sleep, and cycle data. More data leads to better insights about your health patterns.',
        severity: 'info',
        confidence: 100,
      });
    }

    return NextResponse.json({
      userId,
      generatedAt: new Date().toISOString(),
      dataPoints: {
        symptoms: symptoms.length,
        moodEntries: moodEntries.length,
        sleepEntries: sleepEntries.length,
        cycles: cycles.length,
        pcosRecords: pcosRecords.length,
      },
      insights,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
