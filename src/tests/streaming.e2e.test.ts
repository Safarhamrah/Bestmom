import 'dotenv/config';

const endpoint = process.env.BABY_PLANNER_AGENT_URL || 'http://127.0.0.1:8787/api/agent';

const plannerState = {
  dueDate: '2026-09-01',
  lastPeriodDate: '',
  cycleLength: 28,
  appointments: [
    {
      id: 'appt-1',
      title: 'Prenatal visit',
      date: '2026-06-15',
      time: '10:00',
      notes: 'Ask about movement, hospital registration, and birth plan.',
      done: false,
    },
  ],
  checklist: [
    { id: 'bag-1', label: 'Pack hospital bag documents', category: 'Hospital Bag', done: false, priority: 'high' },
    { id: 'birth-1', label: 'Install car seat', category: 'Before Birth', done: false, priority: 'high' },
    { id: 'baby-1', label: 'Set up safe sleep space', category: 'Baby Essentials', done: true, priority: 'high' },
  ],
  notes: [{ id: 'note-1', text: 'I want a simple four week plan and doctor questions.', createdAt: new Date().toISOString() }],
  concerns: ['What am I missing before birth?'],
  reminders: [],
  feedingPreference: 'breastfeeding with formula backup',
  supportPlan: 'Partner handles meals and grandparents help with laundry.',
  theme: 'light',
};

async function main() {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Create a simple plan for the next 4 weeks and tell me what to ask my doctor.',
      plannerState,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sawToolProgress = false;
  let sawTextDelta = false;
  let text = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const line = chunk.split('\n').find((part) => part.startsWith('data: '));
      if (!line) continue;
      const event = JSON.parse(line.slice(6));
      if (event.type === 'tool-progress') sawToolProgress = true;
      if (event.type === 'text-delta' && event.delta) {
        sawTextDelta = true;
        text += event.delta;
      }
      if (event.type === 'error') throw new Error(event.message);
    }
  }

  if (!sawToolProgress) throw new Error('No tool progress event received.');
  if (!sawTextDelta) throw new Error('No model text delta received.');
  console.log(JSON.stringify({ sawToolProgress, sawTextDelta, textPreview: text.slice(0, 240) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
