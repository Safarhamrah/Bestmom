import { tool } from '@openai/agents';
import { z } from 'zod';
import { denull, strictAppointmentSchema } from './toolSchemas';
import type { Appointment } from '../../lib/types';

export function generateAppointmentQuestions(input: {
  trimester?: string;
  symptoms?: string[];
  notes?: string[];
  concerns?: string[];
  nextAppointment?: Appointment;
}) {
  const trimester = input.trimester ?? 'unknown';
  const base = [
    'What should I focus on between this visit and the next one?',
    'Are there any symptoms or changes that should prompt me to call you?',
    'Is my current appointment schedule appropriate for this stage?',
  ];
  const trimesterQuestions =
    trimester === 'third'
      ? ['When should I call before going to labor and delivery?', 'What documents or test results should I bring to the hospital?']
      : trimester === 'second'
        ? ['What should I know about upcoming scans, tests, or classes?', 'Are there movement patterns I should begin noticing?']
        : ['What early pregnancy symptoms are expected, and what should I track?', 'Are there lifestyle changes you recommend for this stage?'];
  const concernQuestions = (input.concerns ?? []).slice(0, 3).map((concern) => `Can we talk through this concern: ${concern}?`);
  return {
    appointment: input.nextAppointment?.title ?? 'Next appointment',
    questions: [...base, ...trimesterQuestions, ...concernQuestions].slice(0, 8),
  };
}

export const generateAppointmentQuestionsTool = tool({
  name: 'generateAppointmentQuestionsTool',
  description: 'Create personalized questions for the next appointment based on trimester, symptoms, notes, and concerns.',
  parameters: z.object({
    trimester: z.string().nullable(),
    symptoms: z.array(z.string()).nullable(),
    notes: z.array(z.string()).nullable(),
    concerns: z.array(z.string()).nullable(),
    nextAppointment: strictAppointmentSchema.nullable(),
  }),
  execute: async (args) =>
    generateAppointmentQuestions({
      trimester: args.trimester ?? undefined,
      symptoms: args.symptoms ?? undefined,
      notes: args.notes ?? undefined,
      concerns: args.concerns ?? undefined,
      nextAppointment: args.nextAppointment ? (denull(args.nextAppointment) as Appointment) : undefined,
    }),
});
