import { cookies } from 'next/headers';
import { parseRole, ProjectRole } from './roles';

export type { ProjectRole } from './roles';

const COOKIE_NAME = 'lemans-demo-role';

export async function getDemoRole(): Promise<ProjectRole> {
  const jar = await cookies();
  return parseRole(jar.get(COOKIE_NAME)?.value);
}

export async function setDemoRole(role: ProjectRole) {
  const jar = await cookies();
  const valid = parseRole(role);
  jar.set(COOKIE_NAME, valid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
}

export async function clearDemoRole() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
