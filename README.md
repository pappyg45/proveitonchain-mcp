# proveitonchain-mcp

MCP server for **[Prove It Onchain](https://proveitonchain.com)**: let your AI agent prove it made, owns, published, or said something first, as a one-of-one token on Bitcoin, paid and signed by the agent's own wallet.

This package is a tiny stdio bridge to the hosted server at **https://proveitonchain.com/mcp**. If your client supports remote (Streamable HTTP) servers, you don't need this package at all: just add that URL.

- Hosted endpoint: `https://proveitonchain.com/mcp` (Streamable HTTP, stateless, no API key, no account)
- Website: https://proveitonchain.com · Docs: https://proveitonchain.com/docs#mcp

## Non-custodial

The server never holds, sees, or asks for a private key, and it never signs. `create_proof` returns an **unsigned** PSBT that already contains the service fee as one extra output. Your agent signs it with its own wallet, and `broadcast` checks that it is exactly the transaction that was built (same inputs and outputs, exact fee) before relaying it. You can also broadcast the signed transaction yourself.

## Install

Claude Desktop (`claude_desktop_config.json`), or any stdio client:

```json
{
  "mcpServers": {
    "proveitonchain": {
      "command": "npx",
      "args": ["-y", "proveitonchain-mcp"]
    }
  }
}
```

Remote clients (Cursor, Claude connectors, Claude Code):

```json
{ "mcpServers": { "proveitonchain": { "url": "https://proveitonchain.com/mcp" } } }
```

```bash
claude mcp add --transport http proveitonchain https://proveitonchain.com/mcp
```

## Tools

| Tool | What it does |
| --- | --- |
| `get_quote` | Current prices: flat service fee + Bitcoin network fee (min 5 sat/vB). Read-only. |
| `create_proof` | Claim + optional file / sha256 / metadata + your bc1q address → record, unsigned PSBT (base64 + hex), fee breakdown, signing steps. |
| `broadcast` | Relay your signed PSBT or raw tx. Checked against the composed tx and exact fee first. |
| `get_proof_status` | awaiting_signature / expired / pending / confirmed. Read-only. |
| `verify` | Any asset on Bitcoin: facts, proof checks, certificate URL. Read-only. |
| `check_name` | Is a vanity name available? Names are bought at proveitonchain.com/vanity. Read-only. |

## Flow

1. `create_proof` → unsigned PSBT that issues the token and includes the service fee output.
2. Sign every input with your wallet (SIGHASH_ALL). Don't change outputs. Finalize.
3. `broadcast` with the `record_id` within 30 minutes.
4. `get_proof_status` / `verify`.

## Options

- `PROVEITONCHAIN_MCP_URL` (or the first argument) overrides the endpoint.

## Fees

Every product is a flat service fee plus the Bitcoin network fee on top (network fee rate is at least 5 sat/vB):

- Proof: $2 + network fee
- Proof of Publication: $2 + network fee
- Ownership Token: $5 + network fee
- Certificate of Provenance (art and collectibles): $5 + network fee

`get_quote` returns the live amounts in sats.

## What a proof is

A token **proves a signed claim, not legal ownership**. It shows that the issuer's wallet published a signed, hashed claim at a point in time. It is not legal title, a certificate of authenticity, or proof of identity.

## Registry

`server.json` describes the hosted server for the official MCP Registry as `io.github.pappyg45/proveitonchain`.

## License

MIT

Docs: https://proveitonchain.com/docs#mcp · llms.txt: https://proveitonchain.com/llms.txt
