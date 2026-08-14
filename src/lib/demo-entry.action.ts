'use server';

import { redirect } from 'next/navigation';
import { setDemoEntered } from './demo-entry.server';
import { getBasePath } from './base-path';

export async function enterDemoAction() {
  await setDemoEntered();
  redirect(getBasePath() || '/');
}
