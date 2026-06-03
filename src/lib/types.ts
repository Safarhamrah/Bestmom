export type ChecklistCategory = 'Hospital Bag' | 'Baby Essentials' | 'Before Birth' | 'After Birth';

export type Appointment = {
  id: string;
  title: string;
  date: string;
  time?: string;
  notes?: string;
  questions?: string[];
  summary?: string;
  done: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  category: ChecklistCategory;
  done: boolean;
  priority?: 'low' | 'medium' | 'high';
  explanation?: string;
};

export type PlannerNote = {
  id: string;
  text: string;
  createdAt: string;
  concernLevel?: 'low' | 'medium' | 'high';
};

export type PlannerUser = {
  id: string;
  name: string;
  email: string;
  authProvider: 'email' | 'google';
  role: 'parent' | 'partner' | 'support';
  avatarInitials: string;
};

export type InvitedUser = {
  id: string;
  name: string;
  email: string;
  relationship: 'husband' | 'partner' | 'family' | 'support';
  status: 'pending' | 'accepted';
  canView: boolean;
  canEdit: boolean;
  invitedAt: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type PlannerState = {
  dueDate?: string;
  lastPeriodDate?: string;
  cycleLength: number;
  appointments: Appointment[];
  checklist: ChecklistItem[];
  notes: PlannerNote[];
  concerns: string[];
  reminders: string[];
  feedingPreference?: string;
  supportPlan?: string;
  invitedUsers: InvitedUser[];
  theme: 'light' | 'dark';
};

export type PregnancyProgress = {
  dueDate?: string;
  pregnancyWeek?: number;
  pregnancyDay?: number;
  daysLeft?: number;
  trimester: 'pre-pregnancy' | 'first' | 'second' | 'third' | 'postpartum' | 'unknown';
  planningStage: string;
  babySize: string;
};

export type StreamEvent =
  | { type: 'tool-progress'; label: string; tool?: string }
  | { type: 'text-delta'; delta: string }
  | { type: 'final'; text: string }
  | { type: 'error'; message: string };
