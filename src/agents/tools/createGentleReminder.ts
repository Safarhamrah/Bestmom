import { tool } from '@openai/agents';
import { z } from 'zod';

export function createGentleReminder(input: { topic: string; daysLeft?: number; concern?: string }) {
  const timing = input.daysLeft !== undefined && input.daysLeft < 45 ? 'soon' : 'when you have a quiet moment';
  return {
    reminder: `A gentle next step ${timing}: ${input.topic}. Keep it small and ask your care team if anything feels medical or urgent.`,
    tone: 'supportive',
    escalation:
      input.concern && /bleeding|reduced fetal movement|severe|fever|vision|headache|pain/i.test(input.concern)
        ? 'Because this could be urgent, contact your healthcare provider, local health line, or emergency services now.'
        : undefined,
  };
}

export const createGentleReminderTool = tool({
  name: 'createGentleReminderTool',
  description: 'Generate supportive reminders without sounding scary or overwhelming.',
  parameters: z.object({
    topic: z.string(),
    daysLeft: z.number().nullable(),
    concern: z.string().nullable(),
  }),
  execute: async (args) =>
    createGentleReminder({
      topic: args.topic,
      daysLeft: args.daysLeft ?? undefined,
      concern: args.concern ?? undefined,
    }),
});
