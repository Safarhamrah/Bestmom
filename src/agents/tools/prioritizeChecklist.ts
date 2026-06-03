import { tool } from '@openai/agents';
import { z } from 'zod';
import type { ChecklistItem, PlannerState } from '../../lib/types';
import { denull, strictPlannerStateSchema } from './toolSchemas';

function urgency(item: ChecklistItem, daysLeft?: number) {
  const text = item.label.toLowerCase();
  let score = item.done ? -100 : 0;
  if (item.category === 'Hospital Bag') score += daysLeft !== undefined && daysLeft <= 45 ? 35 : 15;
  if (item.category === 'Before Birth') score += daysLeft !== undefined && daysLeft <= 75 ? 30 : 12;
  if (text.includes('car seat') || text.includes('pediatrician') || text.includes('safe sleep')) score += 35;
  if (text.includes('document') || text.includes('contact')) score += 20;
  if (item.priority === 'high') score += 25;
  if (item.priority === 'medium') score += 10;
  return score;
}

export function prioritizeChecklist(input: { state: PlannerState; daysLeft?: number }) {
  return {
    prioritized: [...input.state.checklist]
      .map((item) => ({
        ...item,
        urgency: urgency(item, input.daysLeft),
        explanation:
          item.done ? 'Completed.' : item.category === 'Hospital Bag' ? 'Helpful to finish before late third trimester.' : 'Keeps the baby prep plan moving.',
      }))
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 12),
  };
}

export const prioritizeChecklistTool = tool({
  name: 'prioritizeChecklistTool',
  description: 'Sort checklist items by urgency based on due date, current progress, and category.',
  parameters: z.object({
    state: strictPlannerStateSchema,
    daysLeft: z.number().nullable(),
  }),
  execute: async (args) => prioritizeChecklist({ state: denull(args.state) as PlannerState, daysLeft: args.daysLeft ?? undefined }),
});
