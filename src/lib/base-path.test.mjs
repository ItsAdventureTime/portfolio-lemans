import test from 'node:test';
import assert from 'node:assert/strict';
import { stripBasePath, getBasePath } from './base-path.ts';

test('stripBasePath handles the configured and empty base-path forms', () => {
  if (getBasePath() === '/demo/lemans') {
    assert.equal(stripBasePath('/demo/lemans'), '/');
    assert.equal(stripBasePath('/demo/lemans/'), '/');
    assert.equal(stripBasePath('/demo/lemans/customers'), '/customers');
    return;
  }
  assert.equal(getBasePath(), '');
  assert.equal(stripBasePath('/'), '/');
  assert.equal(stripBasePath('/customers'), '/customers');
});
