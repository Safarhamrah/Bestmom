import type { Router } from 'express';
import { run } from '@openai/agents';
import { createBabyPlannerAgent, buildAgentInput } from '../../agents/babyPlannerAgent';
import { agentRequestSchema } from '../../lib/validation';
import { describeToolProgress, extractTextDelta, writeSse } from '../../lib/streaming';

export function registerAgentRoute(router: Router) {
  router.post('/agent', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      if (!process.env.OPENAI_API_KEY) {
        writeSse(res, { type: 'error', message: 'OPENAI_API_KEY is not set in the server environment.' });
        res.end();
        return;
      }

      const { message, plannerState, conversation } = agentRequestSchema.parse(req.body);
      const agent = createBabyPlannerAgent();
      const input = buildAgentInput(message, plannerState, conversation);
      let finalText = '';
      let sawToolProgress = false;

      writeSse(res, { type: 'tool-progress', label: 'Creating your weekly plan...', tool: 'babyPlannerAgent' });

      const stream = await run(agent, input, { stream: true, maxTurns: 12 });

      for await (const event of stream) {
        const progress = describeToolProgress(event);
        if (progress) {
          sawToolProgress = true;
          writeSse(res, { type: 'tool-progress', ...progress });
        }

        const delta = extractTextDelta(event);
        if (delta) {
          finalText += delta;
          writeSse(res, { type: 'text-delta', delta });
        }
      }

      await stream.completed;
      if (!sawToolProgress) {
        writeSse(res, { type: 'tool-progress', label: 'Review complete.', tool: 'babyPlannerAgent' });
      }
      writeSse(res, { type: 'final', text: finalText || String(stream.finalOutput ?? '') });
      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected agent error.';
      writeSse(res, { type: 'error', message });
      res.end();
    }
  });
}
