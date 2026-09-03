import test from 'node:test';
import assert from 'node:assert/strict';

import { squareOrderLooksPaid } from './square.ts';

test('accepts only a completed Square order for the expected amount', () => {
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'COMPLETED', total_money: { amount: 2000 } } },
      2000,
    ),
    true,
  );
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'OPEN', total_money: { amount: 2000 }, tenders: [{}] } },
      2000,
    ),
    false,
  );
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'COMPLETED', total_money: { amount: 1000 } } },
      2000,
    ),
    false,
  );
  assert.equal(
    squareOrderLooksPaid({ status: 'COMPLETED' }, 2000),
    false,
  );
});
