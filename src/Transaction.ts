import keccak256 from '@quentinadam/hash/keccak256';
import { concat } from '@quentinadam/uint8array-extension';
import * as rlp from '@quentinadam/rlp';
import createScaledBigIntWrapper from './createScaledBigIntWrapper.ts';
import { createInspectableDataWrapper } from '@quentinadam/evm-base';
import bytesFromAddress from './bytesFromAddress.ts';
import SignedTransaction from './SignedTransaction.ts';
import type PrivateKey from './PrivateKey.ts';
import type { InspectFn } from './inspect.ts';

export default class Transaction {
  readonly chainId: number;
  readonly nonce: number;
  readonly gasLimit: number;
  readonly to?: string;
  readonly value: bigint;
  readonly data: Uint8Array<ArrayBuffer>;
  readonly priorityFeePerGas: bigint;
  readonly maxFeePerGas: bigint;

  constructor({ chainId, nonce, priorityFeePerGas, maxFeePerGas, gasLimit, to, value, data }: {
    chainId: number;
    nonce: number;
    priorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: number;
    to?: string;
    value?: bigint;
    data?: Uint8Array<ArrayBuffer>;
  }) {
    this.chainId = chainId;
    this.nonce = nonce;
    this.priorityFeePerGas = priorityFeePerGas;
    this.maxFeePerGas = maxFeePerGas;
    this.gasLimit = gasLimit;
    this.to = to;
    this.value = value ?? 0n;
    this.data = data ?? new Uint8Array(0);
  }

  serialize(): Uint8Array<ArrayBuffer> {
    return concat([
      new Uint8Array([0x02]),
      rlp.encode([
        this.chainId,
        this.nonce,
        this.priorityFeePerGas,
        this.maxFeePerGas,
        this.gasLimit,
        this.to !== undefined ? bytesFromAddress(this.to) : new Uint8Array(0),
        this.value,
        this.data,
        [],
      ]),
    ]);
  }

  sign(privateKey: PrivateKey): SignedTransaction {
    const { r, s, recovery: v } = privateKey.sign(keccak256(this.serialize()));
    return new SignedTransaction({ ...this, v, r, s });
  }

  [Symbol.for('Deno.customInspect')](inspect: InspectFn, options: unknown): string {
    return this.#customInspect(inspect, options);
  }

  [Symbol.for('nodejs.util.inspect.custom')](_depth: number, options: unknown, inspect: InspectFn): string {
    return this.#customInspect(inspect, options);
  }

  #customInspect(inspect: InspectFn, options: unknown): string {
    return inspect(
      new (class Transaction {
        readonly chainId;
        readonly nonce;
        readonly priorityFeePerGas;
        readonly maxFeePerGas;
        readonly gasLimit;
        readonly to?;
        readonly value;
        readonly data;

        constructor({
          chainId,
          nonce,
          priorityFeePerGas,
          maxFeePerGas,
          gasLimit,
          to,
          value,
          data,
        }: {
          chainId: number;
          nonce: number;
          priorityFeePerGas: bigint;
          maxFeePerGas: bigint;
          gasLimit: number;
          to?: string;
          value: bigint;
          data: Uint8Array<ArrayBuffer>;
        }) {
          this.chainId = chainId;
          this.nonce = nonce;
          this.priorityFeePerGas = createScaledBigIntWrapper(priorityFeePerGas, 9);
          this.maxFeePerGas = createScaledBigIntWrapper(maxFeePerGas, 9);
          this.gasLimit = gasLimit;
          this.to = to;
          this.value = createScaledBigIntWrapper(value, 18);
          this.data = createInspectableDataWrapper(data);
        }
      })({
        chainId: this.chainId,
        nonce: this.nonce,
        priorityFeePerGas: this.priorityFeePerGas,
        maxFeePerGas: this.maxFeePerGas,
        gasLimit: this.gasLimit,
        to: this.to,
        value: this.value,
        data: this.data,
      }),
      options,
    );
  }
}
