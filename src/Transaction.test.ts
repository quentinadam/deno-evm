import { assert } from '@quentinadam/assert';
import { PrivateKey, type Signer, Transaction } from './mod.ts';

Deno.test('Transaction.sign with an async signer matches signing with the private key', async () => {
  const privateKey = PrivateKey.fromBytes(new Uint8Array(32).fill(1));
  const signer: Signer = {
    sign: async (digest) => await Promise.resolve(privateKey.sign(digest)),
  };
  const transaction = new Transaction({
    chainId: 137,
    nonce: 7,
    priorityFeePerGas: 30_000_000_000n,
    maxFeePerGas: 100_000_000_000n,
    gasLimit: 65_000,
    to: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    data: Uint8Array.fromHex('a9059cbb' + '00'.repeat(31) + '01' + '00'.repeat(31) + '02'),
  });
  const expected = await transaction.sign(privateKey);
  const actual = await transaction.sign(signer);
  assert(actual.serialize().toHex() === expected.serialize().toHex());
  assert(actual.hash() === expected.hash());
});
