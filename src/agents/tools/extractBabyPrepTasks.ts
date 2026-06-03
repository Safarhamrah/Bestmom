import { tool } from '@openai/agents';
import { z } from 'zod';

export function extractBabyPrepTasks(input: {
  notes?: string[];
  concerns?: string[];
  appointmentDetails?: string[];
}) {
  const text = [...(input.notes ?? []), ...(input.concerns ?? []), ...(input.appointmentDetails ?? [])]
    .join(' ')
    .toLowerCase();
  const tasks: Array<{ task: string; category: string; reason: string }> = [];

  const add = (task: string, category: string, reason: string) => {
    if (!tasks.some((item) => item.task === task)) tasks.push({ task, category, reason });
  };

  if (text.includes('car seat')) add('Install and inspect the car seat', 'Before Birth', 'Car seat readiness is needed before the trip home.');
  if (text.includes('pediatrician')) add('Choose or confirm a pediatrician', 'Before Birth', 'Newborn follow-up is usually scheduled soon after discharge.');
  if (text.includes('bag') || text.includes('hospital')) add('Finish hospital bag essentials', 'Hospital Bag', 'A packed bag reduces last-minute decisions.');
  if (text.includes('feeding') || text.includes('pump') || text.includes('formula')) add('Prepare feeding supplies and questions', 'Baby Essentials', 'Feeding plans are easier with supplies and backup questions ready.');
  if (text.includes('sleep') || text.includes('bassinet') || text.includes('crib')) add('Confirm a safe sleep space', 'Baby Essentials', 'A clear newborn sleep setup is a high-priority readiness item.');
  if (text.includes('support') || text.includes('visitor')) add('Write a simple support and visitor plan', 'After Birth', 'Boundaries and help reduce postpartum decision load.');
  if (tasks.length === 0) add('Add one concrete prep note or concern', 'Before Birth', 'More details will help Baby Planner make the plan personal.');

  return { tasks };
}

export const extractBabyPrepTasksTool = tool({
  name: 'extractBabyPrepTasksTool',
  description: 'Extract practical baby preparation tasks from notes, concerns, and appointment details.',
  parameters: z.object({
    notes: z.array(z.string()).nullable(),
    concerns: z.array(z.string()).nullable(),
    appointmentDetails: z.array(z.string()).nullable(),
  }),
  execute: async (args) =>
    extractBabyPrepTasks({
      notes: args.notes ?? undefined,
      concerns: args.concerns ?? undefined,
      appointmentDetails: args.appointmentDetails ?? undefined,
    }),
});
