import type { Router } from 'express';

export function registerHealthRoute(router: Router) {
  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'baby-planner-agent',
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    });
  });
}
