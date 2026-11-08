import { assert } from '@quentinadam/assert';
import { PrivateKey, PublicKey } from './mod.ts';

const privateKey = PrivateKey.fromBytes(new Uint8Array(32).with(31, 1));

Deno.test('PublicKey.fromBytes derives the address of its private key', () => {
  for (const compressed of [true, false]) {
    const publicKey = PublicKey.fromBytes(privateKey.getPublicKey().toBytes(compressed));
    assert(publicKey.toAddress() === '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf');
    assert(publicKey.toAddress() === privateKey.toAddress());
  }
});
