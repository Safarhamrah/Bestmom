import { tool } from '@openai/agents';
import { z } from 'zod';
import type { PlannerState } from '../../lib/types';
import { denull, strictPlannerStateSchema } from './toolSchemas';

const rubric = [
  { key: 'hospital bag', category: 'Hospital Bag', label: 'Hospital bag' },
  { key: 'car seat', category: 'Before Birth', label: 'Car seat' },
  { key: 'pediatrician', category: 'Before Birth', label: 'Pediatrician' },
  { key: 'emergency contacts', category: 'Before Birth', label: 'Emergency contacts' },
  { key: 'recovery supplies', category: 'After Birth', label: 'Recovery supplies' },
  { key: 'feeding supplies', category: 'Baby Essentials', label: 'Feeding supplies' },
  { key: 'safe sleep', category: 'Baby Essentials', label: 'Safe sleep space' },
  { key: 'documents', category: 'Hospital Bag', label: 'Documents' },
  { key: 'support plan', category: 'After Birth', label: 'Support plan' },
];

export function checkBirthReadiness(state: PlannerState) {
  const text = [
    ...state.checklist.map((item) => `${item.label} ${item.category} ${item.done ? 'done' : ''}`),
    ...state.notes.map((note) => note.text),
    ...state.concerns,
    state.supportPlan ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const items = rubric.map((rubricItem) => {
    const matchingChecklist = state.checklist.find((item) =>
      `${item.label} ${item.category}`.toLowerCase().includes(rubricItem.key),
    );
    const ready = Boolean(matchingChecklist?.done || text.includes(`${rubricItem.key} done`) || (rubricItem.key === 'support plan' && state.supportPlan));
    return {
      label: rubricItem.label,
      category: rubricItem.category,
      ready,
      action: ready ? 'Already covered.' : `Add or complete: ${rubricItem.label}.`,
    };
  });

  const readyCount = items.filter((item) => item.ready).length;
  return {
    score: Math.round((readyCount / items.length) * 100),
    readyCount,
    total: items.length,
    items,
    alerts: items.filter((item) => !item.ready).slice(0, 4).map((item) => item.action),
  };
}

export const checkBirthReadinessTool = tool({
  name: 'checkBirthReadinessTool',
  description:
    'Check birth readiness against hospital bag, car seat, pediatrician, emergency contacts, recovery supplies, feeding supplies, safe sleep, documents, and support plan.',
  parameters: z.object({
    state: strictPlannerStateSchema,
  }),
  execute: async ({ state }) => checkBirthReadiness(denull(state) as PlannerState),
});
