import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { isSimulatorApiSecretAuthenticated, isSimulatorRequestAuthenticated } from './simulator-auth.ts';

const originalSecret = process.env.PIN2WIN_SIMULATOR_API_SECRET;

beforeEach(() => {
  process.env.PIN2WIN_SIMULATOR_API_SECRET = 'simulator-test-secret';
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.PIN2WIN_SIMULATOR_API_SECRET;
  } else {
    process.env.PIN2WIN_SIMULATOR_API_SECRET = originalSecret;
  }
});

test('accepts the configured simulator bearer secret', async () => {
  const request = new Request('https://pin2wingolf.example/api/simulator/sessions', {
    headers: { Authorization: 'Bearer simulator-test-secret' },
  });

  assert.equal(await isSimulatorRequestAuthenticated(request), true);
  assert.equal(isSimulatorApiSecretAuthenticated(request), true);
});

test('rejects an incorrect simulator credential', async () => {
  const incorrect = new Request('https://pin2wingolf.example/api/simulator/sessions', {
    headers: { Authorization: 'Bearer incorrect-secret' },
  });

  assert.equal(await isSimulatorRequestAuthenticated(incorrect), false);
  assert.equal(isSimulatorApiSecretAuthenticated(incorrect), false);
});

test('hole-in-one ingestion cannot treat an administrator cookie as simulator evidence', () => {
  const cookieOnly = new Request('https://pin2wingolf.example/api/simulator/hole-in-one', {
    headers: { Cookie: 'pin2win_admin_session=example' },
  });
  assert.equal(isSimulatorApiSecretAuthenticated(cookieOnly), false);
});
