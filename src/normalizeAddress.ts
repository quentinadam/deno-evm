import { addressFromBytes } from './addressFromBytes.ts';
import { bytesFromAddress } from './bytesFromAddress.ts';

export function normalizeAddress(address: string): string {
  return addressFromBytes(bytesFromAddress(address));
}
