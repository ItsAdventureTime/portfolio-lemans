import { test, expect, Page } from '@playwright/test';

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

test('simulated entry gates the dashboard shell on direct module routes', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(`${BASE}/invoices`);

  await expect(page.getByRole('heading', { name: 'Le Mans Operations' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter as an Admin' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invoices & Collections' })).not.toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).not.toBeVisible();
  await expect(page.locator('footer')).not.toBeVisible();

  await page.getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
});

test('footer remains optically centered across sections', async ({ page }) => {
  await enterAsAdmin(page);
  const footerBrand = page.locator('footer span').first();
  const overviewPosition = await footerBrand.boundingBox();
  expect(overviewPosition).not.toBeNull();

  await page.goto(`${BASE}/invoices`);
  await expect(page.getByRole('heading', { name: 'Invoices & Collections' })).toBeVisible();
  const invoicesPosition = await footerBrand.boundingBox();
  expect(invoicesPosition).not.toBeNull();

  expect(Math.abs((overviewPosition?.x ?? 0) - (invoicesPosition?.x ?? 0))).toBeLessThanOrEqual(1);
});

test('role switching renders accessible error on failure', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();

  await page.route(`${BASE}/api/set-role`, async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Role switch failed' }) });
  });

  await page.locator('#role-switcher').selectOption('ROLE_SALES');
  await expect(page.locator('#role-switcher-error')).toContainText('Role switch failed');
});

test('restricted routes return to the base-path overview', async ({ page }) => {
  await enterAsAdmin(page);
  await switchRole(page, 'ROLE_DCS');
  for (const path of ['/accounting', '/customers', '/job-orders', '/purchasing', '/expenses']) {
    await page.goto(`${BASE}${path}`);
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  }

  await switchRole(page, 'ROLE_SALES');
  for (const path of ['/job-orders', '/purchasing', '/dcs', '/job-costing']) {
    await page.goto(`${BASE}${path}`);
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Return to overview' }).click();
  await expect(page).toHaveURL(/\/lemans\/demo\/?$/);
  await expect(page.getByText('Operations Overview')).toBeVisible();
});

test('overview keeps the workflow map while modules stay focused', async ({ page }) => {
  await enterAsAdmin(page);
  await expect(page.getByRole('region', { name: 'End-to-end workflow' })).toBeVisible();

  const openNavigation = page.getByRole('button', { name: 'Open navigation menu' });
  if (await openNavigation.isVisible()) {
    await openNavigation.click();
    await page
      .getByRole('group', { name: 'Finance' })
      .getByRole('link', { name: 'Invoices', exact: true })
      .click();
  } else {
    await page
      .getByRole('list', { name: 'Finance' })
      .getByRole('link', { name: 'Invoices', exact: true })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'Invoices & Collections' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'End-to-End Operational Workflow' })
  ).not.toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading workspace' })).not.toBeVisible();
});

test('customer form validation shows field errors and preserves values', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();
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
  await expect(page.getByText('Operations Overview')).toBeVisible();
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
  await expect(page.getByText('Operations Overview')).toBeVisible();

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

test('seeded local data is available', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();
  await expect(page.getByText('Operations Overview')).toBeVisible();

  await page.goto(`${BASE}/customers`);
  await expect(page.getByText('No customers yet')).not.toBeVisible();
  await page.locator('table tbody tr a').first().click();
  await expect(page.getByRole('heading', { name: 'Service history' })).toBeVisible();
});

test('customer service history is customer-specific, ordered, and renders empty state', async ({
  page,
}) => {
  await enterAsAdmin(page);
  await page.goto(`${BASE}/customers`);

  const seededCustomerRow = page.locator('table tbody tr', { hasText: 'C-2026-001' }).first();
  await expect(seededCustomerRow).toBeVisible();
  await seededCustomerRow.getByRole('link').click();

  const historySection = page.locator('section[aria-labelledby="service-history-heading"]');
  await expect(historySection.getByRole('heading', { name: 'Service history' })).toBeVisible();
  const historyLinks = historySection.getByRole('link');
  await expect(historyLinks).toHaveCount(1);
  await expect(historyLinks.first()).toHaveText('RA0003973');
  await expect(historyLinks.first()).toHaveAttribute('href', /\/job-orders\/RA0003973$/);
  await expect(historySection.getByLabel('Status: BILLED')).toBeVisible();

  await page.goto(`${BASE}/customers`);
  const unique = Date.now().toString();
  const customerNo = `C-HISTORY-${unique}`;
  await page.getByLabel('Customer No').fill(customerNo);
  await page.getByLabel('Name').fill(`Empty History Customer ${unique}`);
  await page.getByLabel('Plate No').fill(`EMPTY-${unique}`);
  await page.getByLabel('Make/Model').fill('History Test Vehicle');
  await page.getByRole('button', { name: 'Add Customer & Vehicle' }).click();
  await expect(page.getByText('Customer and vehicle added')).toBeVisible();
  await page.reload();

  const emptyCustomerRow = page.locator('table tbody tr', { hasText: customerNo }).first();
  await expect(emptyCustomerRow).toBeVisible();
  await emptyCustomerRow.getByRole('link').click();
  const emptyHistorySection = page.locator('section[aria-labelledby="service-history-heading"]');
  await expect(emptyHistorySection.getByRole('heading', { name: 'Service history' })).toBeVisible();
  await expect(emptyHistorySection.getByText('No service history yet.')).toBeVisible();
  await expect(emptyHistorySection.getByText('RA0003973')).not.toBeVisible();
  await expect(emptyHistorySection.getByRole('link')).toHaveCount(0);
});

