import keccak256 from '@quentinadam/hash/keccak256';
import assert from '@quentinadam/assert';
import ensure from '@quentinadam/ensure';

export default function addressFromBytes(bytes: Uint8Array<ArrayBuffer>): string {
  assert(bytes.length === 20, 'Buffer must be 20 bytes');
  const address = bytes.toHex();
  const hash = keccak256(address).toHex();
  return '0x' + Array.from(address).map((character, i) => {
    return (parseInt(ensure(hash[i]), 16) >= 8) ? character.toUpperCase() : character;
  }).join('');
}
