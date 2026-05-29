# Confidential Intents — Partner Integration Guide

This document describes how to integrate the **Confidential Intents API** so
you can build a UI for confidential balances, transfers, and swaps on top of
the NEAR Intents 1Click service.

> Confidential Intents is an extension of the 1Click swap/transfer API. It uses
> the same REST endpoints, but with a `CONFIDENTIAL_INTENTS` account type for
> `deposit`, `recipient`, and `refund`. Balances and transfer amounts for that
> account type are not visible on chain.

---

## 1. Mental model

Every user has two logical accounts on NEAR Intents:

| Account | Visibility | Referenced in API as |
|---|---|---|
| **Main** (aka public) | Standard intents balance, visible on chain | `INTENTS` |
| **Confidential** | Private balances, not visible on chain | `CONFIDENTIAL_INTENTS` |

A confidential operation is a 1Click quote / intent where at least one of
`depositType`, `recipientType`, or `refundType` is `CONFIDENTIAL_INTENTS`:

| Operation | `depositType` | `recipientType` | `refundType` |
|---|---|---|---|
| **Shield** (Main → Confidential) | `INTENTS` | `CONFIDENTIAL_INTENTS` | `CONFIDENTIAL_INTENTS` |
| **Unshield** (Confidential → Main) | `CONFIDENTIAL_INTENTS` | `INTENTS` | `CONFIDENTIAL_INTENTS` |
| **Private transfer** (Confidential → another user's Confidential) | `CONFIDENTIAL_INTENTS` | `CONFIDENTIAL_INTENTS` | `CONFIDENTIAL_INTENTS` |
| **Confidential swap** (token A → token B, both Confidential) | `CONFIDENTIAL_INTENTS` | `CONFIDENTIAL_INTENTS` | `CONFIDENTIAL_INTENTS` |
| **Public swap** (baseline) | `INTENTS` | `INTENTS` | `INTENTS` |

Accounts are addressed by **intentsUserId** — a canonical string derived from
the wallet's address and chain type. Use
`authIdentity.authHandleToIntentsUserId(address, authMethod)` from
`@defuse-protocol/internal-utils`; never construct it yourself.

---

## 2. Prerequisites

### Packages

```jsonc
{
  "@defuse-protocol/one-click-sdk-typescript": "…",   // REST client for 1Click
  "@defuse-protocol/internal-utils":           "…",   // auth identity, signed-data prep, message factory
  "@defuse-protocol/intents-sdk":              "…",   // VersionedNonceBuilder, IntentsSDK
  "@defuse-protocol/contract-types":           "…"    // Intent / MultiPayload types
}
```

Only `@defuse-protocol/one-click-sdk-typescript` talks to the network.
`internal-utils` and `intents-sdk` are helpers for producing the exact message
shape the API expects.

### Environment

Server-side (never expose to the browser):

```
ONE_CLICK_URL=https://<1click-host>
ONE_CLICK_API_KEY=<api-key>
# Optional, if you want to verify JWT access tokens locally:
ONE_CLICK_JWT_PUBLIC_KEY=<JWKS JSON>
ONE_CLICK_JWT_ISSUER=<issuer>
```

Initialize the SDK once per process:

```ts
import { OpenAPI } from "@defuse-protocol/one-click-sdk-typescript"

OpenAPI.BASE    = process.env.ONE_CLICK_URL!
OpenAPI.HEADERS = { "x-api-key": process.env.ONE_CLICK_API_KEY! }
OpenAPI.TOKEN   = async () => (await getValidAccessToken()) ?? ""
```

Confidential endpoints require a **per-user bearer token** (`OpenAPI.TOKEN`)
*in addition* to the `x-api-key` header. Public 1Click endpoints only need
`x-api-key`.

`getValidAccessToken()` is your own function that returns the current user's
access token (or a freshly refreshed one) — see §3.

---

## 3. Authentication

All confidential endpoints are authenticated with a short-lived JWT access
token obtained from `POST /v0/auth/authenticate`. The flow:

1. Build a **verification message** with a versioned nonce fetched from the
   intents contract.
2. Have the user sign it with their wallet.
3. Prepare it as a `MultiPayload` and POST to `/v0/auth/authenticate`.
4. Store the access + refresh tokens somewhere safe (httpOnly cookies for a
   server-rendered app, secure storage otherwise).

### 3.1 Build the verification message

```ts
import { IntentsSDK, VersionedNonceBuilder } from "@defuse-protocol/intents-sdk"
import { messageFactory, type walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"

// One IntentsSDK instance per process. `env` is "production" or "stage".
const intentsSDK = new IntentsSDK({ env: "production" })

export async function createVerificationMessage(opts: {
  signerId: string                 // intentsUserId
  deadlineMs?: number              // default: now + 5 min
  chainType?: string               // auth method, e.g. "tron" needs a special wrapper
}): Promise<walletMessage.WalletMessage> {
  const deadline = opts.deadlineMs ?? Date.now() + 5 * 60_000

  // Use the intent builder to produce a versioned nonce (magic prefix + salt +
  // deadline + random bytes). Hand-rolling the nonce will be rejected.
  const intentPayload = await intentsSDK
    .intentBuilder()
    .setSigner(opts.signerId)
    .setDeadline(new Date(deadline))
    .setNonceRandomBytes(VersionedNonceBuilder.createTimestampedNonceBytes(new Date()))
    .build()

  const nonceBytes = base64.decode(intentPayload.nonce)

  const baseMessage = messageFactory.makeEmptyMessage({
    signerId: opts.signerId,
    deadlineTimestamp: deadline,
    nonce: nonceBytes,
  })

  // Tron wallets require extra JSON wrapping for message-size validation.
  if (opts.chainType === "tron") {
    const tronMessage = JSON.parse(baseMessage.TRON.message)
    return {
      ...baseMessage,
      TRON: {
        ...baseMessage.TRON,
        message: JSON.stringify(
          {
            ...tronMessage,
            message_size_validation:
              "Validates message size compatibility with wallet signing requirements.",
          },
          null,
          2,
        ),
      },
    }
  }

  return baseMessage
}
```

### 3.2 Sign and prepare the signed payload

```ts
import { prepareBroadcastRequest } from "@defuse-protocol/internal-utils"

// `signMessage` is your wallet-agnostic adapter — it takes a WalletMessage and
// returns a WalletSignatureResult after the user signs.
const walletMessage  = await createVerificationMessage({ signerId, chainType })
const signatureResult = await signMessage(walletMessage)

const signedData = prepareBroadcastRequest.prepareSwapSignedData(
  signatureResult,
  { userAddress: address, userChainType: authMethod },
)  // → MultiPayload
```

`authMethod` is one of
`"near" | "evm" | "solana" | "webauthn" | "ton" | "stellar" | "tron"`.

### 3.3 Call `/v0/auth/authenticate`

The SDK's typed clients don't cover these two auth endpoints, so call them
with plain `fetch`:

```ts
const res = await fetch(`${ONE_CLICK_URL}/v0/auth/authenticate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key":    ONE_CLICK_API_KEY,
  },
  body: JSON.stringify({ signedData }),
})
if (!res.ok) throw new Error(`auth ${res.status}: ${await res.text()}`)