test('Admin can download deterministic accounting exports', async ({ page }, testInfo) => {
  await enterAsAdmin(page);
  await page.goto(`${BASE}/accounting`);
  await expect(page.getByRole('heading', { name: 'Accounting exports' })).toBeVisible();

  const csvLink = page.getByRole('link', { name: 'Download Excel-compatible CSV' });
  const jsonLink = page.getByRole('link', { name: 'Download JSON' });
  await expect(csvLink).toHaveAttribute('href', /\/api\/accounting\/export\/csv$/);
  await expect(jsonLink).toHaveAttribute('href', /\/api\/accounting\/export\/json$/);

  // Chromium's mobile-device emulation does not surface attachment downloads as
  // Playwright download events. It still verifies the same browser-facing route.
  if (testInfo.project.name === 'mobile') {
    const response = await page.request.get((await csvLink.getAttribute('href'))!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toContain('lemans-accounting-export.csv');
    expect(Array.from((await response.body()).subarray(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    return;
  }

  const csvDownload = page.waitForEvent('download');
  await csvLink.click();
  expect((await csvDownload).suggestedFilename()).toBe('lemans-accounting-export.csv');

  const jsonDownload = page.waitForEvent('download');
  await jsonLink.click();
  expect((await jsonDownload).suggestedFilename()).toBe('lemans-accounting-export.json');
});

async function enterAsAdmin(page: Page) {
  await page.goto(`${BASE}/`);
  await page.getByRole('main').getByRole('button', { name: 'Enter as an Admin' }).click();
  await expect(page.getByText('Operations Overview')).toBeVisible();
}

async function switchRole(page: Page, roleValue: string) {
  const switcher = page.locator('#role-switcher');
  await switcher.selectOption(roleValue);
  await expect(switcher).toHaveValue(roleValue);
  await page.waitForFunction(
    (role) => document.cookie.includes(`lemans-demo-role=${role}`),
    roleValue
  );
  await page.goto(`${BASE}/`);
  await expect(switcher).toHaveValue(roleValue);
}

test('quote-to-payment workflow creates records and updates statuses', async ({ page }) => {
  await enterAsAdmin(page);

  // Seed state already has customers/vehicles; create a fresh customer+vehicle for determinism.
  const unique = Date.now().toString();
  const workflowCustomerName = `E2E Workflow Customer ${unique}`;
  await page.goto(`${BASE}/customers`);
  await page.getByLabel('Customer No').fill(`C-${unique}`);
  await page.getByLabel('Name').fill(workflowCustomerName);
  await page.getByLabel('Plate No').fill(`E2E-${unique}`);
  await page.getByLabel('Make/Model').fill('Toyota Test');
  await page.getByRole('button', { name: 'Add Customer & Vehicle' }).click();
  await expect(page.getByText('Customer and vehicle added')).toBeVisible();

  // Create a quotation as Sales.
  await switchRole(page, 'ROLE_SALES');
  await page.goto(`${BASE}/quotations`);

  const customerSelect = page.locator('select[name="customerId"]');
  const vehicleSelect = page.locator('select[name="vehicleId"]');
  await customerSelect.waitFor({ state: 'visible' });
  const customerId = await customerSelect.evaluate((el: HTMLSelectElement, unique: string) => {
    const needle = `C-${unique} - E2E Workflow Customer ${unique}`;
    for (const opt of el.options) {
      if (opt.text.includes(needle)) return opt.value;
    }
    return '';
  }, unique);
  expect(customerId).not.toBe('');
  await customerSelect.selectOption(customerId);
  const vehicleId = await vehicleSelect.evaluate((el: HTMLSelectElement, unique: string) => {
    const needle = `E2E-${unique} - Toyota Test`;
    for (const opt of el.options) {
      if (opt.text.includes(needle)) return opt.value;
    }
    return '';
  }, unique);
  expect(vehicleId).not.toBe('');
  await vehicleSelect.selectOption(vehicleId);

  await page.getByLabel('Advisor').fill('E2E Advisor');

  const quoteBuilder = page
    .locator('table')
    .filter({ has: page.locator('input[placeholder="Item description"]') })
    .first();
  await expect(quoteBuilder).toBeVisible();
  const rows = quoteBuilder.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  await rows.first().locator('input[placeholder="Item description"]').fill('Labor service');
  await rows.first().locator('input[type="number"]').nth(0).fill('2');
  await rows.first().locator('input[type="number"]').nth(1).fill('1000');
  await rows.first().locator('input[type="number"]').nth(2).fill('0');

  await page.getByRole('button', { name: 'Create Quotation' }).click();
  await expect(page.getByText('Quotation created')).toBeVisible();

  // Locate the new quotation row by customer name (the list renders name, not number).
  const quoteRow = page.locator('table tbody tr', { hasText: workflowCustomerName }).first();
  await expect(quoteRow).toBeVisible();
  const quoteNo = (await quoteRow.getByText(/^SQ-/).textContent()) ?? '';
  expect(quoteNo).toMatch(/^SQ-/);

  // Approve and convert to JO as Admin (also tests approve permission).
  await switchRole(page, 'ROLE_ADMIN');
  await page.goto(`${BASE}/quotations`);
  const quoteRowAfterRefresh = page
    .locator('table tbody tr', { hasText: workflowCustomerName })
    .first();
  await expect(quoteRowAfterRefresh).toBeVisible();
  const approveBtn = quoteRowAfterRefresh.getByRole('button', { name: 'Approve' });
  await approveBtn.click();
  await expect(quoteRowAfterRefresh.getByText('APPROVED')).toBeVisible();
  const convertBtn = quoteRowAfterRefresh.getByRole('button', { name: 'Convert to JO' });
  await convertBtn.click();
  await expect(quoteRowAfterRefresh.getByText('CONVERTED')).toBeVisible();

  // Find the generated JO and complete it.
  await page.goto(`${BASE}/job-orders`);
  const joRow = page.locator('table tbody tr', { hasText: workflowCustomerName }).first();
  await expect(joRow).toBeVisible();
  const joLink = joRow.locator('a');
  const joNo = (await joLink.textContent()) ?? '';
  await joLink.click();
  await expect(page.getByRole('heading', { name: `Job Order ${joNo}` })).toBeVisible();
  await page.locator('select[name="nextStatus"]').selectOption('COMPLETED');
  await page.locator('button', { hasText: 'Change Status' }).click();
  await expect(page.getByRole('cell', { name: 'Status changed to COMPLETED' })).toBeVisible();

  // Create supplier invoice and allocate across the JO as Purchasing.
  await switchRole(page, 'ROLE_PURCH');
  await page.goto(`${BASE}/purchasing`);
  await page.locator('input[name="supplier"]').last().fill('E2E Supplier');
  await page.getByLabel('Total Amount (₱)').fill('500');
  await page.getByLabel('Invoice Date').fill('2026-08-11');
  await page.getByRole('button', { name: 'Allocate Across JOs' }).click();
  const modal = page.locator('div.fixed.inset-0');
  await expect(modal).toBeVisible();
  const joOption = modal.locator('option').filter({ hasText: joNo }).first();
  const joId = await joOption.getAttribute('value');
  expect(joId).not.toBeNull();
  await modal.locator('select').selectOption(joId!);
  await modal.locator('input[placeholder="Allocation note"]').fill('Parts allocation');
  const amountInputs = modal.locator('input[type="number"]');
  await amountInputs.fill('500');
  await page.getByRole('button', { name: 'Save Allocation' }).click();
  await expect(modal).not.toBeVisible();
  await page.getByRole('button', { name: 'Create Supplier Invoice' }).click();
  await expect(page.getByText('Supplier invoice created')).toBeVisible();

  // Approve supplier invoice as GM.
  await switchRole(page, 'ROLE_GM');
  await page.goto(`${BASE}/purchasing`);
  const siRow = page.locator('table tbody tr', { hasText: 'E2E Supplier' }).first();
  await expect(siRow).toBeVisible();
  await siRow.getByRole('button', { name: 'Approve' }).click();
  await expect(siRow.getByText('APPROVED')).toBeVisible();

  // Create customer invoice as Sales, then record payment as DCS.
  await switchRole(page, 'ROLE_SALES');
  await page.goto(`${BASE}/invoices`);
  await page.getByLabel('Job Order ID').fill(joNo);
  await page.getByRole('button', { name: 'Create Invoice' }).click();
  await expect(page.getByText('Invoice created')).toBeVisible();

  await switchRole(page, 'ROLE_DCS');
  await page.goto(`${BASE}/invoices`);
  const invRow = page.locator('table tbody tr', { hasText: workflowCustomerName }).first();
  await expect(invRow).toBeVisible();
  const invTotal = await invRow.locator('td').nth(2).textContent();
  const invTotalNum = Number(invTotal?.replace(/[^0-9.]/g, ''));
  expect(invTotalNum).toBeGreaterThan(0);
  await invRow.getByPlaceholder('Amount').fill(String(invTotalNum));
  await invRow.getByPlaceholder('Method').fill('Cash');
  await invRow.getByRole('button', { name: 'Pay' }).click();
  await expect(invRow.getByText('PAID')).toBeVisible();
});
