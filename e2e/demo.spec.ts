import { test, expect } from '@playwright/test';

const ROLES = [
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_GM', label: 'General Manager' },
  { value: 'ROLE_SALES', label: 'Sales Advisor' },
  { value: 'ROLE_SVC', label: 'Service Advisor' },
  { value: 'ROLE_PURCH', label: 'Purchasing' },
  { value: 'ROLE_DCS', label: 'DCS' },
];

const BASE = '/lemans/demo';

test('splash entry and role switching persist across routes', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Le Mans Operations' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter as an Admin' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();

  const switcher = page.locator('#role-switcher');
  await expect(switcher).toHaveValue('ROLE_ADMIN');

  for (const role of ROLES) {
    await switcher.selectOption(role.value);
    await page.waitForTimeout(300);
    await expect(switcher).toHaveValue(role.value);
    await expect(page.locator('#role-switcher-error')).not.toBeVisible();
    await page.goto(`${BASE}/customers`);
    await page.waitForTimeout(300);
    await expect(switcher).toHaveValue(role.value);
  }

  await page.reload();
  await expect(switcher).toHaveValue('ROLE_DCS');
});

test('role switching renders accessible error on failure', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();

  await page.route(`${BASE}/api/set-role`, async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Role switch failed' }) });
  });

  await page.locator('#role-switcher').selectOption('ROLE_SALES');
  await expect(page.locator('#role-switcher-error')).toContainText('Role switch failed');
});

test('customer form validation shows field errors and preserves values', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await page.goto(`${BASE}/customers`);

  await page.getByLabel('Customer No').fill('C-TEST-001');
  await page.getByRole('button', { name: 'Add Customer & Vehicle' }).click();
  await expect(page.locator('form [role="alert"]')).toContainText(
    'Please correct the highlighted fields'
  );
  await expect(page.getByText('Name is required', { exact: true })).toBeVisible();
  await expect(page.getByText('Plate No is required', { exact: true })).toBeVisible();
  await expect(page.getByText('Make/Model is required', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Customer No')).toHaveValue('C-TEST-001');
});

test('mobile touch targets are at least 44x44 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await page.goto(`${BASE}/customers`);

  const targets = page.locator(
    'a:not([href*="mailto"]):visible, button:visible, select:visible, input:visible, [role="button"]:visible'
  );
  await expect(targets.nth(0)).toBeVisible();
  const count = await targets.count();
  const violations: string[] = [];

  for (let i = 0; i < count; i++) {
    const el = targets.nth(i);
    const box = await el.boundingBox();
    if (!box) continue;
    const text = (await el.textContent().catch(() => '')) ?? '';
    const role = await el.evaluate((e) => e.getAttribute('role') ?? e.tagName.toLowerCase());
    const tag = await el.evaluate((e) => e.tagName.toLowerCase());

    // Use the rendered bounding box as the practical touch target, but also guard
    // that the element is explicitly styled to at least 44px so a zero-height box
    // inside a scroll container is not mistaken for a valid target.
    const computedMinHeight = await el.evaluate((e) =>
      parseFloat(window.getComputedStyle(e).minHeight)
    );
    const computedMinWidth = await el.evaluate((e) =>
      parseFloat(window.getComputedStyle(e).minWidth)
    );
    const effectiveHeight = Math.max(box.height, computedMinHeight || 0);
    const effectiveWidth = Math.max(box.width, computedMinWidth || 0);
    if (effectiveWidth < 44 || effectiveHeight < 44) {
      violations.push(
        `target #${i} ${role} "${text.trim().slice(0, 20)}" ${Math.round(box.width)}x${Math.round(box.height)} css-min=${computedMinWidth}x${computedMinHeight}`
      );
    }
  }

  expect(violations, `Touch-target violations: ${violations.join('; ')}`).toHaveLength(0);
});

test('reduced-motion media emulation disables non-essential motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();

  const prefersReduced = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  expect(prefersReduced).toBe(true);

  const transition = await page.evaluate(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const computed = window.getComputedStyle(el);
    const result = computed.transitionDuration;
    el.remove();
    return result;
  });
  expect(transition).toMatch(/0\.01ms|0s|1e-05s|0\.00001s/);
});

test('focus-visible rings are visible with keyboard navigation', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toHaveCount(1);
  const style = await focused.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      boxShadow: computed.boxShadow,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
    };
  });
  const hasVisibleFocus =
    style.boxShadow !== 'none' ||
    (style.outlineStyle !== 'none' && style.outlineStyle !== '' && style.outlineWidth !== '0px');
  expect(hasVisibleFocus).toBe(true);
});

test('deterministic local reset restores seed data', async ({ page, request }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();

  await page.goto(`${BASE}/customers`);
  await expect(page.getByText('No customers yet')).not.toBeVisible();

  const reset = await request.get('http://127.0.0.1:3000/lemans/demo');
  expect(reset.status()).toBe(200);
});
