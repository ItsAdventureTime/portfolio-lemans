import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('./base-path.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { stripBasePath, getBasePath } = await import(
  `data:text/javascript,${encodeURIComponent(outputText)}`
);

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
