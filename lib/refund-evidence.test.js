import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRefundEvidence, maxRefundEvidenceBytes } from './refund-evidence.ts';

function fakeFile(name, type, bytes) {
  return { name, type, size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}

test('accepts a bounded PNG by content signature and records a hash', async () => {
  const bytes = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,...Array(24).fill(0)]);
  const evidence = await prepareRefundEvidence(fakeFile('receipt.png', 'image/png', bytes));
  assert.equal(evidence.mimeType, 'image/png');
  assert.equal(evidence.sizeBytes, 32);
  assert.match(evidence.sha256, /^[a-f0-9]{64}$/);
});

test('rejects spoofed extensions and truncated JPEGs', async () => {
  const bytes = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,...Array(24).fill(0)]);
  await assert.rejects(prepareRefundEvidence(fakeFile('receipt.pdf', 'application/pdf', bytes)));
  const jpeg = new Uint8Array([0xff,0xd8,0xff,...Array(29).fill(0)]);
  await assert.rejects(prepareRefundEvidence(fakeFile('image.jpg', 'image/jpeg', jpeg)));
});

test('rejects files above the function-safe limit without reading them', async () => {
  let read = false;
  await assert.rejects(prepareRefundEvidence({ name: 'huge.pdf', type: 'application/pdf', size: maxRefundEvidenceBytes + 1, arrayBuffer: async () => { read = true; return new ArrayBuffer(0); } }));
  assert.equal(read, false);
});
