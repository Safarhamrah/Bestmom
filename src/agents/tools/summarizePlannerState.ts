import { tool } from '@openai/agents';
import { z } from 'zod';
import type { PlannerState, PregnancyProgress } from '../../lib/types';
import { denull, strictPlannerStateSchema } from './toolSchemas';

export function summarizePlannerState(input: { state: PlannerState; progress?: PregnancyProgress }) {
  const nextAppointment = input.state.appointments
    .filter((appointment) => !appointment.done)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const done = input.state.checklist.filter((item) => item.done).length;
  const total = input.state.checklist.length;
  return {
    dueDate: input.progress?.dueDate ?? input.state.dueDate ?? 'not set',
    trimester: input.progress?.trimester ?? 'unknown',
    nextAppointment: nextAppointment ? `${nextAppointment.title} on ${nextAppointment.date}` : 'No upcoming appointment saved',
    checklistProgress: total ? `${done}/${total}` : 'No checklist items yet',
    notesCount: input.state.notes.length,
    concerns: input.state.concerns.slice(0, 5),
    missingDetails: [
      !input.state.dueDate && !input.state.lastPeriodDate ? 'due date or last period date' : '',
      !nextAppointment ? 'next appointment' : '',
      total === 0 ? 'checklist items' : '',
      !input.state.supportPlan ? 'support plan' : '',
    ].filter(Boolean),
  };
}

export const summarizePlannerStateTool = tool({
  name: 'summarizePlannerStateTool',
  description: 'Summarize due date, appointments, checklist progress, notes, concerns, and missing details.',
  parameters: z.object({
    state: strictPlannerStateSchema,
    progress: z
      .object({
        dueDate: z.string().nullable(),
        pregnancyWeek: z.number().nullable(),
        pregnancyDay: z.number().nullable(),
        daysLeft: z.number().nullable(),
        trimester: z.string(),
        planningStage: z.string(),
        babySize: z.string(),
      })
      .nullable(),
  }),
  execute: async (args) =>
    summarizePlannerState({
      state: denull(args.state) as PlannerState,
      progress: args.progress ? (denull(args.progress) as PregnancyProgress) : undefined,
    }),
});
