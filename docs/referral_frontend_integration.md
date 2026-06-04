# Prophet Referral Frontend Integration

## Local Debug

Base URL:

```text
http://127.0.0.1:7070
```

Swagger:

```text
http://127.0.0.1:7070/swagger/index.html
```

Auth uses the existing login token:

```http
Authorization: Bearer <token>
```

## Portfolio Referral Section

Call:

```http
GET /v1/user/referral
```

Response data:

```json
{
  "referral_code": "32WEZP8",
  "referral_link": "https://prophet.exchange?ref=32WEZP8",
  "tier": "standard",
  "kickback_rate": "0.1",
  "status": "active",
  "referred_user_count": 1,
  "total_referred_volume_usdc": "1000",
  "total_referral_earnings_usdc": "1",
  "claimable_balance_usdc": "1",
  "claimed_balance_usdc": "0"
}
```

Frontend display mapping:

```text
User's referral link        -> referral_link
Copy link button            -> copy referral_link
Number of referred users    -> referred_user_count
Total referred volume       -> total_referred_volume_usdc
Total referral earnings     -> total_referral_earnings_usdc
Claimable balance           -> claimable_balance_usdc
```

## Login With Referral Code

If the user lands with `?ref=CODE`, pass it during login:

```http
POST /v1/login
Content-Type: application/json
```

```json
{
  "address": "0x2222222222222222222222222222222222222222",
  "referral_code": "32WEZP8"
}
```

The response includes the normal token and the current user's referral summary:

```json
{
  "account_id": 2,
  "token": "...",
  "referral": {
    "referral_code": "43STMAM",
    "referral_link": "https://prophet.exchange?ref=43STMAM"
  }
}
```

If login already happened before the code is available, bind it once with:

```http
POST /v1/user/referral/apply
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "referral_code": "32WEZP8"
}
```

Rules:

```text
Each user can bind one referrer only once.
Users cannot refer themselves.
Paused referral accounts cannot be used as referrers.
```

## Reporting Completed Orders

Referral rewards are calculated when a completed buy/sell order is reported.

Existing endpoint:

```http
POST /v1/user/transaction
Authorization: Bearer <token>
Content-Type: application/json
```

New fields:

```text
order_type        maker | taker
order_status      completed | failed | cancelled
order_value_usdc  completed order value in USDC
```

Example completed taker order:

```json
{
  "type": "buy",
  "amount": "1000",
  "tx_hash": "polymarket-order-123",
  "market": {
    "TeamName": "Team A",
    "MarketName": "Team A vs Team B",
    "Side": "yes",
    "Price": "0.50",
    "Slug": "team-a-vs-team-b"
  },
  "order_type": "taker",
  "order_status": "completed",
  "order_value_usdc": "1000"
}
```

Calculation:

```text
Taker standard: 1000 * 1% * 10% = 1 USDC
Maker standard: 1000 * 0.5% * 10% = 0.5 USDC
Taker 20%:      1000 * 1% * 20% = 2 USDC
Maker 20%:      1000 * 0.5% * 20% = 1 USDC
```

Failed or cancelled orders should still be reported if useful for transaction history, but they do not create referral rewards:

```json
{
  "type": "buy",
  "amount": "1000",
  "tx_hash": "polymarket-order-124",
  "market": {
    "TeamName": "Team A",
    "MarketName": "Team A vs Team B",
    "Side": "yes",
    "Price": "0.50",
    "Slug": "team-a-vs-team-b"
  },
  "order_type": "taker",
  "order_status": "failed",
  "order_value_usdc": "1000"
}
```

## Admin MVP

Admin endpoints use:

```http
X-Admin-Token: <configured token>
```

Set 20% referral rate:

```http
POST /v1/admin/referral/rate
```

```json
{
  "target_user_id": 1,
  "kickback_rate": "0.2",
  "reason": "strategic partner"
}
```

Pause or unpause a referral account:

```http
POST /v1/admin/referral/pause
```

```json
{
  "target_user_id": 1,
  "paused": true,
  "reason": "suspicious activity"
}
```

## Quick Curl Flow

Create referrer:

```bash
curl -sS -X POST http://127.0.0.1:7070/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x1111111111111111111111111111111111111111"}'
```

Create referred user:

```bash
curl -sS -X POST http://127.0.0.1:7070/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x2222222222222222222222222222222222222222","referral_code":"<referrer_code>"}'
```

Get portfolio referral summary:

```bash
curl -sS http://127.0.0.1:7070/v1/user/referral \
  -H 'Authorization: Bearer <referrer_token>'
```