const {
  accessToken,      // JWT, short-lived
  refreshToken,     // opaque, long-lived (default ~7 days)
  expiresIn,        // seconds until accessToken expires
  refreshExpiresIn, // seconds until refreshToken expires (optional)
} = await res.json()
```

**Identity check before trust.** Decode the returned JWT and confirm the
`account_id` (or `sub`) claim equals
`authIdentity.authHandleToIntentsUserId(address, authMethod)`. If it doesn't
match, throw the tokens away — they belong to a different wallet.

Reference verifier using `jose`:

```ts
import { createLocalJWKSet, jwtVerify } from "jose"

const jwks = createLocalJWKSet(JSON.parse(ONE_CLICK_JWT_PUBLIC_KEY))

export async function verify1ClickAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      ...(ONE_CLICK_JWT_ISSUER ? { issuer: ONE_CLICK_JWT_ISSUER } : {}),
    })
    const accountId =
      typeof payload.account_id === "string" ? payload.account_id :
      typeof payload.sub        === "string" ? payload.sub        :
      null
    if (!accountId || !payload.exp) return null
    return { account_id: accountId, exp: payload.exp as number }
  } catch {
    return null
  }
}
```

### 3.4 Refresh

```ts
const res = await fetch(`${ONE_CLICK_URL}/v0/auth/refresh`, {
  method:  "POST",
  headers: { "Content-Type": "application/json", "x-api-key": ONE_CLICK_API_KEY },
  body:    JSON.stringify({ refreshToken }),
})
const { accessToken, expiresIn, refreshToken: newRefresh } = await res.json()
```

The response *may* include a new `refreshToken`; if so, replace the stored
one. Otherwise reuse the existing one. Do the same identity check on the new
access token before trusting it.

### 3.5 Session lifecycle

Behaviors worth replicating:

- **401 on any authenticated call** → clear the access token, try a refresh;
  if refresh also fails, prompt re-auth.
- **User disconnects wallet** → clear the active access/refresh for the
  current session, but it's fine to keep a per-wallet refresh token around so
  the same wallet reconnects silently.
- **Different wallet connected** than the one that authenticated → force
  re-auth; never send an access token for wallet A on requests made by wallet
  B.
- **Periodic health check** (every ~30s): call the "am I still authenticated?"
  check and disable confidential mode in the UI if the session died in the
  background.

---

## 4. Operations

Every operation follows the same four-step shape:

```
1. OneClickService.getQuote(...)           → depositAddress
2. OneClickService.generateIntent(...)     → intent payload
3. wallet signs the payload
4. OneClickService.submitIntent(...)
5. poll OneClickService.getExecutionStatus(depositAddress) until terminal
```

The `depositAddress` from the quote is the primary key for the whole
operation. Persist it until you reach a terminal status.

### 4.1 Shield (Main → Confidential)

```ts
import { OneClickService, QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { authIdentity } from "@defuse-protocol/internal-utils"

const intentsUserId = authIdentity.authHandleToIntentsUserId(address, authMethod)

const quote = await OneClickService.getQuote({
  dry:               false,
  swapType:          QuoteRequest.swapType.EXACT_INPUT,
  slippageTolerance: 100,                              // 1% = 100
  originAsset:       asset,                            // defuseAssetId
  destinationAsset:  asset,                            // same token — shield is a move, not a swap
  amount,                                              // smallest units, as string
  deadline:          new Date(Date.now() + 5 * 60_000).toISOString(),
  depositType:       QuoteRequest.depositType.INTENTS,
  recipientType:     QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
  refundTo:          intentsUserId,
  refundType:        QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
  recipient:         intentsUserId,
  quoteWaitingTimeMs: 0,
})
const depositAddress = quote.quote.depositAddress
```

### 4.2 Unshield (Confidential → Main)

Same as shield, swap `depositType` / `recipientType`:

```ts
depositType:   QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
recipientType: QuoteRequest.recipientType.INTENTS,
refundType:    QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
```

### 4.3 Private transfer (Confidential → another user's Confidential)

Same as unshield, with `recipient` set to the *recipient's* `intentsUserId`:

```ts
depositType:   QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
recipientType: QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
refundType:    QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
recipient:     recipientIntentsUserId,
refundTo:      senderIntentsUserId,
```

### 4.4 Confidential swap

Different `originAsset` and `destinationAsset`, all three `*_INTENTS` types
set to `CONFIDENTIAL_INTENTS`:

```ts
const confidentialTypes = {
  depositType:   QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
  recipientType: QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
  refundType:    QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
}
```

### 4.5 Generate + sign + submit the intent

```ts
import {
  OneClickService,
  GenerateSwapTransferIntentRequest,
  IntentStandardEnum,
  SubmitSwapTransferIntentRequest,
} from "@defuse-protocol/one-click-sdk-typescript"
import { prepareBroadcastRequest, type AuthMethod } from "@defuse-protocol/internal-utils"

// Map each auth method to the signing standard the API expects.
export const AUTH_METHOD_TO_STANDARD: Record<AuthMethod, IntentStandardEnum> = {
  near:     IntentStandardEnum.NEP413,
  evm:      IntentStandardEnum.ERC191,
  solana:   IntentStandardEnum.RAW_ED25519,
  webauthn: IntentStandardEnum.WEBAUTHN,
  ton:      IntentStandardEnum.TON_CONNECT,
  tron:     IntentStandardEnum.TIP191,
  stellar:  IntentStandardEnum.SEP53,
}

// 1. Ask the API for the intent payload for this depositAddress.
const { intent } = await OneClickService.generateIntent({
  type:     GenerateSwapTransferIntentRequest.type.SWAP_TRANSFER,
  standard: AUTH_METHOD_TO_STANDARD[authMethod],
  depositAddress,
  signerId: intentsUserId,
})

// 2. Wrap the payload into the wallet-message shape for the user's chain.
//    (See the helper below — it's purely shape-shuffling.)
const walletMessage = wrapPayloadAsWalletMessage(intent)

// 3. Sign.
const signature = await signMessage(walletMessage)

// 4. (Recommended) verify locally that the signing key matches the connected wallet.
//    Prevents a wallet extension from silently signing with a different account.
//    Your wallet adapter should expose such a check; fail fast if the addresses differ.

// 5. Broadcast.
const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
  signature,
  { userAddress: address, userChainType: authMethod },
)
await OneClickService.submitIntent({
  type:       SubmitSwapTransferIntentRequest.type.SWAP_TRANSFER,
  signedData: signedIntent,
})
```

#### `wrapPayloadAsWalletMessage` helper

The `OneClickService.generateIntent` response returns a payload tagged with a
`standard` field (`erc191`, `nep413`, `raw_ed25519`, `sep53`, `webauthn`,
`ton_connect`, `tip191`). Wallets want the message in a per-chain shape. This
helper moves the payload into the right slot and fills the others with empty
placeholders:

```ts
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { MultiPayloadNarrowed } from "@defuse-protocol/one-click-sdk-typescript"
import { messageFactory } from "@defuse-protocol/internal-utils"
import { base64, base64urlnopad } from "@scure/base"

