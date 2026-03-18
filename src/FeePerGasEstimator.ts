import ensure from '@quentinadam/ensure';
import type Client from './Client.ts';

export default class FeePerGasEstimator {
  readonly #client;
  readonly #blockCount;
  readonly #minimumPriorityFeePerGas;

  constructor({ client, blockCount, minimumPriorityFeePerGas }: {
    client: Client;
    blockCount: number;
    minimumPriorityFeePerGas: bigint;
  }) {
    this.#client = client;
    this.#blockCount = blockCount;
    this.#minimumPriorityFeePerGas = minimumPriorityFeePerGas;
  }

  async estimateFeePerGas(threshold = 0.8): Promise<{ priorityFeePerGas: bigint; baseFeePerGas: bigint }> {
    const priorityFeePerGasPercentiles = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const { baseFeesPerGas, gasUsedRatios, priorityFeesPerGas } = await this.#client.getFeeHistory({
      blockCount: this.#blockCount,
      priorityFeePerGasPercentiles,
    });
    const items: { gasUsedRatio: number; priorityFeePerGas: bigint }[] = [];
    for (let i = 0; i < this.#blockCount; i++) {
      for (let j = 0; j < priorityFeePerGasPercentiles.length; j++) {
        items.push({
          gasUsedRatio: ensure(gasUsedRatios.at(i)),
          priorityFeePerGas: ((priorityFeePerGas) => {
            return priorityFeePerGas > this.#minimumPriorityFeePerGas
              ? priorityFeePerGas
              : this.#minimumPriorityFeePerGas;
          })(ensure(ensure(priorityFeesPerGas.at(i)).at(j))),
        });
      }
    }
    items.sort((a, b) => Number(b.priorityFeePerGas - a.priorityFeePerGas));
    let cumulativeGasUsedRatio = items.length;
    const cumulativeItems = items.map((item) => {
      const cumulativeGroup = { ...item, cumulativeGasUsedRatio };
      cumulativeGasUsedRatio = cumulativeGasUsedRatio - item.gasUsedRatio;
      return cumulativeGroup;
    });
    cumulativeItems.reverse();
    const priorityFeePerGas = cumulativeItems.find((cumulativeGroup) => {
      return cumulativeGroup.cumulativeGasUsedRatio > threshold * items.length;
    })?.priorityFeePerGas ?? this.#minimumPriorityFeePerGas;
    const baseFeePerGas = ensure(baseFeesPerGas.at(this.#blockCount));
    return { priorityFeePerGas, baseFeePerGas };
  }
}
