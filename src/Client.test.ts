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