type Nep413Payload = { message: string; recipient: string; nonce: string; callbackUrl?: string }

const placeholderNep413:   walletMessage.NEP413Message      = { message: "", recipient: "", nonce: new Uint8Array(32) }
const placeholderErc191:   walletMessage.ERC191Message      = { message: "" }
const placeholderSolana:   walletMessage.SolanaMessage      = { message: new Uint8Array() }
const placeholderStellar:  walletMessage.StellarMessage     = { message: "" }
const placeholderTron:     walletMessage.TronMessage        = { message: "" }
const placeholderTon:      walletMessage.TonConnectMessage  = { message: { type: "text", text: "" } }
const placeholderWebAuthn: walletMessage.WebAuthnMessage    = {
  challenge: new Uint8Array(),
  payload:   "",
  parsedPayload: { deadline: "", intents: [], signer_id: "", nonce: "", verifying_contract: "" },
}

const str2bytes = (s: string) => new TextEncoder().encode(s)
const b64ToBytes = (s: string) => {
  try { return base64.decode(s) } catch { return base64urlnopad.decode(s) }
}

export function wrapPayloadAsWalletMessage(p: MultiPayloadNarrowed): walletMessage.WalletMessage {
  const empty = {
    ERC191: placeholderErc191, NEP413: placeholderNep413, SOLANA: placeholderSolana,
    STELLAR: placeholderStellar, WEBAUTHN: placeholderWebAuthn,
    TON_CONNECT: placeholderTon, TRON: placeholderTron,
  }
  switch (p.standard) {
    case "erc191":   return { ...empty, ERC191:  { message: p.payload } }
    case "nep413": {
      const n = p.payload as Nep413Payload
      return { ...empty, NEP413: {
        message: n.message, recipient: n.recipient, nonce: b64ToBytes(n.nonce),
        callbackUrl: n.callbackUrl ?? undefined,
      } }
    }
    case "raw_ed25519": return { ...empty, SOLANA:  { message: str2bytes(p.payload) } }
    case "sep53":       return { ...empty, STELLAR: { message: p.payload } }
    case "webauthn":    return { ...empty, WEBAUTHN: {
      challenge:     messageFactory.makeChallenge(str2bytes(p.payload)),
      payload:       p.payload,
      parsedPayload: JSON.parse(p.payload),
    } }
    case "ton_connect": {
      const t = p.payload as unknown
      const msg = typeof t === "object" && t !== null && "text" in t && typeof (t as { text: unknown }).text === "string"
        ? { type: "text" as const, text: (t as { text: string }).text }
        : { type: "text" as const, text: JSON.stringify(t) }
      return { ...empty, TON_CONNECT: { message: msg } }
    }
    case "tip191":      return { ...empty, TRON:    { message: p.payload } }
    default: {
      const _exhaustive: never = p
      throw new Error(`Unsupported standard: ${(p as { standard: string }).standard}`)
    }
  }
}
```

### 4.6 Poll for status

```ts
const { status } = await OneClickService.getExecutionStatus(depositAddress)
//   "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED"
```

Reference polling loop (1s interval, ~2-minute budget):

```ts
async function poll(depositAddress: string) {
  for (let i = 0; i < 120; i++) {
    const r = await OneClickService.getExecutionStatus(depositAddress)
    const status = r.status.toUpperCase()
    if (status === "SUCCESS")                              return "success"
    if (status === "FAILED" || status === "REFUNDED")      return "failed"
    await new Promise(r => setTimeout(r, 1000))
  }
  return "timeout"
}
```

On success, invalidate any cached private balance so the UI re-fetches.

### 4.7 Read private balances

```ts
import { AccountService } from "@defuse-protocol/one-click-sdk-typescript"

