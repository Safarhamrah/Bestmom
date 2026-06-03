import { z } from 'zod';

export const strictAppointmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string().nullable(),
  notes: z.string().nullable(),
  questions: z.array(z.string()).nullable(),
  summary: z.string().nullable(),
  done: z.boolean(),
});

export const strictChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['Hospital Bag', 'Baby Essentials', 'Before Birth', 'After Birth']),
  done: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  explanation: z.string().nullable(),
});

export const strictPlannerNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
  concernLevel: z.enum(['low', 'medium', 'high']).nullable(),
});

export const strictPlannerStateSchema = z.object({
  dueDate: z.string().nullable(),
  lastPeriodDate: z.string().nullable(),
  cycleLength: z.number(),
  appointments: z.array(strictAppointmentSchema),
  checklist: z.array(strictChecklistItemSchema),
  notes: z.array(strictPlannerNoteSchema),
  concerns: z.array(z.string()),
  reminders: z.array(z.string()),
  feedingPreference: z.string().nullable(),
  supportPlan: z.string().nullable(),
  invitedUsers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      relationship: z.enum(['husband', 'partner', 'family', 'support']),
      status: z.enum(['pending', 'accepted']),
      canView: z.boolean(),
      canEdit: z.boolean(),
      invitedAt: z.string(),
    }),
  ),
  theme: z.enum(['light', 'dark']),
});

export function denull<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => denull(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, entry === null ? undefined : denull(entry)]),
    ) as T;
  }
  return value;
}
