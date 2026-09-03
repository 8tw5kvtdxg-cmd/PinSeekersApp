import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { isSimulatorRequestAuthenticated } from './simulator-auth.ts';

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
});

test('rejects an incorrect simulator credential', async () => {
  const incorrect = new Request('https://pin2wingolf.example/api/simulator/sessions', {
    headers: { Authorization: 'Bearer incorrect-secret' },
  });

  assert.equal(await isSimulatorRequestAuthenticated(incorrect), false);
});
