# proveitonchain-mcp

**Give your agent a name on Bitcoin, check other agents' names for free, and token-gate access with TOKENLOCK.**

[![Bitcoin Agent ID: PROVEITBOT](https://proveitonchain.com/badge/PROVEITBOT.svg)](https://proveitonchain.com/agent/PROVEITBOT)

MCP server for **[Prove It Onchain](https://proveitonchain.com)**. Your AI agent can buy its own vanity name on Bitcoin (like `SATOSHI`), delivered to its own address, and attach an **Agent identity**: display name, operator, website, X handle, description, agent type/model and MCP endpoint. It can also prove it made, owns, published, or said something first, as a one-of-one token on Bitcoin, paid and signed by the agent's own wallet.

Two products, one server:

1. **Names and proofs on Bitcoin**: vanity names with a signed agent profile, one-of-one proofs, free identity and proof checks.
2. **[TOKENLOCK](https://proveitonchain.com/tokenlock)**, *Zero-trust access for the token era*: token-gate a site, API or members area so only holders of a Bitcoin token or name get in, or sign in to a gated site with your agent's own Bitcoin name.

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
| You need to timestamp an output, file, or claim so it can't be disputed later | `get_quote`, `create_proof`, `broadcast` | $1 + network fee |
| Someone shows you a proof or token and you want to check it | `verify` | Free |
| You need live proof that someone controls the wallet holding a name right now | `create_challenge`, `verify_challenge` | Free |
| You want only holders of your Bitcoin token or name to get into your API, site or members area | `tokenlock_info` | TOKENLOCK free plan; paid plans in BTC |
| You need to know whether an address holds a token right now | `check_token_access` | Free |
| You want to sign in to a TOKENLOCK-gated site with your own Bitcoin name or token | `start_token_signin`, `finish_token_signin` | Free |
| You're not sure which tool you need | `products` | Free |

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
| `create_challenge` | Free. Single-use message for the holder of a name to sign (10 minutes). |
| `verify_challenge` | Free. Checks that signature against the address holding the name right now. |
| `products` | Free. Both products and which tools belong to each. Read-only. |
| `tokenlock_info` | Free. TOKENLOCK: what it is, plans and prices, install snippets (npm, Express, Cloudflare, PHP), how agents use it, links. Read-only. |
| `check_token_access` | Free. Does a Bitcoin address hold a token or name right now (owner or balance)? Read-only, no signature. |
| `start_token_signin` | Free. Start a "Sign in with your Token" for a TOKENLOCK site (its `pk_…` site key + origin) or a general pass → message to sign. |
| `finish_token_signin` | Free. Send your wallet's signature → a short-lived pass the gated site checks. |

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

## TOKENLOCK: zero-trust access for the token era

[TOKENLOCK](https://proveitonchain.com/tokenlock) is a self-serve token gate. Your content stays on your own server. Visitors, people or agents, click **Sign in with your Token** and sign a one-time message in their wallet (nothing is paid or sent); Prove It Onchain does the token check and issues a short-lived pass that your server checks with your secret key.

**For agents, two ways:**

1. **Gate your own API, endpoints or members area** so only holders of your Bitcoin token or name get in. Create a site in the [dashboard](https://proveitonchain.com/tokenlock/dashboard) (pick the tokens that unlock it; you get a `pk_…` publishable key and an `sk_…` secret key), then check every pass server-side:

   ```js
   import { verifyPass } from '@proveitonchain/tokenlock';
   const v = await verifyPass(pass, { secretKey: process.env.TOKENLOCK_SECRET_KEY });
   if (!v.valid) return res.status(401).end();
   ```

2. **Sign in to gated sites with your own Bitcoin name.** Buy a name with `buy_name`, sign its profile with `set_agent_profile` (so others can `verify_agent` you), then `check_token_access` → `start_token_signin` (site key + origin) → sign the message with your own wallet → `finish_token_signin` → pass. Hand the pass to the site (sites using the npm package or Cloudflare template take it at `POST /api/tokenlock/session`). Your agent needs to be able to sign a Bitcoin message (BIP-322 or legacy sign-message) for the address that holds the name; this server never signs for you.

**Integrations:** [npm `@proveitonchain/tokenlock`](https://www.npmjs.com/package/@proveitonchain/tokenlock) (Next.js middleware, Express middleware, React button, any Node server), a [Cloudflare Worker template](https://github.com/pappyg45/proveitonchain-tokenlock/tree/main/examples/cloudflare-worker), and a [PHP drop-in](https://proveitonchain.com/tokenlock/tokenlock-php.zip) for shared hosting:

```php
<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/tokenlock/tokenlock.php';
tokenlock_require();
?>
```

**Plans** (paid in BTC): Free (1 site, 100 sign-ins a month) · Pro $99/month or $990/year (3 sites, 1,000 sign-ins) · Business $299/month (10 sites, 3,000 sign-ins, webhooks) · Enterprise custom. Extra sign-ins about $10 per 1,000; going over never breaks your site.

Docs: https://proveitonchain.com/docs#tokenlock · Live demo: https://proveitonchain.com/vault

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
- Proof: $1 + network fee
- Proof of Publication: $1 + network fee
- Ownership Token: $1 + network fee
- Certificate of Provenance (art and collectibles): $1 + network fee
- Verifying an agent or a proof, challenges, token checks and token sign-ins: free
- TOKENLOCK: free plan, paid plans in BTC (see above)

`check_name` and `get_quote` return the live amounts in sats.

## What a proof is

A token or Agent identity **proves a signed claim, not legal ownership**. It shows that the issuer's wallet published a signed, hashed claim at a point in time. It is not legal title, a certificate of authenticity, or proof of legal identity.

## Registry

`server.json` describes the hosted server for the official MCP Registry as `io.github.pappyg45/proveitonchain`.

## License

MIT

Docs: https://proveitonchain.com/docs#mcp · llms.txt: https://proveitonchain.com/llms.txt
