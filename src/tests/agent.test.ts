import { describe, expect, it } from 'vitest';
import { createBabyPlannerAgent, buildAgentInput } from '../agents/babyPlannerAgent';

describe('Baby Planner agent setup', () => {
  it('creates an agent with Baby Planner tools and current model default', () => {
    const agent = createBabyPlannerAgent() as any;
    expect(agent.name).toBe('Baby Planner');
    expect(agent.tools.length).toBe(8);
    expect(agent.instructions).toContain('not medical advice');
  });

  it('builds private planner state context', () => {
    const input = buildAgentInput('What should I do?', { dueDate: '2026-09-01' });
    expect(input).toContain('Planner state JSON');
    expect(input).toContain('2026-09-01');
    expect(input).toContain('private local context');
  });
});
