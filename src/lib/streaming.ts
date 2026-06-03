import type { Response } from 'express';
import type { StreamEvent } from './types';

export function writeSse(res: Response, event: StreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function extractTextDelta(event: any): string {
  if (event?.type !== 'raw_model_stream_event') return '';
  const data = event.data;
  if (data?.type === 'output_text_delta' && typeof data.delta === 'string') return data.delta;
  return '';
}

export function describeToolProgress(event: any): { label: string; tool?: string } | null {
  if (event?.type !== 'run_item_stream_event') return null;
  const item = event.item ?? {};
  const raw = item.rawItem ?? item;
  const name = item.name ?? raw.name ?? item.toolName ?? raw.tool_name;
  const kind = item.type ?? raw.type ?? event.name;
  const kindText = String(kind ?? '');
  if (kindText.includes('message_output') || kindText.includes('reasoning')) return null;
  if (!name && !kind) return null;
  const normalized = String(name ?? kind);
  if (normalized.includes('readiness')) return { label: 'Checking readiness...', tool: normalized };
  if (normalized.includes('appointment')) return { label: 'Reviewing appointments...', tool: normalized };
  if (normalized.includes('prioritize') || normalized.includes('checklist')) {
    return { label: 'Prioritizing checklist...', tool: normalized };
  }
  if (normalized.includes('newborn') || normalized.includes('pregnancy') || normalized.includes('summary')) {
    return { label: 'Creating your weekly plan...', tool: normalized };
  }
  return { label: `Using ${normalized}...`, tool: normalized };
}
