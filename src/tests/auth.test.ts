import { describe, expect, it } from 'vitest';
import { addInvite, currentSession, sessionCookie, signIn, signUp } from '../server/authStore';

describe('local auth store', () => {
  it('creates a hashed-password user, session, and invite', () => {
    const email = `parent-${Date.now()}@example.com`;
    const created = signUp({ name: 'Parent User', email, password: 'strong-password' });
    expect(created.user.email).toBe(email);
    expect(sessionCookie(created.token)).toContain('HttpOnly');

    const signedIn = signIn({ email, password: 'strong-password' });
    const session = currentSession(signedIn.token);
    expect(session?.user.email).toBe(email);

    const invite = addInvite(signedIn.token, {
      name: 'Husband',
      email: `husband-${Date.now()}@example.com`,
      relationship: 'husband',
      canView: true,
      canEdit: false,
    });
    expect(invite.status).toBe('pending');
  });
});
