import { tool } from '@openai/agents';
import { z } from 'zod';
import type { PregnancyProgress } from '../../lib/types';

const MS_PER_DAY = 86_400_000;

function parseDateOnly(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function diffDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function babySizeForWeek(week?: number) {
  if (!week || week < 4) return 'early planning';
  if (week < 8) return 'a tiny seed';
  if (week < 12) return 'a lime';
  if (week < 16) return 'an avocado';
  if (week < 20) return 'a mango';
  if (week < 24) return 'an ear of corn';
  if (week < 28) return 'an eggplant';
  if (week < 32) return 'a squash';
  if (week < 36) return 'a pineapple';
  if (week < 40) return 'a small watermelon';
  return 'ready to meet you soon';
}

export function calculatePregnancyProgress(input: {
  dueDate?: string;
  lastPeriodDate?: string;
  cycleLength?: number;
  today?: string;
}): PregnancyProgress {
  const today = parseDateOnly(input.today) ?? parseDateOnly(new Date().toISOString().slice(0, 10))!;
  const lmp = parseDateOnly(input.lastPeriodDate);
  const cycleAdjustment = (input.cycleLength ?? 28) - 28;
  const calculatedDue = input.dueDate
    ? parseDateOnly(input.dueDate)
    : lmp
      ? addDays(lmp, 280 + cycleAdjustment)
      : undefined;

  if (!calculatedDue) {
    return {
      trimester: 'unknown',
      planningStage: 'Add a due date or last period date to personalize the plan.',
      babySize: 'unknown',
    };
  }

  const daysLeft = diffDays(calculatedDue, today);
  const gestationalDay = 280 - daysLeft;
  const pregnancyWeek = Math.max(0, Math.floor(gestationalDay / 7));
  const pregnancyDay = Math.max(0, gestationalDay % 7);
  const trimester =
    daysLeft < -21
      ? 'postpartum'
      : pregnancyWeek < 1
        ? 'pre-pregnancy'
        : pregnancyWeek < 14
          ? 'first'
          : pregnancyWeek < 28
            ? 'second'
            : 'third';

  const planningStage =
    trimester === 'first'
      ? 'Foundation: appointments, symptoms to track, early essentials.'
      : trimester === 'second'
        ? 'Build-out: anatomy scan, registry, classes, nursery basics.'
        : trimester === 'third'
          ? 'Ready-up: hospital bag, car seat, pediatrician, support plan.'
          : trimester === 'postpartum'
            ? 'Newborn care: recovery, feeding rhythm, checkups, rest.'
            : 'Date estimate ready; confirm with your healthcare provider.';

  return {
    dueDate: toDateOnly(calculatedDue),
    pregnancyWeek,
    pregnancyDay,
    daysLeft,
    trimester,
    planningStage,
    babySize: babySizeForWeek(pregnancyWeek),
  };
}

export const calculatePregnancyProgressTool = tool({
  name: 'calculatePregnancyProgressTool',
  description:
    'Estimate pregnancy week, days left, trimester, baby size, and planning stage from due date or last period date.',
  parameters: z.object({
    dueDate: z.string().nullable(),
    lastPeriodDate: z.string().nullable(),
    cycleLength: z.number().nullable(),
    today: z.string().nullable(),
  }),
  execute: async (args) =>
    calculatePregnancyProgress({
      dueDate: args.dueDate ?? undefined,
      lastPeriodDate: args.lastPeriodDate ?? undefined,
      cycleLength: args.cycleLength ?? undefined,
      today: args.today ?? undefined,
    }),
});
