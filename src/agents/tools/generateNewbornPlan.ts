import { tool } from '@openai/agents';
import { z } from 'zod';

export function generateNewbornPlan(input: {
  feedingPreference?: string;
  supportPlan?: string;
  notes?: string[];
}) {
  return {
    firstWeek: [
      'Confirm the first pediatrician visit and keep discharge papers nearby.',
      `Set up a feeding log${input.feedingPreference ? ` for ${input.feedingPreference}` : ''}, diaper counts, and questions for the care team.`,
      'Keep recovery supplies, water, snacks, and phone charger within reach.',
      input.supportPlan ? `Use your support plan: ${input.supportPlan}` : 'Choose two people who can help with meals, errands, or overnight support.',
      'Decide visitor boundaries before discharge so you are not deciding while exhausted.',
      'Make safe sleep simple: firm flat surface, no loose bedding, baby on back.',
    ],
    reminder: 'For urgent newborn concerns, call your pediatrician, local health line, or emergency services.',
  };
}

export const generateNewbornPlanTool = tool({
  name: 'generateNewbornPlanTool',
  description: 'Create a first-week newborn plan including feeding notes, checkups, rest, visitor boundaries, supplies, and support.',
  parameters: z.object({
    feedingPreference: z.string().nullable(),
    supportPlan: z.string().nullable(),
    notes: z.array(z.string()).nullable(),
  }),
  execute: async (args) =>
    generateNewbornPlan({
      feedingPreference: args.feedingPreference ?? undefined,
      supportPlan: args.supportPlan ?? undefined,
      notes: args.notes ?? undefined,
    }),
});
