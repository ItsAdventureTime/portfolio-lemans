import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { headers } from 'next/headers';
import { db } from './db';
import { ensurePermission, ProjectRole } from './roles';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  appName: 'Le Mans Operations',
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'ROLE_SALES',
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requirePermission(action: keyof typeof import('./roles').PERMISSIONS) {
  const session = await requireSession();
  ensurePermission(session.user.role as ProjectRole, action);
  return session;
}
