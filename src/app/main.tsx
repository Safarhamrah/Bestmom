import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Baby,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Heart,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Minimize2,
  Moon,
  NotebookPen,
  PanelRightOpen,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { Appointment, ChatMessage, ChecklistCategory, PlannerNote, PlannerState, PlannerUser, PregnancyProgress, StreamEvent } from '../lib/types';
import './styles/main.css';

const categories: ChecklistCategory[] = ['Hospital Bag', 'Baby Essentials', 'Before Birth', 'After Birth'];

const seedState: PlannerState = {
  dueDate: '',
  lastPeriodDate: '',
  cycleLength: 28,
  appointments: [
    {
      id: crypto.randomUUID(),
      title: 'Prenatal visit',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().slice(0, 10),
      time: '10:00',
      notes: 'Ask about birth class timing and hospital registration.',
      questions: [],
      done: false,
    },
  ],
  checklist: [
    { id: crypto.randomUUID(), label: 'Pack ID, insurance card, and birth plan', category: 'Hospital Bag', done: false, priority: 'high' },
    { id: crypto.randomUUID(), label: 'Install car seat', category: 'Before Birth', done: false, priority: 'high' },
    { id: crypto.randomUUID(), label: 'Choose pediatrician', category: 'Before Birth', done: false, priority: 'high' },
    { id: crypto.randomUUID(), label: 'Set up safe sleep space', category: 'Baby Essentials', done: false, priority: 'high' },
    { id: crypto.randomUUID(), label: 'Prepare recovery supplies', category: 'After Birth', done: false, priority: 'medium' },
    { id: crypto.randomUUID(), label: 'Make support and visitor plan', category: 'After Birth', done: false, priority: 'medium' },
  ],
  notes: [
    {
      id: crypto.randomUUID(),
      text: 'Need a calmer plan for hospital bag, feeding supplies, and what to ask at the next visit.',
      createdAt: new Date().toISOString(),
      concernLevel: 'low',
    },
  ],
  concerns: [],
  reminders: ['Take one small prep step today.'],
  feedingPreference: '',
  supportPlan: '',
  invitedUsers: [
    {
      id: crypto.randomUUID(),
      name: 'Partner',
      email: 'partner@example.com',
      relationship: 'husband',
      status: 'pending',
      canView: true,
      canEdit: false,
      invitedAt: new Date().toISOString(),
    },
  ],
  theme: 'light',
};

