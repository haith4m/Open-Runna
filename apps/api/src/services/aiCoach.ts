/**
 * AI Coach Service — Powered by Claude
 *
 * The coach personality:
 *  - Calm, credible, direct — like a wise coach who has seen it all
 *  - Never preachy, never robotic
 *  - Uses sports science fluently but explains it simply
 *  - Empathetic but honest — doesn't tell athletes what they want to hear
 *  - Remembers context within a session
 *  - Proactively flags concerns (overtraining, poor recovery, unrealistic expectations)
 *
 * Prompt architecture:
 *  - System: Coach identity + athlete profile + training context
 *  - History: Last 10 messages for conversational continuity
 *  - User: Current question
 *
 * The system prompt is rebuilt on every call to include the latest
 * athlete data — this is intentional, not a memory limitation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { formatPace } from "@openrunna/shared";

const client = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

interface ChatParams {
  userId: string;
  userMessage: string;
  contextType: string;
  profile: any;
  activePlan: any;
  recentRuns: any[];
  messageHistory: { role: string; content: string }[];
  workout?: any;
}

interface WeekSummaryParams {
  profile: any;
  week: any;
  recentRuns: any[];
}

export class AiCoachService {
  async chat(params: ChatParams): Promise<string> {
    const systemPrompt = buildSystemPrompt(params);

    const messages: Anthropic.MessageParam[] = [
      // Include recent conversation history
      ...params.messageHistory.slice(-8).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: params.userMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    if (content?.type !== "text") return "I couldn't generate a response. Please try again.";
    return content.text;
  }

  async generateWeekSummary(params: WeekSummaryParams): Promise<string> {
    const { week, recentRuns, profile } = params;

    const completedWorkouts = week.workouts.filter((w: any) => w.status === "completed");
    const skippedWorkouts  = week.workouts.filter((w: any) => w.status === "skipped" || w.status === "missed");
    const totalActualKm    = recentRuns.reduce((s: number, r: any) => s + r.totalDistanceMeters / 1000, 0);
    const avgRpe           = recentRuns
      .filter((r: any) => r.perceivedEffort)
      .reduce((s: number, r: any, _, arr: any[]) => s + r.perceivedEffort / arr.length, 0);

    const prompt = `
Generate a concise weekly training summary for this runner.

WEEK DATA:
- Phase: ${week.phase} (${week.phaseDescription})
- Week ${week.weekNumber} of the plan
- Planned distance: ${week.plannedDistanceKm} km
- Actual distance: ${Math.round(totalActualKm * 10) / 10} km
- Completed sessions: ${completedWorkouts.length} of ${week.workouts.length}
- Skipped: ${skippedWorkouts.length} sessions
- Average RPE this week: ${avgRpe ? avgRpe.toFixed(1) : "not recorded"}

Be honest about the week. Note what went well, what needs improvement, and 1-2 things to focus on next week. Keep it under 150 words. No bullet points — write as a coach speaking directly to their athlete.
`.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
      system: buildBaseCoachPersonality(profile),
    });

    const content = response.content[0];
    return content?.type === "text"
      ? content.text
      : "Great work this week. Keep consistent and trust the process.";
  }
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildBaseCoachPersonality(profile: any): string {
  return `You are an elite running coach — part sports scientist, part athlete psychologist, part trusted advisor. Your coaching style is:
- Direct and honest, never sugar-coating but always constructive
- Calm and confident — you've coached thousands of runners
- Grounded in real exercise science — you cite physiology when relevant but explain it simply
- You understand that most runners' failures are psychological (going too fast, skipping recovery, panicking about missed sessions)
- You never moralize or lecture — you state facts and let athletes make decisions
- Brief responses are better — a coach doesn't give speeches, they give cues
- You refer to the athlete as "you" and speak in second person

The athlete's name or profile: ${profile ? `${profile.experienceLevel} runner, ${profile.weeklyMileageKm}km/week` : "recreational runner"}`;
}

function buildSystemPrompt(params: ChatParams): string {
  const { profile, activePlan, recentRuns, workout } = params;

  const base = buildBaseCoachPersonality(profile);

  let context = "\n\nCURRENT ATHLETE CONTEXT:\n";

  if (profile) {
    context += `Experience: ${profile.experienceLevel}\n`;
    context += `Current weekly volume: ~${profile.weeklyMileageKm} km/week\n`;
    if (profile.vdot) {
      context += `VDOT: ${profile.vdot.toFixed(1)} (confidence: ${Math.round(profile.vdotConfidence * 100)}%)\n`;
    }
    if (profile.injuryRiskScore > 3) {
      context += `Injury risk: ${profile.injuryRiskScore}/10 — note this in advice\n`;
    }
  }

  if (activePlan) {
    const weeksLeft = Math.ceil(
      (new Date(activePlan.raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
    );
    context += `\nTRAINING PLAN:\n`;
    context += `Target: ${activePlan.targetDistance.replace("_", " ")} on ${new Date(activePlan.raceDate).toLocaleDateString()}\n`;
    context += `Weeks until race: ${weeksLeft}\n`;
    if (activePlan.vdot) {
      context += `Easy pace: ${formatPace(activePlan.easyPaceSecPerKm)}/km\n`;
      context += `Threshold pace: ${formatPace(activePlan.thresholdPaceSecPerKm)}/km\n`;
    }
  }

  if (recentRuns.length > 0) {
    context += `\nRECENT RUNS (last 5):\n`;
    for (const run of recentRuns.slice(0, 3)) {
      const km = Math.round(run.totalDistanceMeters / 100) / 10;
      const pace = run.averagePaceSecPerKm ? formatPace(run.averagePaceSecPerKm) : "unknown";
      context += `- ${km}km at ${pace}/km avg (TSS: ${run.trainingLoad?.toFixed(0) ?? "?"})\n`;
    }
  }

  if (workout) {
    context += `\nCURRENT WORKOUT BEING DISCUSSED:\n`;
    context += `${workout.title}: ${workout.description}\n`;
    context += `Coach rationale: ${workout.coachRationale}\n`;
  }

  const contextGuide = `\nCONTEXT TYPE: ${params.contextType}
${params.contextType === "workout_explanation" ? "The athlete is asking about a specific workout. Explain the physiological purpose clearly." : ""}
${params.contextType === "race_strategy" ? "Focus on pacing strategy, nutrition timing, and mental preparation." : ""}
${params.contextType === "motivation" ? "The athlete needs encouragement. Be genuine — not cheerleader-generic." : ""}

Keep responses under 200 words unless a detailed explanation is genuinely needed. No bullet points in conversational replies.`;

  return base + context + contextGuide;
}
