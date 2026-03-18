import assert from '@quentinadam/assert';

export default function bytesFromAddress(address: string): Uint8Array<ArrayBuffer> {
  assert(address.length === 42);
  assert(address.startsWith('0x'));
  return Uint8Array.fromHex(address.slice(2));
}
