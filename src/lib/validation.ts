import { z } from 'zod';

export const appointmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional(),
  notes: z.string().optional(),
  questions: z.array(z.string()).optional(),
  summary: z.string().optional(),
  done: z.boolean(),
});

export const checklistCategorySchema = z.enum([
  'Hospital Bag',
  'Baby Essentials',
  'Before Birth',
  'After Birth',
]);

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  category: checklistCategorySchema,
  done: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  explanation: z.string().optional(),
});

export const plannerNoteSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  createdAt: z.string(),
  concernLevel: z.enum(['low', 'medium', 'high']).optional(),
});

export const plannerStateSchema = z.object({
  dueDate: z.string().optional(),
  lastPeriodDate: z.string().optional(),
  cycleLength: z.number().int().min(20).max(45).default(28),
  appointments: z.array(appointmentSchema).default([]),
  checklist: z.array(checklistItemSchema).default([]),
  notes: z.array(plannerNoteSchema).default([]),
  concerns: z.array(z.string()).default([]),
  reminders: z.array(z.string()).default([]),
  feedingPreference: z.string().optional(),
  supportPlan: z.string().optional(),
  invitedUsers: z
    .array(
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
    )
    .default([]),
  theme: z.enum(['light', 'dark']).default('light'),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
  createdAt: z.string(),
});

export const agentRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  plannerState: plannerStateSchema,
  conversation: z.array(chatMessageSchema).max(16).default([]),
});

export const validatePlannerState = (value: unknown) => plannerStateSchema.parse(value);
