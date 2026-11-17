#!/usr/bin/env node
// Stdio ⇄ Streamable HTTP bridge for the hosted Prove It Onchain MCP server.
// It only forwards MCP messages; it holds no keys and never signs anything.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.env.PROVEITONCHAIN_MCP_URL || process.argv[2] || 'https://proveitonchain.com/mcp');
const log = (...a) => process.stderr.write(`[proveitonchain-mcp] ${a.join(' ')}\n`);

const local = new StdioServerTransport();
const remote = new StreamableHTTPClientTransport(url);

local.onmessage = (msg) => {
  remote.send(msg).catch((e) => {
    log('upstream error:', e?.message || e);
    if (msg && msg.id !== undefined && msg.method) {
      local.send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: `Could not reach ${url.href}: ${e?.message || e}` } }).catch(() => {});
    }
  });
};
remote.onmessage = (msg) => { local.send(msg).catch((e) => log('stdout error:', e?.message || e)); };
remote.onerror = (e) => log('upstream:', e?.message || e);
local.onclose = () => { remote.close().catch(() => {}); process.exit(0); };
remote.onclose = () => {};

await remote.start();
await local.start();
log('bridging stdio to', url.href);
