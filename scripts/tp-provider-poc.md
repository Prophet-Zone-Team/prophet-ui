# TokenPocket provider POC checklist

Run these checks manually in the TokenPocket Android in-app browser. Record results separately for each host.

## Hosts

| Host kind | URL |
|-----------|-----|
| Main | `https://test.prophet.zone` (or `https://app.prophet.zone` in production) |
| Private | `https://private-test.prophet.zone/private` (or `https://private.prophet.zone/private`) |

## Preconditions

### Main site

1. Open the main host in TokenPocket DApp browser.
2. Connect Polygon wallet and complete trading login.

### Private site

1. Complete Confidential handover from the main site (or authenticate on private host).
2. Open the private host `/private` route in TokenPocket DApp browser.

## Console probes (before switching wallet family)

Run in DevTools console while still on Polygon / EVM context:

```javascript
({
  solana: typeof window.solana,
  tronWeb: typeof window.tronWeb,
  tronLink: typeof window.tronLink,
  tokenpocket: typeof window.tokenpocket,
});
```

## Direct connect (no `tp.getWallet({ switch: true })`)

### Solana

```javascript
await window.solana?.connect?.();
window.solana?.publicKey?.toBase58?.();
```

### Tron

Use the in-app Connect funding wallet button, or:

```javascript
// Adapter path is exercised by the app; note whether page reloads.
```

## Record per host

| Check | Main site | Private site |
|-------|-----------|--------------|
| `window.solana` present on EVM context | | |
| Direct Solana connect shows popup | | |
| Direct Solana connect reloads page | | |
| `signTransaction` works after direct connect | | |
| `tp.getWallet({ switch: true })` reloads page | | |
| Trading session survives reload (main only) | | |
| Confidential cookie survives reload (private only) | | |

## Expected app behavior after implementation

- **Line A**: Direct injected-provider connect succeeds without calling `tp-js-sdk` switch.
- **Line B (main)**: If reload occurs, trading session remains in localStorage and auth grace period prevents logout.
- **Line B (private)**: If reload occurs, Confidential cookie remains; user reconnects funding wallet only.