function dateFrom(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function calculateProgress(state: PlannerState): PregnancyProgress {
  const today = dateFrom(new Date().toISOString().slice(0, 10))!;
  const due = state.dueDate ? dateFrom(state.dueDate) : state.lastPeriodDate ? addDays(dateFrom(state.lastPeriodDate)!, 280 + state.cycleLength - 28) : undefined;
  if (!due) {
    return { trimester: 'unknown', planningStage: 'Add a due date or last period date.', babySize: 'unknown' };
  }
  const daysLeft = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const gestationalDay = 280 - daysLeft;
  const week = Math.max(0, Math.floor(gestationalDay / 7));
  const day = Math.max(0, gestationalDay % 7);
  const trimester = daysLeft < -21 ? 'postpartum' : week < 14 ? 'first' : week < 28 ? 'second' : 'third';
  const babySize = week < 8 ? 'tiny seed' : week < 14 ? 'lime' : week < 20 ? 'mango' : week < 28 ? 'eggplant' : week < 36 ? 'pineapple' : 'small watermelon';
  return {
    dueDate: due.toISOString().slice(0, 10),
    pregnancyWeek: week,
    pregnancyDay: day,
    daysLeft,
    trimester,
    babySize,
    planningStage:
      trimester === 'first'
        ? 'Foundation: appointments, symptoms to track, early essentials.'
        : trimester === 'second'
          ? 'Build-out: anatomy scan, registry, classes, nursery basics.'
          : trimester === 'third'
            ? 'Ready-up: hospital bag, car seat, pediatrician, support plan.'
            : 'Newborn care: recovery, feeding rhythm, checkups, rest.',
  };
}

function readinessScore(state: PlannerState) {
  const required = ['hospital bag', 'car seat', 'pediatrician', 'safe sleep', 'documents', 'recovery', 'feeding', 'support'];
  const text = `${state.checklist.map((item) => `${item.label} ${item.done ? 'done' : ''}`).join(' ')} ${state.supportPlan}`.toLowerCase();
  const ready = required.filter((key) => text.includes(key) && (text.includes(`${key} done`) || key === 'support')).length;
  return Math.round((ready / required.length) * 100);
}

function usePlannerState() {
  const [state, setState] = React.useState<PlannerState>(() => {
    const saved = localStorage.getItem('baby-planner-state');
    return saved ? { ...seedState, ...JSON.parse(saved) } : seedState;
  });
  React.useEffect(() => {
    localStorage.setItem('baby-planner-state', JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  return [state, setState] as const;
}

function useAuth(updatePlanner: (patch: Partial<PlannerState>) => void) {
  const [user, setUser] = React.useState<PlannerUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    fetch('/api/auth/session')
      .then((response) => response.json())
      .then((data) => {
        if (!alive) return;
        setUser(data.user ?? null);
        if (data.invites) updatePlanner({ invitedUsers: data.invites });
      })
      .catch(() => {
        if (alive) setError('Could not check your sign-in session.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
  };

  return { user, setUser, loading, error, setError, signOut };
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BP';
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input {...props} />
    </label>
  );
}

function AuthScreen({ onAuth, onInvites }: { onAuth: (user: PlannerUser) => void; onInvites: (invites: PlannerState['invitedUsers']) => void }) {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [name, setName] = React.useState('Safar');
  const [email, setEmail] = React.useState('parent@example.com');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submitEmail = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signin' ? { email, password } : { name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Authentication failed.');
      onAuth(data.user);
      onInvites(data.invites ?? []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/google', { method: 'POST' });
      const data = await response.json();
      throw new Error(data.message ?? 'Google sign-in is not configured yet.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google sign-in is not configured yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <span className="brand-mark"><Baby size={24} /></span>
          <div>
            <strong>Baby Planner</strong>
            <span>private pregnancy and newborn planning</span>
          </div>
        </div>
        <div>
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your planner'}</h1>
          <p>Sign in to keep your due date, appointments, checklists, notes, partner invites, and AI planning conversation together on this device.</p>
        </div>
        <div className="auth-tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <button className="google-button" onClick={submitGoogle} disabled={loading}>
          <span>G</span>
          Continue with Google
        </button>
        <div className="divider"><span>or use email</span></div>
        {mode === 'signup' && <Field label="Full name" value={name} onChange={(event) => setName(event.target.value)} />}
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8+ characters" />
        {error && <p className="error">{error}</p>}
        <button className="primary auth-submit" onClick={submitEmail} disabled={loading}>
          {mode === 'signin' ? <Lock size={16} /> : <Mail size={16} />}
          {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <p className="auth-note">Email/password accounts are stored locally on this server with hashed passwords and an HTTP-only session cookie. Google requires OAuth credentials.</p>
      </section>
      <section className="auth-preview">
        <div className="preview-card">
          <p className="soft-label">Today’s calm plan</p>
          <h2>One shared place for baby prep</h2>
          <p>Invite a partner, track readiness, and ask the AI planner what matters next without losing your notes between visits.</p>
          <div className="preview-steps">
            <span><CalendarDays size={16} /> Due date</span>
            <span><ClipboardList size={16} /> Appointments</span>
            <span><Users size={16} /> Partner access</span>
            <span><Sparkles size={16} /> AI chat</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [state, setState] = usePlannerState();
  const [active, setActive] = React.useState('Dashboard');
  const [chatDock, setChatDock] = React.useState<'open' | 'minimized' | 'closed'>('open');
  const progress = calculateProgress(state);
  const nextAppointment = state.appointments.filter((item) => !item.done).sort((a, b) => a.date.localeCompare(b.date))[0];
  const completed = state.checklist.filter((item) => item.done).length;
  const readiness = readinessScore(state);

  const update = (patch: Partial<PlannerState>) => setState((current) => ({ ...current, ...patch }));
  const auth = useAuth(update);
  const toggleTheme = () => update({ theme: state.theme === 'dark' ? 'light' : 'dark' });

  if (auth.loading) {
    return (
      <main className="auth-shell single-auth">
        <section className="auth-panel">
          <div className="brand auth-brand">
            <span className="brand-mark"><Baby size={24} /></span>
            <div>
              <strong>Baby Planner</strong>
              <span>checking your secure session</span>
            </div>
          </div>
          <p>Opening your planner...</p>
        </section>
      </main>
    );
  }

  if (!auth.user) {
    return <AuthScreen onAuth={auth.setUser} onInvites={(invites) => update({ invitedUsers: invites })} />;
  }

  return (
    <div className={`app-shell ${chatDock !== 'open' ? 'chat-hidden' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Baby size={24} /></span>
          <div>
            <strong>Baby Planner</strong>
            <span>calm prep agent</span>
          </div>
        </div>
        <nav>
          {[
            ['Dashboard', Heart],
            ['AI Planner', Sparkles],
            ['Due Date', CalendarDays],
            ['Appointments', ClipboardList],
            ['Checklists', CheckCircle2],
            ['Notes', NotebookPen],
            ['Readiness', ShieldCheck],
            ['User', User],
          ].map(([label, Icon]) => (
            <button className={active === label ? 'active' : ''} key={label as string} onClick={() => setActive(label as string)}>
              <Icon size={18} />
              {label as string}
            </button>
          ))}
        </nav>
        <button className="theme-button" onClick={toggleTheme}>
          {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {state.theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button className="theme-button" onClick={() => void auth.signOut()}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{active}</h1>
            <p>{progress.trimester === 'unknown' ? 'Add dates to personalize your planning rhythm.' : `Week ${progress.pregnancyWeek}, day ${progress.pregnancyDay} - ${progress.planningStage}`}</p>
          </div>
          <div className="top-actions">
            <button className="chat-toggle" onClick={() => setChatDock('open')}><MessageCircle size={16} /> AI chat</button>
            <BackupControls state={state} setState={setState} />
          </div>
        </header>

        {active === 'Dashboard' && (
          <Dashboard state={state} progress={progress} nextAppointment={nextAppointment} completed={completed} readiness={readiness} setActive={setActive} />
        )}
        {active === 'AI Planner' && <PlannerChat state={state} />}
        {active === 'Due Date' && <DueDatePanel state={state} update={update} progress={progress} />}
        {active === 'Appointments' && <Appointments state={state} update={update} progress={progress} />}
        {active === 'Checklists' && <Checklists state={state} update={update} />}
        {active === 'Notes' && <Notes state={state} update={update} />}
        {active === 'Readiness' && <Readiness state={state} progress={progress} readiness={readiness} />}
        {active === 'User' && <UserPage user={auth.user} setUser={auth.setUser} signOut={auth.signOut} state={state} update={update} />}
      </main>

      <ChatDock state={state} status={chatDock} setStatus={setChatDock} />
    </div>
  );
}

function Dashboard(props: {
  state: PlannerState;
  progress: PregnancyProgress;
  nextAppointment?: Appointment;
  completed: number;
  readiness: number;
  setActive: (active: string) => void;
}) {
  const total = props.state.checklist.length || 1;
  return (
    <section className="dashboard-grid">
      <div className="progress-hero">
        <div>
          <p className="soft-label">Pregnancy progress</p>
          <h2>{props.progress.pregnancyWeek !== undefined ? `Week ${props.progress.pregnancyWeek}` : 'Dates not set'}</h2>
          <p>{props.progress.dueDate ? `Due ${props.progress.dueDate}. Baby is about the size of a ${props.progress.babySize}.` : 'A due date or last period date will unlock weekly guidance.'}</p>
        </div>
        <div className="ring" style={{ '--value': `${Math.min(100, Math.max(0, ((props.progress.pregnancyWeek ?? 0) / 40) * 100))}%` } as React.CSSProperties}>
          <span>{props.progress.daysLeft ?? '--'}</span>
          <small>days left</small>
        </div>
      </div>
      <Metric title="Checklist" value={`${props.completed}/${props.state.checklist.length}`} detail="items complete" percent={(props.completed / total) * 100} />
      <Metric title="Readiness" value={`${props.readiness}%`} detail="rubric covered" percent={props.readiness} />
      <div className="panel smart-card">
        <div className="panel-title">
          <h3>Smart next step</h3>
          <Sparkles size={18} />
        </div>
        <p>{props.progress.trimester === 'third' ? 'Focus on hospital bag, car seat, pediatrician, and support plan.' : 'Keep appointments current and choose one checklist item to finish this week.'}</p>
        <button className="primary" onClick={() => props.setActive('AI Planner')}>Ask Baby Planner</button>
      </div>
      <div className="panel appointment-card">
        <div className="panel-title">
          <h3>Next appointment</h3>
          <CalendarDays size={18} />
        </div>
        {props.nextAppointment ? (
          <p><strong>{props.nextAppointment.title}</strong><br />{props.nextAppointment.date} {props.nextAppointment.time}</p>
        ) : (
          <p>No upcoming appointment saved.</p>
        )}
      </div>
      <div className="panel recent-card">
        <div className="panel-title">
          <h3>Recent notes</h3>
          <NotebookPen size={18} />
        </div>
        <div className="note-list">
          {props.state.notes.slice(-3).map((note) => <p key={note.id}>{note.text}</p>)}
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, detail, percent }: { title: string; value: string; detail: string; percent: number }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <div className="bar"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
    </div>
  );
}

function DueDatePanel({ state, update, progress }: { state: PlannerState; update: (patch: Partial<PlannerState>) => void; progress: PregnancyProgress }) {
  return (
    <section className="two-column">
      <div className="panel">
        <h3>Due Date / Pregnancy Progress</h3>
        <div className="form-grid">
          <Field label="Due date" type="date" value={state.dueDate} onChange={(event) => update({ dueDate: event.target.value })} />
          <Field label="Last period date" type="date" value={state.lastPeriodDate} onChange={(event) => update({ lastPeriodDate: event.target.value })} />
          <Field label="Cycle length" type="number" min={20} max={45} value={state.cycleLength} onChange={(event) => update({ cycleLength: Number(event.target.value) })} />
        </div>
      </div>
      <div className="panel">
        <h3>Current estimate</h3>
        <dl className="summary-list">
          <div><dt>Due date</dt><dd>{progress.dueDate ?? 'Not set'}</dd></div>
          <div><dt>Trimester</dt><dd>{progress.trimester}</dd></div>
          <div><dt>Week</dt><dd>{progress.pregnancyWeek ?? '--'}</dd></div>
          <div><dt>Baby size</dt><dd>{progress.babySize}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function Appointments({ state, update, progress }: { state: PlannerState; update: (patch: Partial<PlannerState>) => void; progress: PregnancyProgress }) {
  const [draft, setDraft] = React.useState({ title: '', date: '', time: '', notes: '' });
  const add = () => {
    if (!draft.title || !draft.date) return;
    update({ appointments: [...state.appointments, { id: crypto.randomUUID(), ...draft, done: false, questions: [] }] });
    setDraft({ title: '', date: '', time: '', notes: '' });
  };
  return (
    <section className="stack">
      <div className="panel">
        <h3>Add appointment</h3>
        <div className="form-grid">
          <Field label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <Field label="Date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
          <Field label="Time" type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
          <Field label="Notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </div>
        <button className="primary" onClick={add}><Plus size={16} /> Add visit</button>
      </div>
      <div className="list">
        {state.appointments.map((appointment) => (
          <article className="row-card" key={appointment.id}>
            <input type="checkbox" checked={appointment.done} onChange={() => update({ appointments: state.appointments.map((item) => item.id === appointment.id ? { ...item, done: !item.done } : item) })} />
            <div>
              <strong>{appointment.title}</strong>
              <span>{appointment.date} {appointment.time} - {progress.trimester} trimester prep</span>
              {appointment.notes && <p>{appointment.notes}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Checklists({ state, update }: { state: PlannerState; update: (patch: Partial<PlannerState>) => void }) {
  const [draft, setDraft] = React.useState({ label: '', category: 'Hospital Bag' as ChecklistCategory });
  const add = () => {
    if (!draft.label) return;
    update({ checklist: [...state.checklist, { id: crypto.randomUUID(), label: draft.label, category: draft.category, done: false }] });
    setDraft({ ...draft, label: '' });
  };
  return (
    <section className="stack">
      <div className="panel inline-form">
        <Field label="New checklist item" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
        <label className="field">
          <span>Category</span>
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ChecklistCategory })}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <button className="primary" onClick={add}><Plus size={16} /> Add item</button>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <div className="panel" key={category}>
            <h3>{category}</h3>
            {state.checklist.filter((item) => item.category === category).map((item) => (
              <label className="check-row" key={item.id}>
                <input type="checkbox" checked={item.done} onChange={() => update({ checklist: state.checklist.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry) })} />
                <span>{item.label}</span>
                {item.priority && <small>{item.priority}</small>}
              </label>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Notes({ state, update }: { state: PlannerState; update: (patch: Partial<PlannerState>) => void }) {
  const [text, setText] = React.useState('');
  const add = () => {
    if (!text.trim()) return;
    const note: PlannerNote = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString(), concernLevel: 'low' };
    update({ notes: [...state.notes, note] });
    setText('');
  };
  return (
    <section className="stack">
      <div className="panel">
        <h3>Notes and concerns</h3>
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Capture questions, symptoms to ask about, supplies to buy, or things on your mind." />
        <button className="primary" onClick={add}><Plus size={16} /> Save note</button>
      </div>
      <div className="note-list">
        {state.notes.map((note) => <p key={note.id}>{note.text}<small>{new Date(note.createdAt).toLocaleDateString()}</small></p>)}
      </div>
    </section>
  );
}

function Readiness({ state, progress, readiness }: { state: PlannerState; progress: PregnancyProgress; readiness: number }) {
  const missing = state.checklist.filter((item) => !item.done && (item.priority === 'high' || item.category === 'Hospital Bag')).slice(0, 6);
  return (
    <section className="two-column">
      <div className="progress-hero compact-hero">
        <div>
          <p className="soft-label">Readiness Review</p>
          <h2>{readiness}% covered</h2>
          <p>{progress.daysLeft !== undefined ? `${progress.daysLeft} days left. ` : ''}Baby Planner checks practical prep, not medical readiness.</p>
        </div>
        <ShieldCheck size={54} />
      </div>
      <div className="panel">
        <h3>High-priority gaps</h3>
        {missing.length ? missing.map((item) => <p className="alert-line" key={item.id}>{item.label}</p>) : <p>Core readiness items look covered in your checklist.</p>}
      </div>
    </section>
  );
}

function UserPage({
  user,
  setUser,
  signOut,
  state,
  update,
}: {
  user: PlannerUser;
  setUser: (user: PlannerUser | null) => void;
  signOut: () => Promise<void>;
  state: PlannerState;
  update: (patch: Partial<PlannerState>) => void;
}) {
  const [profile, setProfile] = React.useState({ name: user.name, email: user.email });
  const [invite, setInvite] = React.useState({ name: '', email: '', relationship: 'husband' as const, canEdit: false });
  const [status, setStatus] = React.useState('');

  const saveProfile = async () => {
    setStatus('');
    const response = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.message ?? 'Could not save profile.');
      return;
    }
    setUser(data.user);
    setStatus('Profile saved.');
  };
  const addInvite = async () => {
    if (!invite.email.trim()) return;
    setStatus('');
    const response = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: invite.name || invite.email.split('@')[0],
        email: invite.email,
        relationship: invite.relationship,
        canView: true,
        canEdit: invite.canEdit,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.message ?? 'Could not send invite.');
      return;
    }
    update({
      invitedUsers: [
        ...state.invitedUsers,
        data.invite,
      ],
    });
    setInvite({ name: '', email: '', relationship: 'husband', canEdit: false });
    setStatus('Invite saved.');
  };

  return (
    <section className="user-grid">
      <div className="profile-card panel">
        <div className="avatar">{user.avatarInitials}</div>
        <div>
          <p className="soft-label">Signed in</p>
          <h2>{user.name}</h2>
          <p>{user.email} - {user.authProvider === 'google' ? 'Google session' : 'Email session'}</p>
        </div>
        <div className="form-grid">
          <Field label="Name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
          <Field label="Email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => void saveProfile()}>Save profile</button>
          <button className="secondary" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
        </div>
        {status && <p className="auth-note">{status}</p>}
      </div>
      <div className="panel">
        <div className="panel-title">
          <h3><UserPlus size={18} /> Invite partner or support person</h3>
        </div>
        <div className="form-grid">
          <Field label="Name" value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Husband, partner, mom..." />
          <Field label="Email" type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="name@example.com" />
          <label className="field">
            <span>Relationship</span>
            <select value={invite.relationship} onChange={(event) => setInvite({ ...invite, relationship: event.target.value as typeof invite.relationship })}>
              <option value="husband">Husband</option>
              <option value="partner">Partner</option>
              <option value="family">Family</option>
              <option value="support">Support</option>
            </select>
          </label>
          <label className="toggle-line">
            <input type="checkbox" checked={invite.canEdit} onChange={(event) => setInvite({ ...invite, canEdit: event.target.checked })} />
            Can edit planner details
          </label>
        </div>
        <button className="primary" onClick={() => void addInvite()}><UserPlus size={16} /> Send invite</button>
        <p className="auth-note">Invites are persisted on the local server. Production email delivery would connect this same flow to an email provider.</p>
      </div>
      <div className="panel user-wide">
        <div className="panel-title">
          <h3><Users size={18} /> Shared access</h3>
        </div>
        <div className="list">
          {state.invitedUsers.map((person) => (
            <article className="share-row" key={person.id}>
              <div className="avatar small">{initials(person.name)}</div>
              <div>
                <strong>{person.name}</strong>
                <span>{person.email} - {person.relationship} - {person.status}</span>
              </div>
              <div className="permission-pills">
                <span>View</span>
                {person.canEdit && <span>Edit</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChatDock({ state, status, setStatus }: { state: PlannerState; status: 'open' | 'minimized' | 'closed'; setStatus: (status: 'open' | 'minimized' | 'closed') => void }) {
  if (status === 'closed') {
    return (
      <button className="floating-chat-button" onClick={() => setStatus('open')}>
        <MessageCircle size={19} />
        Open AI chat
      </button>
    );
  }
  if (status === 'minimized') {
    return (
      <aside className="agent-panel minimized-panel">
        <button className="minimized-chat" onClick={() => setStatus('open')}>
          <Sparkles size={18} />
          Baby Planner AI
          <span>Open</span>
        </button>
      </aside>
    );
  }
  return (
    <aside className="agent-panel">
      <PlannerChat state={state} compact onMinimize={() => setStatus('minimized')} onClose={() => setStatus('closed')} />
    </aside>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>,
  );
}

function RichMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="rich-text">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div className="rich-space" key={index} />;
        if (trimmed.startsWith('### ')) return <h4 key={index}>{renderInlineMarkdown(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## ')) return <h4 key={index}>{renderInlineMarkdown(trimmed.slice(3))}</h4>;
        if (trimmed.startsWith('- ')) return <p className="rich-bullet" key={index}>{renderInlineMarkdown(trimmed.slice(2))}</p>;
        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function PlannerChat({ state, compact = false, onMinimize, onClose }: { state: PlannerState; compact?: boolean; onMinimize?: () => void; onClose?: () => void }) {
  const [input, setInput] = React.useState('What should I prepare this week?');
  const [events, setEvents] = React.useState<StreamEvent[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('baby-planner-chat');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Hi, I’m Baby Planner. Tell me what you’re preparing for, or ask what to focus on next. I’ll keep the plan calm and practical.',
            createdAt: new Date().toISOString(),
          },
        ];
  });
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    localStorage.setItem('baby-planner-chat', JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, events]);

  async function ask(message = input) {
    if (!message.trim() || loading) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    const conversation = [...messages, userMessage].slice(-12);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setLoading(true);
    setEvents([]);
    setInput('');
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, plannerState: state, conversation }),
      });
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream returned.');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const line = chunk.split('\n').find((part) => part.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          setEvents((current) => [...current, event]);
          if (event.type === 'text-delta') {
            setMessages((current) =>
              current.map((item) => (item.id === assistantId ? { ...item, content: item.content + event.delta } : item)),
            );
          }
          if (event.type === 'final' && event.text) {
            setMessages((current) =>
              current.map((item) => (item.id === assistantId && !item.content ? { ...item, content: event.text } : item)),
            );
          }
          if (event.type === 'error') {
            setMessages((current) =>
              current.map((item) => (item.id === assistantId ? { ...item, content: event.message } : item)),
            );
          }
        }
      }
    } catch (error) {
      setEvents((current) => [...current, { type: 'error', message: error instanceof Error ? error.message : 'Stream failed.' }]);
      setMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: error instanceof Error ? error.message : 'Stream failed.' } : item)),
      );
    } finally {
      setLoading(false);
    }
  }

  const prompts = ['What should I prepare this week?', 'What should I ask my doctor?', 'Am I ready for the hospital?', 'Create a simple plan for the next 4 weeks.', 'Make a newborn first-week checklist.'];

  return (
    <section className={compact ? 'chat compact-chat' : 'chat full-chat'}>
      <div className="panel-title">
        <h3><Sparkles size={18} /> Ask Baby Planner</h3>
        <div className="chat-window-actions">
          {loading && <span className="pulse">streaming</span>}
          {onMinimize && <button title="Minimize chat" onClick={onMinimize}><Minimize2 size={16} /></button>}
          {onClose && <button title="Close chat" onClick={onClose}><X size={16} /></button>}
        </div>
      </div>
      <div className="prompt-row">
        {prompts.slice(0, compact ? 3 : prompts.length).map((prompt) => (
          <button key={prompt} onClick={() => { setInput(prompt); void ask(prompt); }}>{prompt}</button>
        ))}
      </div>
      <div className="chat-output chat-thread" ref={scrollRef}>
        {events.filter((event) => event.type === 'tool-progress').slice(-4).map((event, index) => (
          <div className="tool-event" key={`${event.type}-${index}`}><PanelRightOpen size={14} />{'label' in event ? event.label : ''}</div>
        ))}
        {messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <div className="message-avatar">{message.role === 'assistant' ? <Sparkles size={15} /> : 'You'}</div>
            <div className="message-body">
              <RichMessage text={message.content || 'Thinking...'} />
              <small>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>
            </div>
          </article>
        ))}
        {events.filter((event) => event.type === 'error').map((event, index) => (
          <p className="error" key={index}>{'message' in event ? event.message : ''}</p>
        ))}
      </div>
      <div className="composer">
        <input value={input} placeholder="Message Baby Planner..." onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void ask(); }} />
        <button className="primary icon-button" onClick={() => void ask()} disabled={loading}><Send size={17} /></button>
      </div>
    </section>
  );
}

function BackupControls({ state, setState }: { state: PlannerState; setState: React.Dispatch<React.SetStateAction<PlannerState>> }) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baby-planner-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    setState(JSON.parse(await file.text()));
  };
  return (
    <div className="backup">
      <button onClick={exportBackup}><Download size={16} /> Export</button>
      <button onClick={() => fileRef.current?.click()}><Upload size={16} /> Import</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
