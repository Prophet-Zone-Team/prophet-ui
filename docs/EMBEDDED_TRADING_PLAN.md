# Embedded User Trading Plan

Last updated: 2026-05-14 00:42 CST

## Product Direction

World Cup Prediction Terminal is moving to embedded real user trading.

The trading product must let eligible users place Polymarket orders with:

- their own account;
- their own signer;
- their own deposit wallet or funder;
- their own funds;
- their own user-specific CLOB credentials;
- explicit review and confirmation for every order.

The platform must not place user orders with a shared server wallet, deployment private key, pooled funds, or platform-owned balance.

## Current State

- `/bid` is a Trade Ticket with a single user-owned wallet/session/readiness/signing/submit flow.
- Legacy `/api/bid/orders` is tombstoned: GET returns disabled status and POST returns `410`.
- The server-wallet order client and deployment private-key submit path have been removed from the app.
- The new `/api/trading/*` endpoints support session creation, Polymarket Bridge deposit-address generation, Polymarket geoblock checks, user L1 auth CLOB credential derivation, deposit-wallet approval batches, CLOB balance/allowance sync, order-specific readiness checks, signed user order submission, open-order reads, and order cancellation.
- Session creation now takes only the connected wallet, derives the corresponding Polymarket deposit wallet, checks deployment, and submits a relayer `WALLET-CREATE` request only when relayer auth can legally submit for that user: either the configured `RELAYER_API_KEY_ADDRESS` matches the connected wallet or app-managed Builder API credentials are configured.
- `/bid` collapses CLOB credential derivation, deposit address generation, approval batch submission, and balance sync into one visible `Prepare account` action.
- `/bid` also includes a deposit panel that sends Polygon USDC from the connected wallet to the generated Polymarket Bridge deposit address through a normal wallet-confirmed ERC-20 transfer, then refreshes account readiness.
- Readiness accepts the current ticket token, side, cost, and size, then checks user balance and allowance against that order intent.
- Submit re-validates the signed order payload before CLOB post: final confirmation, signature type 3, deployed deposit wallet maker/signer match, zero taker limit-order shape, token ID, funding requirement, and current balance/allowance.
- CLOB order submission now matches the official client request shape by including the user's CLOB API key as `owner`.
- `.env.example` no longer documents platform private keys, server CLOB credentials, or shared funder addresses for consumer order submission.
- The current implementation uses an in-memory session MVP; production still needs eligible-wallet validation, durable login/session, secure credential storage policy, positions, order persistence, and audit logging.
- Market data, prices, token IDs, tick sizes, and neg-risk metadata are already available from the Polymarket read-only provider when the market provider returns them.

## Hard Requirements

1. A user must be authenticated or wallet-connected before any real order action is enabled.
2. A user order must be signed by the user's signer or by a user-authorized session signer.
3. User CLOB credentials must be user-specific. They may be derived per session or encrypted if stored.
4. A user order must use the user's own deposit wallet / funder and funds.
5. The app must check eligibility/geographic restrictions before enabling trading.
6. The app must check market status, stale prices, balance, and allowance before submission.
7. The app must show order side, outcome, limit price, size, estimated cost or proceeds, and potential outcome before final confirmation.
8. The app must support submitted order status, error handling, and cancellation.
9. The app must never show market signals as investment advice, betting advice, certain return, or recommended trades.

## External References

