import test from 'node:test';
import assert from 'node:assert/strict';
import { privacyRequestDueAt, validatePrivacyRequest } from './privacy-request-policy.ts';

test('privacy intake accepts named rights and enforces bounded description', () => {
  assert.equal(validatePrivacyRequest({ requestType: 'Portable copy', detail: ' Send my account data. ' }), 'Send my account data.');
  assert.throws(() => validatePrivacyRequest({ requestType: 'Unknown', detail: 'Send my account data.' }));
  assert.throws(() => validatePrivacyRequest({ requestType: 'Deletion', detail: 'short' }));
});

test('privacy response target is 45 calendar days from receipt', () => {
  assert.equal(privacyRequestDueAt(new Date('2026-09-15T12:00:00Z')).toISOString(), '2026-10-30T12:00:00.000Z');
});
