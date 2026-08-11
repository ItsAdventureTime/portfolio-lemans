'use server';

import { setDemoEntered } from './demo-entry.server';

export async function enterDemoAction() {
  await setDemoEntered();
}
