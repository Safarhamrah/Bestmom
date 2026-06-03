import { Agent } from '@openai/agents';
import { babyPlannerInstructions } from './instructions';
import {
  calculatePregnancyProgressTool,
  checkBirthReadinessTool,
  createGentleReminderTool,
  extractBabyPrepTasksTool,
  generateAppointmentQuestionsTool,
  generateNewbornPlanTool,
  prioritizeChecklistTool,
  summarizePlannerStateTool,
} from './tools';

export function createBabyPlannerAgent() {
  return new Agent({
    name: 'Baby Planner',
    instructions: babyPlannerInstructions,
    model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    tools: [
      calculatePregnancyProgressTool,
      summarizePlannerStateTool,
      prioritizeChecklistTool,
      checkBirthReadinessTool,
      generateAppointmentQuestionsTool,
      extractBabyPrepTasksTool,
      generateNewbornPlanTool,
      createGentleReminderTool,
    ],
  });
}

export function buildAgentInput(message: string, plannerState: unknown, conversation: Array<{ role: string; content: string }> = []) {
  const recentConversation = conversation
    .slice(-10)
    .map((turn) => `${turn.role === 'assistant' ? 'Baby Planner' : 'Parent'}: ${turn.content}`)
    .join('\n\n');

  return `
User request:
${message}

Recent conversation:
${recentConversation || 'No prior turns in this chat yet.'}

Planner state JSON:
${JSON.stringify(plannerState, null, 2)}

Use the planner state as private local context. Continue naturally from the recent conversation. Do not repeat earlier answers unless the user asks. If key details are missing, ask gentle follow-up questions.
`;
}