- Polymarket CLOB Authentication:
  [https://docs.polymarket.com/api-reference/authentication](https://docs.polymarket.com/api-reference/authentication)
- Polymarket L2 Methods:
  [https://docs.polymarket.com/trading/clients/l2](https://docs.polymarket.com/trading/clients/l2)
- Polymarket Deposit Wallets:
  [https://docs.polymarket.com/trading/deposit-wallets](https://docs.polymarket.com/trading/deposit-wallets)
- Polymarket Geoblock API:
  [https://docs.polymarket.com/api-reference/geoblock](https://docs.polymarket.com/api-reference/geoblock)

## Architecture Target

```text
User browser
  -> connect/login with user wallet or Polymarket-compatible account
  -> create or recover user session
  -> fetch eligibility, deposit wallet, balances, allowances
  -> prepare account, generate a deposit address, and deposit funds with wallet confirmation
  -> build order preview from live market metadata
  -> user signs or authorizes order action

Application server
  -> validates session and eligibility
  -> never uses platform wallet for user orders
  -> derives or retrieves encrypted user-specific CLOB credentials
  -> submits signed/user-authorized order to Polymarket CLOB
  -> stores only safe order metadata and audit events

Polymarket
  -> validates CLOB credentials and signer/funder relationship
  -> accepts, rejects, fills, or cancels orders
```

## Data Model Additions

Proposed domain types:

```ts
type TradingEligibilityStatus =
  | "unknown"
  | "eligible"
  | "blocked_region"
  | "unsupported_account"
  | "needs_wallet"
  | "error";

interface TradingUserSession {
  userId: string;
  walletAddress: string;
  funderAddress?: string;
  signatureType?: number;
  eligibilityStatus: TradingEligibilityStatus;
  createdAt: string;
  expiresAt?: string;
}

interface UserTradingCredentialStatus {
  hasClobCredentials: boolean;
  derivedAt?: string;
  storage: "session" | "encrypted_server" | "none";
}

interface UserBalanceSnapshot {
  walletAddress: string;
  funderAddress?: string;
  usdcAvailable: number;
  usdcAllowance: number;
  positions: UserPosition[];
  updatedAt: string;
}

interface UserOrderPreview {
  marketId: string;
  tokenId: string;
  teamId: string;
  outcome: "yes" | "no";
  side: "buy" | "sell";
  orderType: "GTC" | "FOK" | "FAK";
  limitPrice: number;
  size: number;
  estimatedCost: number;
  estimatedProceeds?: number;
  potentialOutcome: number;
  tickSize: string;
  negRisk?: boolean;
  stale: boolean;
  warnings: string[];
}

interface UserOrderRecord {
  id: string;
  userId: string;
  clobOrderId?: string;
  status: "previewed" | "submitted" | "open" | "filled" | "partially_filled" | "cancelled" | "rejected" | "error";
  preview: UserOrderPreview;
  submittedAt?: string;
  updatedAt: string;
  error?: string;
}
```

## Implementation Plan

### Phase 0: Safety Refactor

Goal: prevent the existing server-wallet path from being confused with consumer trading.

Status: completed for public UI and route shape.

Tasks:

- Remove the current server order client from consumer code. Completed.
- Remove platform private key / shared CLOB credential examples from `.env.example`. Completed.
- Add endpoint naming that makes shared-wallet order submission non-consumer. Completed by tombstoning `/api/bid/orders` and using `/api/trading/*`.
- Remove mock/developer bid modes from `/bid`. Completed.
- Add tests that assert consumer order routes cannot use deployment private keys.

Exit criteria:

- No public UI can submit with deployment-level private keys.
- The app can still show read-only market/order previews.

### Phase 1: User Login and Wallet Connection

Goal: establish who the user is and which signer/funder can be used.

Status: MVP started with injected wallet session.

Tasks:

- Choose wallet/auth stack compatible with Next.js and Polygon/Polymarket signing.
- Add connect/login UI and session state. MVP completed with injected wallet provider and in-memory server session.
- Store only minimal user identity metadata.
- Add a server session validation layer.
- Determine whether Polymarket account/deposit wallet discovery is direct API, wallet-derived, or user-provided.

Open decisions:

- Wallet stack: RainbowKit/Wagmi, Privy, Dynamic, Web3Auth, or custom viem flow.
- Whether the product requires email/social login in addition to wallet.
- Whether session signer support is needed for better UX.

Exit criteria:

- A user can connect/login.
- The app can show connected wallet address, session state, and disconnected state.
- No trading action is enabled yet.

### Phase 2: Eligibility and Account Readiness

Goal: only enable trading for users who can legally and technically trade.

Status: readiness scaffold and Polymarket geoblock check implemented; eligible-wallet validation pending.

Tasks:

- Integrate Polymarket geoblock/eligibility check. Implemented through `GET /api/trading/eligibility`, session creation, readiness, submit, and cancel guards.
- Add account readiness state:
  - connected wallet;
  - supported signature type;
  - deposit wallet/funder derived and deployed;
  - CLOB credentials available or derivable;
  - USDC balance readable;
  - allowance readable.
- Add user-facing blocked, unsupported, and setup-required states.
- Remove manual funder entry from the public UI and derive the deposit wallet from the connected EOA. Implemented.

Exit criteria:

- The trading panel can explain why a user can or cannot trade.
- A blocked or incomplete user cannot proceed to order submission.

### Phase 3: User-Specific CLOB Credentials

Goal: create authenticated Polymarket requests for the user, not for the platform.

Status: MVP implemented with user L1 auth and session-only credentials.

Tasks:

- Implement L1/L2 auth flow for the user's signer. MVP completed for L1 auth challenge and CLOB credential derivation.
- Derive or create user-specific CLOB API credentials. MVP completed.
- Decide storage:
  - derive on each session;
  - keep in memory only;
  - encrypted server-side storage with rotation.
- Add redaction for all credential logs/errors.
- Add audit events for credential creation, use, and revocation.

Exit criteria:

- The server can make authenticated CLOB calls for the connected user without deployment-level CLOB credentials.
- Secrets are never logged or committed.

### Phase 4: Balances, Allowances, and Positions

Goal: make the order ticket honest before submit.

Status: order-specific balance/allowance reads, sufficiency checks, deposit-wallet approval batch submission, and CLOB balance sync implemented; positions pending.

Tasks:

- Read user's USDC balance and allowance. Implemented.
- Read selected token balance and allowance for sell orders. Implemented.
- Read user's open positions for selected token IDs.
- Add approval/allowance flow if required. Implemented for deposit-wallet approval batch signing, relayer submission, and CLOB balance sync.
- Add insufficient balance and insufficient allowance states. Implemented for readiness and submit guards.
- Add stale market metadata and closed-market checks. Partially implemented through market accepting-orders and real-token checks.

Exit criteria:

- The order preview knows whether the user can afford or sell the requested order.
- Submit remains disabled until all readiness checks pass.

### Phase 5: Order Preview and User-Signed Submit

Goal: submit real orders only after explicit user review.

Status: user-owned signed order flow implemented; requires production validation with eligible wallet.

Tasks:

- Build a consumer trading ticket from the current `/bid` calculations. Completed for current UI.
- Require final confirmation that names market, outcome, side, limit price, size, and estimated cost. Partially completed through signed payload and final confirmation text.
- Submit through a user-owned CLOB client/session. Endpoint implemented with signed-order ownership and funding guards; production validation pending.
- Store safe order metadata.
- Show success, pending, rejected, and error states.

Exit criteria:

- An eligible connected user can submit a real order using their own funds.
- The app displays the Polymarket response without implying advice or guaranteed outcomes.

### Phase 6: Order Management

Goal: make trading usable after submission.

Status: open-order read and cancel endpoint scaffold implemented; positions and durable order records pending.

Tasks:

- List open orders. MVP implemented through `/api/trading/orders/open`.
- Cancel orders. MVP implemented through `/api/trading/orders/cancel`.
- Show filled/partial/rejected states.
- Show positions and simple P/L context if reliable.
- Add refresh and stale-state indicators.

Exit criteria:

- Users can understand and manage their own open orders and positions from the app.

### Phase 7: Production Hardening

Goal: reduce operational and product risk before broad release.

Tasks:

- Add rate limits to trading endpoints.
- Add structured audit logs without secrets.
- Add monitoring for order submit/cancel errors.
- Add end-to-end tests against a safe environment where possible.
- Add legal/compliance copy review.
- Rotate any previously exposed secrets and ensure production has no platform wallet submit path enabled.

Exit criteria:

- Trading can be shipped behind an explicit feature flag to a limited audience.

## UI Plan

Replace legacy "Bid Console" with "Trade Ticket":

- Logged out:
  show connect/login prompt and read-only market preview.
- Connected but not eligible:
  show reason and keep trading disabled.
- Connected but not ready:
  show setup checklist: funder/deposit wallet, credentials, balance, allowance.
- Ready:
  show order ticket with explicit review.
- Submitted:
  show order status and management actions.

Team detail pages should link into the trade ticket with selected team/outcome, but must not use pressure language.

## Immediate Next Tasks

1. Configure production Builder API credentials or equivalent app-managed relayer auth so first-time users can have deposit wallets deployed and approvals submitted without handling relayer details.
2. Validate the current injected-wallet MVP with an eligible Polymarket deposit-wallet account using signature type 3 and a tiny limit order.
3. Validate the wallet-initiated Polygon USDC deposit panel against a real eligible account and confirm Bridge settlement plus CLOB balance sync timing.
4. Add durable order records, submitted-order status refresh, and positions.
5. Verify geoblock behavior in production; local smoke tests have shown both blocked and eligible responses depending on egress region.
6. Add tests proving `/bid` and `/api/trading/*` never use deployment private keys or platform CLOB credentials.
7. Choose production auth/wallet provider beyond injected wallet if needed.
8. Decide whether user CLOB credentials remain session-only or move to encrypted server-side storage.
