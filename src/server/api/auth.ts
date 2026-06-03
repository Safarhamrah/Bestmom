import type { Router } from 'express';
import { z } from 'zod';
import {
  addInvite,
  clearSessionCookie,
  currentSession,
  readCookie,
  sessionCookie,
  signIn,
  signOut,
  signUp,
  updateProfile,
} from '../authStore';

const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const profileSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
});

const inviteSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  relationship: z.enum(['husband', 'partner', 'family', 'support']),
  canView: z.boolean(),
  canEdit: z.boolean(),
});

function sessionToken(header: string | undefined) {
  return readCookie(header, 'bp_session');
}

export function registerAuthRoutes(router: Router) {
  router.get('/auth/session', (req, res) => {
    const session = currentSession(sessionToken(req.headers.cookie));
    res.json({ authenticated: Boolean(session), user: session?.user ?? null, invites: session?.invites ?? [] });
  });

  router.post('/auth/signup', (req, res) => {
    try {
      const result = signUp(signupSchema.parse(req.body));
      res.setHeader('Set-Cookie', sessionCookie(result.token));
      res.status(201).json({ user: result.user, invites: [] });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Could not create account.' });
    }
  });

  router.post('/auth/signin', (req, res) => {
    try {
      const result = signIn(signinSchema.parse(req.body));
      const session = currentSession(result.token);
      res.setHeader('Set-Cookie', sessionCookie(result.token));
      res.json({ user: result.user, invites: session?.invites ?? [] });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'Could not sign in.' });
    }
  });

  router.post('/auth/signout', (req, res) => {
    signOut(sessionToken(req.headers.cookie));
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.json({ ok: true });
  });

  router.post('/auth/profile', (req, res) => {
    try {
      const user = updateProfile(sessionToken(req.headers.cookie), profileSchema.parse(req.body));
      res.json({ user });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'Could not update profile.' });
    }
  });

  router.post('/invites', (req, res) => {
    try {
      const invite = addInvite(sessionToken(req.headers.cookie), inviteSchema.parse(req.body));
      res.status(201).json({ invite });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'Could not create invite.' });
    }
  });

  router.post('/auth/google', (_req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      res.status(501).json({
        message: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable real Google sign-in.',
      });
      return;
    }
    res.status(501).json({ message: 'Google OAuth credentials are present, but the OAuth callback flow is not implemented yet.' });
  });
}
