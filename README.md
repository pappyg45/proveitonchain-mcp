# proveitonchain-mcp

**Give your agent a name on Bitcoin, and check other agents' names for free.**

[![Bitcoin Agent ID: PROVEITBOT](https://proveitonchain.com/badge/PROVEITBOT.svg)](https://proveitonchain.com/agent/PROVEITBOT)

MCP server for **[Prove It Onchain](https://proveitonchain.com)**. Your AI agent can buy its own vanity name on Bitcoin (like `SATOSHI`), delivered to its own address, and attach an **Agent identity**: display name, operator, website, X handle, description, agent type/model and MCP endpoint. It can also prove it made, owns, published, or said something first, as a one-of-one token on Bitcoin, paid and signed by the agent's own wallet.

This package is a tiny stdio bridge to the hosted server at **https://proveitonchain.com/mcp**. If your client supports remote (Streamable HTTP) servers, you don't need this package at all: just add that URL.

- Hosted endpoint: `https://proveitonchain.com/mcp` (Streamable HTTP, stateless, no API key, no account)
- Website: https://proveitonchain.com · Docs: https://proveitonchain.com/docs#mcp

## Non-custodial

The server never holds, sees, or asks for a private key, and it never signs. A name is paid with a normal Bitcoin payment of an exact amount and delivered to the agent's address; editing its Agent identity later needs a message signed by the holder address (BIP-322, or the legacy "sign message" from Unisat, Xverse, Leather, Sparrow, Electrum or Bitcoin Core). `create_proof` returns an **unsigned** PSBT that already contains the service fee as one extra output. Your agent signs it with its own wallet, and `broadcast` checks that it is exactly the transaction that was built (same inputs and outputs, exact fee) before relaying it. You can also broadcast the signed transaction yourself.

## When to use it

| Use when… | Tools | Price |
| --- | --- | --- |
| You are about to trust another agent's claimed identity (it asks you to pay it, or gives you an endpoint or website) | `verify_agent` | Free |
| You or your operator want a persistent, verifiable identity on Bitcoin that other agents and humans can check | `check_name`, `buy_name`, `set_agent_profile` | $21 + network fee |
| You need to timestamp an output, file, or claim so it can't be disputed later | `get_quote`, `create_proof`, `broadcast` | $2 + network fee |
| Someone shows you a proof or token and you want to check it | `verify` | Free |

No API key, no account.

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
| `verify_agent` | Free. Before trusting another agent's claimed identity: exists on Bitcoin, current owner, whether the profile is signed by that owner, profile fields, registration tx/block/date, verdict. Read-only. |
| `check_name` | Is a vanity name available, and its live price ($21 + network fee). Read-only. |
| `buy_name` | Name + your Bitcoin address (+ optional profile) → order id, exact amount (sats/BTC), pay-to address, expiry. |
| `get_name_order` | awaiting_payment → paid → registering → transferring → delivered, with tx ids. Read-only. |
| `cancel_name_order` | Release an unpaid order. |
| `get_agent_profile` | Read the Agent identity on a name. Read-only. |
| `set_agent_profile` | Add or edit the Agent identity, signed by the holder (two calls: get the message, then send the signature). |
| `get_quote` | Current prices: flat service fee + Bitcoin network fee (min 5 sat/vB). Read-only. |
| `create_proof` | Claim + optional file / sha256 / metadata + your bc1q address → record, unsigned PSBT (base64 + hex), fee breakdown, signing steps. |
| `broadcast` | Relay your signed PSBT or raw tx. Checked against the composed tx and exact fee first. |
| `get_proof_status` | awaiting_signature / expired / pending / confirmed. Read-only. |
| `verify` | Any asset on Bitcoin: facts, proof checks, certificate URL, agent identity. Read-only. |

## Verify an agent

Use `verify_agent` (or `GET https://proveitonchain.com/api/v1/agents/<NAME>/verify`) before trusting another agent's claimed name. It is free and read-only. The verdict is one of:

- `verified`: "verified: profile signed by current owner" (the signature is re-checked)
- `profile_unsigned`: the name exists and a profile was attached at purchase, but the owner has not signed it
- `no_profile`: "name exists, no signed profile"
- `not_registered`

Pass the address or profile fields the other agent claimed (for example its `mcp_url`) and `claim_checks` shows which match. Rely on the name only when `verified` and `claim_matches` are both true.

Badge, green only while the profile is signed by the current owner:

```markdown
[![Bitcoin Agent ID: PROVEITBOT](https://proveitonchain.com/badge/PROVEITBOT.svg)](https://proveitonchain.com/agent/PROVEITBOT)
```

## Bitcoin Agent ID

[Bitcoin Agent ID](https://proveitonchain.com/agent-id) is a short, open spec for declaring an agent's name on Bitcoin. Put a `bitcoin_agent_id` object in your A2A agent card (`/.well-known/agent.json`) and your MCP server metadata:

```json
"bitcoin_agent_id": {
  "spec": "https://proveitonchain.com/agent-id",
  "version": "1",
  "name": "PROVEITBOT",
  "verify_url": "https://proveitonchain.com/api/v1/agents/PROVEITBOT/verify",
  "page_url": "https://proveitonchain.com/agent/PROVEITBOT"
}
```

Anyone checks it with `verify_agent`. A verified name proves which Bitcoin address controls the name and signed the profile, and when. It does not prove legal identity, or that an agent or its operator is human or trustworthy. Example: [proveitonchain.com/.well-known/agent.json](https://proveitonchain.com/.well-known/agent.json).

## Name flow

1. `check_name` → available, price.
2. `buy_name` with the name, your address and an optional profile → `order_id`, `amount_sats`, `pay_to`, `expires_at` (30 minutes).
3. Pay exactly `amount_sats` to `pay_to` in one output (the amount includes a 1–999 sat tag that identifies your payment).
4. Poll `get_name_order` until `delivered`. The name is registered on Bitcoin and its ownership transferred to your address. The profile shows at `https://proveitonchain.com/agent/<NAME>` and on Verify while you hold the name.
5. Sign the profile with `set_agent_profile` so `verify_agent` reports it as verified.

## Proof flow

1. `create_proof` → unsigned PSBT that issues the token and includes the service fee output.
2. Sign every input with your wallet (SIGHASH_ALL). Don't change outputs. Finalize.
3. `broadcast` with the `record_id` within 30 minutes.
4. `get_proof_status` / `verify`.

## Options

- `PROVEITONCHAIN_MCP_URL` (or the first argument) overrides the endpoint.

## Fees

Every product is a flat service fee plus the Bitcoin network fee on top (network fee rate is at least 5 sat/vB):

- Vanity name: $21 + network fee
- Proof: $2 + network fee
- Proof of Publication: $2 + network fee
- Ownership Token: $5 + network fee
- Certificate of Provenance (art and collectibles): $5 + network fee
- Verifying an agent or a proof: free

`check_name` and `get_quote` return the live amounts in sats.

## What a proof is

A token or Agent identity **proves a signed claim, not legal ownership**. It shows that the issuer's wallet published a signed, hashed claim at a point in time. It is not legal title, a certificate of authenticity, or proof of legal identity.

## Registry

`server.json` describes the hosted server for the official MCP Registry as `io.github.pappyg45/proveitonchain`.

## License

MIT

Docs: https://proveitonchain.com/docs#mcp · llms.txt: https://proveitonchain.com/llms.txt
