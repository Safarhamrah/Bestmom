import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { InvitedUser, PlannerUser } from '../lib/types';

type StoredUser = PlannerUser & {
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};

type StoredSession = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type AuthDb = {
  users: StoredUser[];
  sessions: StoredSession[];
  invites: Record<string, InvitedUser[]>;
};

const dbPath = join(process.cwd(), 'work-auth', 'auth-db.json');
const sessionDays = 14;

function emptyDb(): AuthDb {
  return { users: [], sessions: [], invites: {} };
}

function readDb(): AuthDb {
  try {
    return JSON.parse(readFileSync(dbPath, 'utf8')) as AuthDb;
  } catch {
    return emptyDb();
  }
}

function writeDb(db: AuthDb) {
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function publicUser(user: StoredUser): PlannerUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider,
    role: user.role,
    avatarInitials: user.avatarInitials,
  };
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BP'
  );
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120_000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function createSession(db: AuthDb, userId: string) {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
  db.sessions = db.sessions.filter((session) => new Date(session.expiresAt) > now);
  db.sessions.push({ token, userId, createdAt: now.toISOString(), expiresAt: expires.toISOString() });
  return token;
}

export function sessionCookie(token: string) {
  return `bp_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionDays * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return 'bp_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
}

export function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function signUp(input: { name: string; email: string; password: string }) {
  const db = readDb();
  const email = input.email.trim().toLowerCase();
  if (db.users.some((user) => user.email === email)) {
    throw new Error('An account already exists for this email.');
  }
  const { salt, hash } = hashPassword(input.password);
  const user: StoredUser = {
    id: randomBytes(16).toString('hex'),
    name: input.name.trim() || email.split('@')[0],
    email,
    authProvider: 'email',
    role: 'parent',
    avatarInitials: initials(input.name || email),
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  db.invites[user.id] = db.invites[user.id] ?? [];
  const token = createSession(db, user.id);
  writeDb(db);
  return { user: publicUser(user), token };
}

export function signIn(input: { email: string; password: string }) {
  const db = readDb();
  const email = input.email.trim().toLowerCase();
  const user = db.users.find((entry) => entry.email === email);
  if (!user || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
    throw new Error('Email or password is incorrect.');
  }
  const token = createSession(db, user.id);
  writeDb(db);
  return { user: publicUser(user), token };
}

export function currentSession(token?: string) {
  if (!token) return null;
  const db = readDb();
  const now = new Date();
  const session = db.sessions.find((entry) => entry.token === token && new Date(entry.expiresAt) > now);
  if (!session) return null;
  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) return null;
  return { user: publicUser(user), invites: db.invites[user.id] ?? [] };
}

export function signOut(token?: string) {
  if (!token) return;
  const db = readDb();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  writeDb(db);
}

export function updateProfile(token: string | undefined, input: { name: string; email: string }) {
  const db = readDb();
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) throw new Error('Not signed in.');
  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) throw new Error('Not signed in.');
  const email = input.email.trim().toLowerCase();
  const taken = db.users.some((entry) => entry.email === email && entry.id !== user.id);
  if (taken) throw new Error('Another account already uses this email.');
  user.name = input.name.trim() || user.name;
  user.email = email || user.email;
  user.avatarInitials = initials(user.name);
  writeDb(db);
  return publicUser(user);
}

export function addInvite(token: string | undefined, invite: Omit<InvitedUser, 'id' | 'status' | 'invitedAt'>) {
  const db = readDb();
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) throw new Error('Not signed in.');
  const invited: InvitedUser = {
    ...invite,
    id: randomBytes(16).toString('hex'),
    status: 'pending',
    invitedAt: new Date().toISOString(),
  };
  db.invites[session.userId] = [...(db.invites[session.userId] ?? []), invited];
  writeDb(db);
  return invited;
}
