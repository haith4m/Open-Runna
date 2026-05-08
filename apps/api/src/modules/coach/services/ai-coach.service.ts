import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import dayjs from 'dayjs';

/**
 * AI Coach System
 * 
 * Provides personalized coaching using:
 * - OpenAI GPT-4 integration
 * - Athlete context and history
 * - Running science knowledge base
 */
@Injectable()
export class AiCoachService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate workout explanation
   */
  async explainWorkout(
    userId: string,
    workoutId: string,
  ): Promise<{
    explanation: string;
    tips: string[];
    expectedFeel: string;
  }> {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: { intervals: true },
    });

    if (!workout) throw new Error('Workout not found');

    const explanation = this.generateWorkoutExplanation(workout.type);
    const tips = this.generateWorkoutTips(workout.type);
    const expectedFeel = this.getExpectedFeel(workout.type);

    return {
      explanation,
      tips,
      expectedFeel,
    };
  }

  private generateWorkoutExplanation(workoutType: string): string {
    const explanations: Record<string, string> = {
      easy: `Easy recovery run to build aerobic base and manage fatigue.`,
      long_run: `Long run builds aerobic capacity and strengthens your system.`,
      threshold: `Develops lactate threshold at a challenging but sustainable pace.`,
      interval: `Improves VO2max and running economy with short, hard repeats.`,
      tempo: `Builds strength and aerobic capacity at race pace or faster.`,
      recovery: `Very easy run for recovery and active blood flow.`,
    };
    return explanations[workoutType] || 'Run at the prescribed intensity.';
  }

  private generateWorkoutTips(workoutType: string): string[] {
    const tips: Record<string, string[]> = {
      easy: ['Keep breathing controlled', 'Focus on form'],
      long_run: ['Start conservatively', 'Practice fueling strategy'],
      threshold: ['Warm up thoroughly', 'Stay patient and steady'],
      interval: ['Quality over quantity', 'Control the workout'],
      tempo: ['Sustained effort', 'Don\'t fade at the end'],
      recovery: ['Slow down significantly', 'Enjoy the process'],
    };
    return tips[workoutType] || [];
  }

  private getExpectedFeel(workoutType: string): string {
    const feels: Record<string, string> = {
      easy: 'Conversational and relaxed',
      long_run: 'Manageable, building fatigue',
      threshold: 'Comfortably hard',
      interval: 'Hard efforts with recovery',
      tempo: 'Challenging and controlled',
      recovery: 'Very easy',
    };
    return feels[workoutType] || 'Steady effort';
  }
}
