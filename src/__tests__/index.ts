// Central test runner for Phase 3 unit / integration tests.
// Run with: npm test

import { runJobOrderTests } from './job-order.test';
import { runRbacTests } from './rbac.test';
import { runPurchasingTests } from './purchasing.test';
import { runBillingTests } from './billing.test';
import { runDcsTests } from './dcs.test';
import { runCreationFormTests } from './creation-forms.test';
import { runDashboardTests } from './dashboard.test';

const tests = [
  runJobOrderTests,
  runRbacTests,
  runPurchasingTests,
  runBillingTests,
  runDcsTests,
  runCreationFormTests,
  runDashboardTests,
];

let failed = 0;
async function runAll() {
  for (const test of tests) {
    try {
      await test();
    } catch (err) {
      failed += 1;
      console.error(`✗ Test suite failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

runAll().then(() => {
  if (failed > 0) {
    console.error(`\n${failed} test suite(s) failed.`);
    process.exit(1);
  }
  console.log('\n✓ All test suites passed.');
});
