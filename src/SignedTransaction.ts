import { concat } from '@quentinadam/uint8array-extension';
import * as rlp from '@quentinadam/rlp';
import keccak256 from '@quentinadam/hash/keccak256';
import { createInspectableDataWrapper, createInspectableScaledBigIntWrapper } from '@quentinadam/evm-base';
import bytesFromAddress from './bytesFromAddress.ts';
import type { InspectFn } from './inspect.ts';

export default class SignedTransaction {
  readonly chainId: number;
  readonly nonce: number;
  readonly priorityFeePerGas: bigint;
  readonly maxFeePerGas: bigint;
  readonly gasLimit: number;
  readonly to?: string;
  readonly value: bigint;
  readonly data: Uint8Array<ArrayBuffer>;
  readonly v: number;
  readonly r: bigint;
  readonly s: bigint;

  constructor({ chainId, nonce, priorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, v, r, s }: {
    chainId: number;
    nonce: number;
    priorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: number;
    to?: string;
    value?: bigint;
    data?: Uint8Array<ArrayBuffer>;
    v: number;
    r: bigint;
    s: bigint;
  }) {
    this.chainId = chainId;
    this.nonce = nonce;
    this.priorityFeePerGas = priorityFeePerGas;
    this.maxFeePerGas = maxFeePerGas;
    this.gasLimit = gasLimit;
    this.to = to;
    this.value = value ?? 0n;
    this.data = data ?? new Uint8Array(0);
    this.v = v;
    this.r = r;
    this.s = s;
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
        this.v,
        this.r,
        this.s,
      ]),
    ]);
  }

  hash(): string {
    return '0x' + keccak256(this.serialize()).toHex();
  }

  [Symbol.for('Deno.customInspect')](inspect: InspectFn, options: unknown): string {
    return this.#customInspect(inspect, options);
  }

  [Symbol.for('nodejs.util.inspect.custom')](_depth: number, options: unknown, inspect: InspectFn): string {
    return this.#customInspect(inspect, options);
  }

  #customInspect(inspect: InspectFn, options: unknown): string {
    return inspect(
      new (class SignedTransaction {
        readonly chainId;
        readonly nonce;
        readonly priorityFeePerGas;
        readonly maxFeePerGas;
        readonly gasLimit;
        readonly to?;
        readonly value;
        readonly data;
        readonly v;
        readonly r;
        readonly s;

        constructor({
          chainId,
          nonce,
          priorityFeePerGas,
          maxFeePerGas,
          gasLimit,
          to,
          value,
          data,
          v,
          r,
          s,
        }: {
          chainId: number;
          nonce: number;
          priorityFeePerGas: bigint;
          maxFeePerGas: bigint;
          gasLimit: number;
          to?: string;
          value: bigint;
          data: Uint8Array<ArrayBuffer>;
          v: number;
          r: bigint;
          s: bigint;
        }) {
          this.chainId = chainId;
          this.nonce = nonce;
          this.priorityFeePerGas = createInspectableScaledBigIntWrapper(priorityFeePerGas, 9);
          this.maxFeePerGas = createInspectableScaledBigIntWrapper(maxFeePerGas, 9);
          this.gasLimit = gasLimit;
          this.to = to;
          this.value = createInspectableScaledBigIntWrapper(value, 18);
          this.data = createInspectableDataWrapper(data);
          this.v = v;
          this.r = `0x${r.toString(16)}`;
          this.s = `0x${s.toString(16)}`;
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
        v: this.v,
        r: this.r,
        s: this.s,
      }),
      options,
    );
  }
}
