import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, redactPII, truncate, normalizeQuestion } from '../utils/text.js';
import { extractJson } from '../utils/json.js';
import { getPagination } from '../utils/pagination.js';

test('cleanText collapses whitespace and blank lines', () => {
  assert.equal(cleanText('a   b\r\n\r\n\r\n\r\nc \u0000'), 'a b\n\nc');
});

test('redactPII hides email, phone and links but keeps date ranges', () => {
  const out = redactPII('mail me@x.com call +91 98765 43210 see https://github.com/me worked 2019 - 2023');
  assert.ok(out.includes('[email]') && out.includes('[phone]') && out.includes('[link]'));
  assert.ok(out.includes('2019 - 2023'));
});

test('truncate and normalizeQuestion', () => {
  assert.equal(truncate('abcdef', 3), 'abc');
  assert.equal(normalizeQuestion('What is  SQL?!'), 'what is sql');
});

test('extractJson handles fences and surrounding prose', () => {
  assert.deepEqual(extractJson('Sure!\n```json\n{"a":1}\n```\nDone'), { a: 1 });
  assert.throws(() => extractJson('no json here'));
});

test('getPagination clamps values', () => {
  assert.deepEqual(getPagination({ page: '-3', limit: '999' }, 20, 50), { page: 1, limit: 50, skip: 0 });
  assert.equal(getPagination({ page: '3', limit: '10' }).skip, 20);
});
