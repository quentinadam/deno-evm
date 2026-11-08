import { assert } from '@quentinadam/assert';
import { Client } from './mod.ts';

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
