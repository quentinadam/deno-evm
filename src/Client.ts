import * as z from '@quentinadam/zod';
import { Client as BaseClient, ClientHelper } from '@quentinadam/evm-base';
import addressFromBytes from './addressFromBytes.ts';
import bytesFromAddress from './bytesFromAddress.ts';

export default class Client extends BaseClient {
  readonly #helper;

  constructor(url: string) {
    const helper = new ClientHelper({
      addressFromBytes,
      bytesFromAddress,
      serializeHash: (hash) => hash,
      deserializeHash: (hash) => hash,
    });
    super(url, helper);
    this.#helper = helper;
  }

  async getFeeHistory({ blockCount, priorityFeePerGasPercentiles }: {
    blockCount: number;
    priorityFeePerGasPercentiles?: number[];
  }): Promise<
    { oldestBlock: number; baseFeesPerGas: bigint[]; gasUsedRatios: number[]; priorityFeesPerGas: bigint[][] }
  > {
    const response = await this.request({
      method: 'eth_feeHistory',
      params: [`0x${blockCount.toString(16)}`, 'latest', priorityFeePerGasPercentiles ?? []],
    });
    return z.object({
      oldestBlock: this.#helper.HexNumberSchema,
      baseFeePerGas: z.array(this.#helper.HexBigIntSchema),
      gasUsedRatio: z.array(z.number()),
      reward: z.array(z.array(this.#helper.HexBigIntSchema)),
    }).transform(({ baseFeePerGas, gasUsedRatio, reward, ...rest }) => ({
      baseFeesPerGas: baseFeePerGas,
      gasUsedRatios: gasUsedRatio,
      priorityFeesPerGas: reward,
      ...rest,
    })).parse(response);
  }

  async sendRawTransaction(bytes: Uint8Array): Promise<string> {
    const result = await this.request({ method: 'eth_sendRawTransaction', params: ['0x' + bytes.toHex()] });
    return this.#helper.HashSchema.parse(result);
  }

  async getTransactionCount(address: string): Promise<number> {
    const result = await this.request({ method: 'eth_getTransactionCount', params: [address, 'pending'] });
    return this.#helper.HexNumberSchema.parse(result);
  }
}