const { balances } = await AccountService.getBalances()
// balances: Array<{ tokenId: string; available: string; ... }>
```

Two behaviors worth coding against:

1. **Omit `tokenIds`** to fetch *all* balances. Passing a specific list can
   return empty results for tokens that only exist on the confidential side.
2. The API **omits zero-balance tokens**. If your UI renders a static token
   list, seed the missing entries with `0n` yourself — otherwise a stale
   positive balance will linger after draining.

### 4.8 App fees

Attach app fees via `appFees` on the `QuoteRequest`:

```ts
appFees: [{ recipient: appFeeRecipient, fee: appFeeBps }]
```

If you want a different fee recipient for confidential swaps (e.g. for
accounting separation), pick it based on the mode:

```ts
const appFeeRecipient = isConfidential
  ? CONFIDENTIAL_FEE_RECIPIENT
  : PUBLIC_FEE_RECIPIENT
```

---

## 5. End-to-end example

Minimal happy-path for shield / unshield / private-transfer (a confidential
swap is the same shape, just with a different `destinationAsset`):

```ts
async function runConfidentialOperation(params: {
  mode: "shield" | "unshield" | "transfer" | "swap"
  address: string
  authMethod: AuthMethod
  originAsset: string
  destinationAsset: string         // === originAsset for shield/unshield/transfer
  amount: string                   // smallest units
  recipientIntentsUserId?: string  // required for "transfer"
  signMessage: (m: walletMessage.WalletMessage) => Promise<walletMessage.WalletSignatureResult>
}) {
  const { authMethod, address, mode, originAsset, destinationAsset, amount, signMessage } = params
  const intentsUserId = authIdentity.authHandleToIntentsUserId(address, authMethod)
  const deadline      = new Date(Date.now() + 5 * 60_000).toISOString()

  // Pick the *_INTENTS types for the operation.
  const types =
    mode === "shield"   ? { depositType: "INTENTS",              recipientType: "CONFIDENTIAL_INTENTS" } :
    mode === "unshield" ? { depositType: "CONFIDENTIAL_INTENTS", recipientType: "INTENTS"              } :
                          { depositType: "CONFIDENTIAL_INTENTS", recipientType: "CONFIDENTIAL_INTENTS" }

  const recipient =
    mode === "transfer" && params.recipientIntentsUserId != null
      ? params.recipientIntentsUserId
      : intentsUserId

  const quote = await OneClickService.getQuote({
    dry:               false,
    swapType:          QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100,
    originAsset,
    destinationAsset,
    amount,
    deadline,
    depositType:    QuoteRequest.depositType[types.depositType],
    recipientType:  QuoteRequest.recipientType[types.recipientType],
    refundType:     QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
    refundTo:       intentsUserId,
    recipient,
    quoteWaitingTimeMs: 0,
  })

  const depositAddress = quote.quote.depositAddress
  if (!depositAddress) throw new Error("No deposit address in quote")

  const { intent } = await OneClickService.generateIntent({
    type:     GenerateSwapTransferIntentRequest.type.SWAP_TRANSFER,
    standard: AUTH_METHOD_TO_STANDARD[authMethod],
    depositAddress,
    signerId: intentsUserId,
  })

  const walletMessage = wrapPayloadAsWalletMessage(intent)
  const signature     = await signMessage(walletMessage)

  const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
    signature,
    { userAddress: address, userChainType: authMethod },
  )

  await OneClickService.submitIntent({
    type:       SubmitSwapTransferIntentRequest.type.SWAP_TRANSFER,
    signedData: signedIntent,
  })

  // Poll until terminal.
  for (let i = 0; i < 120; i++) {
    const s = await OneClickService.getExecutionStatus(depositAddress)
    const status = s.status.toUpperCase()
    if (status === "SUCCESS")                          return { ok: true,  depositAddress }
    if (status === "FAILED" || status === "REFUNDED")  return { ok: false, depositAddress, status }
    await new Promise(r => setTimeout(r, 1000))
  }
  return { ok: false, depositAddress, status: "TIMEOUT" as const }
}
```

---

## 6. UI/UX considerations

### 6.1 Route guards

Not every feature of a public-mode app makes sense in confidential mode. For
example, public-network deposit flows assume the user has a public intents
balance. Decide up front which routes are valid while confidential mode is
on, and show a friendly banner on the others (typically: "move funds back to
your Main account first").

### 6.2 State isolation between modes

Treat confidential mode as a hard state boundary. Stale quotes, deposit
addresses, or balances from one context must not bleed into the other.

The simplest implementation is to remount your swap/transfer state whenever
the mode toggles — in React, that's a `key` on the provider:

```tsx
<SwapStateProvider key={isConfidential ? "confidential" : "public"} />
```

Persist the toggle somewhere durable (localStorage, cookie, server session)
so the user's preference survives refreshes.

### 6.3 Analytics and telemetry

**Confidential routes must not leak data to third-party analytics.**
Recommended pattern:

- Keep a list of "sensitive routes" in code — the confidential transfer page,
  any gift/deal flows, anything that shows confidential balances.
- Suppress Google Analytics / Tag Manager / Sentry / Mixpanel / etc. when
  either (a) confidential mode is enabled, or (b) the current route is in the
  sensitive list.
- Third-party loaders run before your app hydrates. If your "mode enabled"
  flag lives in app state, mirror it to localStorage / cookie so the
  suppression check can read it synchronously *before* hydration. Otherwise
  analytics scripts may fire in the hydration gap.
- If you duplicate the route list anywhere (e.g. a regex in a pre-hydration
  script), unit-test that the duplicate matches the source of truth exactly.

### 6.4 Tracking in-flight operations

Users will navigate away while a confidential operation is in flight. The
reference pattern:

- When you submit an intent, register the `depositAddress` + metadata in a
  global in-memory tracker keyed by `` `confidential-${depositAddress}` ``.
- A single background polling loop per tracked operation calls
  `getExecutionStatus` once per second until terminal.
- On success/failure, update any visible activity-dock/toast UI and
  invalidate cached balances.
- Clear all tracked operations when the connected wallet changes.

---

## 7. Common pitfalls

1. **Hand-rolling the auth nonce.** The versioned nonce (magic prefix + salt +
   deadline + random bytes) must come from `IntentsSDK.intentBuilder()`. A
   home-grown nonce will fail verification.
2. **`tokenIds` on `AccountService.getBalances`.** Can return empty results
   for tokens that only exist on the confidential side. Omit the argument to
   get the full list.
3. **Zero balances are omitted from the response.** If you render a static
   token list, fill in missing entries with `0n` so drained tokens don't show
   a stale positive balance.
4. **Quote deadlines are short** (5 minutes by default) and quotes are not
   cached server-side. Don't reuse a stale quote; refetch before submitting.
5. **Identity check after auth and refresh.** Always verify the JWT's
   `account_id` (or `sub`) matches
   `authHandleToIntentsUserId(address, authMethod)`. A leftover token from a
   previous wallet is otherwise undetectable.
6. **Keep `x-api-key` server-side only.** Implement confidential endpoints as
   server actions / an authenticated BFF. The browser should never see the
   API key.
7. **Refresh token rotation.** `/v0/auth/refresh` *may* return a new
   `refreshToken`. If so, replace the old one. Otherwise reuse the existing
   one.
8. **`IntentStandardEnum` must match the auth method.** Signing an `ERC191`
   payload with a NEAR wallet will produce a signature the API rejects. Use
   the `AUTH_METHOD_TO_STANDARD` table.
9. **`depositAddress` is the operation's primary key** for
   `getExecutionStatus`. Persist it until you reach a terminal status, not
   just across the current render.
10. **Don't mix confidential and public state in the same machine.** Remount
    (via React `key=`, or equivalent in your framework) when the mode
    toggles.

---

## 8. Endpoint quick reference

All requests go to `ONE_CLICK_URL` with header `x-api-key: <ONE_CLICK_API_KEY>`.
Confidential operations additionally require `Authorization: Bearer <accessToken>`.

| Purpose | Client | Auth |
|---|---|---|
| Authenticate with signed message | `POST /v0/auth/authenticate` (plain `fetch`) | api-key only |
| Refresh access token | `POST /v0/auth/refresh` (plain `fetch`) | api-key only |
| Get quote (public or confidential) | `OneClickService.getQuote` | api-key (+ bearer for confidential) |
| Generate intent payload | `OneClickService.generateIntent` | api-key + bearer |
| Submit signed intent | `OneClickService.submitIntent` | api-key + bearer |
| Private balances | `AccountService.getBalances` | api-key + bearer |
| Execution status | `OneClickService.getExecutionStatus` | api-key (+ bearer for confidential) |

Prefer the typed SDK client over hand-rolled fetches wherever possible — the
request/response shapes track the server exactly.

---

*Authoritative schema lives in the OpenAPI spec bundled with
`@defuse-protocol/one-click-sdk-typescript`. If something in this document
conflicts with the generated types, trust the types.*
