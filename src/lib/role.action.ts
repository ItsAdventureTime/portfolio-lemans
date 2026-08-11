'use server';

import { setDemoRole, ProjectRole } from './actor';

export async function setRoleAction(role: ProjectRole) {
  await setDemoRole(role);
}
