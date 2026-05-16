# Trading Production Regression

Last updated: 2026-05-16

This checklist is for validating real user-owned Polymarket trading after a production deploy. It is intentionally narrow: verify that eligible users can act with their own wallet/account/funds, and that ineligible users cannot.

## Automated Smoke

Run after every deploy:

```bash
npm run smoke:trading:prod
```

The smoke script checks:

- `/bid` returns `200`.
- `/api/trading/orders/history` returns `401` without a trading session.
- `/api/trading/positions` returns `401` without a trading session.
- `/api/trading/config` can read Builder configuration.
- Remote D1 contains `user_trading_orders` and `user_trading_audit_events`.

Use a non-production target if needed:

```bash
TRADING_SMOKE_BASE_URL=http://localhost:3000 TRADING_SMOKE_SKIP_D1=1 npm run smoke:trading:prod
```

## Real Wallet Regression

Prerequisites:

- Test with an eligible wallet controlled by the tester.
- Use only the tester's own Polymarket-compatible account, signer, deposit wallet, and funds.
- Start with the smallest practical order size for the target market.
- Confirm the selected market is open and accepting orders.
- Keep browser console and Cloudflare logs available.

Steps:

1. Open `/bid` in production.
2. Connect the eligible wallet.
3. Confirm the account panel shows the connected wallet and derived deposit wallet.
4. Click `Enable trading` and sign only the wallet prompts shown by the user's wallet.
5. Confirm readiness checks show eligibility, credentials, deposit wallet, balance, and allowance.
6. If funds are needed, generate the deposit address and send a small Polygon USDC transfer from the connected wallet.
7. Refresh readiness after settlement.
8. Choose a low-risk World Cup market/outcome and verify the ticket shows side, price, size, estimated total, potential outcome, token id, and order type.
9. Submit the order only after confirming the wallet signature request matches the selected ticket.
10. Confirm the UI shows the submitted timestamp.
11. Refresh recent orders and persisted history.
12. If an open order remains, cancel it and confirm persisted history updates to `cancelled`.
13. Refresh positions and confirm any current position is shown without advisory language.
14. Query D1 to confirm one safe order row and matching audit events were written.

Expected D1 artifacts:

- `user_trading_orders` contains safe order metadata only.
- `preview_json` contains market/team/outcome/side/price/size estimates.
- `response_json` contains CLOB response summary only.
- No signed order payload, user CLOB secret, passphrase, wallet seed, or private key is stored.
- `user_trading_audit_events` contains lifecycle events for session, credential derivation, order submission, refresh, and cancellation.

## Geoblock Regression

Allowed-region check:

- From an allowed region, connect a wallet and confirm readiness can reach `eligible`.
- Confirm submit and cancel endpoints re-check eligibility before action.

Blocked-region check:

- From a blocked region, open `/bid` and connect a wallet.
- Confirm readiness shows the Polymarket restriction reason.
- Confirm order submission remains disabled.
- Direct POST attempts to `/api/trading/orders` and `/api/trading/orders/cancel` must return `403`.

## Multi-Wallet QA

Run the real wallet regression with at least:

- A wallet with an existing deployed Polymarket deposit wallet.
- A first-time wallet that needs deposit-wallet deployment.
- A wallet with insufficient USDC.
- A wallet with insufficient conditional token balance for a sell order.
- A wallet/account switch after session creation.

Pass criteria:

- Active wallet mismatch is blocked before credential derivation, approvals, deposit, and order signing.
- Credentials are derived for the connected wallet only.
- Order maker/signer must match the session deposit wallet.
- Orders cannot be submitted without passing balance and allowance checks.
- Disconnect clears session and credential cookies.
