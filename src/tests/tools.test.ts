import { describe, expect, it } from 'vitest';
import {
  calculatePregnancyProgress,
  checkBirthReadiness,
  generateAppointmentQuestions,
  prioritizeChecklist,
} from '../agents/tools';
import type { PlannerState } from '../lib/types';

const state: PlannerState = {
  dueDate: '2026-09-01',
  lastPeriodDate: '',
  cycleLength: 28,
  appointments: [{ id: 'a1', title: 'Prenatal visit', date: '2026-06-15', time: '10:00', notes: 'Ask about hospital bag.', done: false }],
  checklist: [
    { id: 'c1', label: 'Install car seat', category: 'Before Birth', done: false, priority: 'high' },
    { id: 'c2', label: 'Pack hospital bag documents', category: 'Hospital Bag', done: true, priority: 'high' },
  ],
  notes: [{ id: 'n1', text: 'Need pediatrician and feeding supplies.', createdAt: '2026-06-01T00:00:00.000Z' }],
  concerns: ['What should I ask about movement?'],
  reminders: [],
  supportPlan: '',
  invitedUsers: [],
  theme: 'light',
};

describe('Baby Planner tools', () => {
  it('calculates pregnancy progress from due date', () => {
    const progress = calculatePregnancyProgress({ dueDate: '2026-09-01', today: '2026-06-01' });
    expect(progress.pregnancyWeek).toBeGreaterThan(25);
    expect(progress.trimester).toBe('second');
    expect(progress.daysLeft).toBe(92);
  });

  it('checks readiness against the requested rubric', () => {
    const readiness = checkBirthReadiness(state);
    expect(readiness.total).toBe(9);
    expect(readiness.alerts.some((alert) => alert.includes('Car seat'))).toBe(true);
  });

  it('prioritizes incomplete urgent checklist items', () => {
    const prioritized = prioritizeChecklist({ state, daysLeft: 30 }).prioritized;
    expect(prioritized[0].label).toBe('Install car seat');
  });

  it('creates appointment questions from trimester and concerns', () => {
    const questions = generateAppointmentQuestions({
      trimester: 'third',
      concerns: state.concerns,
      nextAppointment: state.appointments[0],
    }).questions;
    expect(questions.join(' ')).toContain('labor and delivery');
    expect(questions.join(' ')).toContain('movement');
  });
});
