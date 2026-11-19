import { assert } from '@quentinadam/assert';
import * as z from '@quentinadam/zod';
import { Client, ClientError } from './mod.ts';

Deno.test('Client sends requests through the given fetcher, with the given headers', async () => {
  const requests: { url: string; headers: Headers }[] = [];
  const fetcher = {
    fetch: async (url: string, options?: RequestInit) => {
      requests.push({ url, headers: new Headers(options?.headers) });
      return await Promise.resolve(Response.json({ jsonrpc: '2.0', id: 0, result: '0x89' }));
    },
  };
  const client = new Client('https://rpc.example', { fetcher, headers: { Authorization: 'Bearer token' } });
  assert(await client.getChainId() === 137);
  const [request] = requests;
  assert(requests.length === 1 && request !== undefined && request.url === 'https://rpc.example');
  assert(request.headers.get('Authorization') === 'Bearer token');
});

Deno.test('Client gets the code at a checksummed address', async () => {
  const bodies: unknown[] = [];
  const fetcher = {
    fetch: async (_url: string, options?: RequestInit) => {
      bodies.push(JSON.parse(String(options?.body)));
      return await Promise.resolve(Response.json({ jsonrpc: '2.0', id: 0, result: '0x6080' }));
    },
  };
  const client = new Client('https://rpc.example', { fetcher });
  const code = await client.getCode({ address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' });
  assert(code.toHex() === '6080');
  const [body] = bodies;
  assert(
    JSON.stringify(body) === JSON.stringify({
      method: 'eth_getCode',
      params: ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', 'latest'],
      id: 0,
      jsonrpc: '2.0',
    }),
  );
});

Deno.test('Client gets the transaction count at the pending block, or at the given block number', async () => {
  const bodies: unknown[] = [];
  const fetcher = {
    fetch: async (_url: string, options?: RequestInit) => {
      bodies.push(JSON.parse(String(options?.body)));
      return await Promise.resolve(Response.json({ jsonrpc: '2.0', id: 0, result: '0x1a' }));
    },
  };
  const client = new Client('https://rpc.example', { fetcher });
  const address = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
  assert(await client.getTransactionCount(address) === 26);
  assert(await client.getTransactionCount(address, 'latest') === 26);
  assert(await client.getTransactionCount(address, 1000) === 26);
  assert(
    JSON.stringify(bodies.map((body) => z.object({ params: z.unknown() }).parse(body).params)) ===
      JSON.stringify([[address, 'pending'], [address, 'latest'], [address, '0x3e8']]),
  );
});

Deno.test('Client rejects with a ClientError carrying the JSON-RPC error', async () => {
  const fetcher = {
    fetch: async () => {
      return await Promise.resolve(
        Response.json({ jsonrpc: '2.0', id: 0, error: { code: 3, message: 'execution reverted', data: '0x' } }),
      );
    },
  };
  const client = new Client('https://rpc.example', { fetcher });
  const error = await client.getChainId().then(() => undefined, (error: unknown) => error);
  assert(error instanceof ClientError && error.code === 3 && error.data === '0x');
});
