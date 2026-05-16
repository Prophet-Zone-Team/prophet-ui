import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_BASE_URL = "https://wc.dolla.market";
const DEFAULT_D1_DATABASE = "world-cup-market-history";
const baseUrl = normalizeBaseUrl(process.argv[2] ?? process.env.TRADING_SMOKE_BASE_URL ?? DEFAULT_BASE_URL);
const d1Database = process.env.TRADING_SMOKE_D1_DATABASE ?? DEFAULT_D1_DATABASE;
const skipD1 = process.env.TRADING_SMOKE_SKIP_D1 === "1";
const checks = [];

await checkPage("/bid");
await checkUnauthenticatedJson("/api/trading/orders/history", 401, "Trading session not found.");
await checkUnauthenticatedJson("/api/trading/positions", 401, "Trading session not found.");
await checkTradingConfig();

if (!skipD1) {
  await checkRemoteD1Tables();
}

const failed = checks.filter((check) => check.status === "fail");

for (const check of checks) {
  const marker = check.status === "pass" ? "PASS" : "FAIL";
  console.log(`${marker} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
}

if (failed.length > 0) {
  process.exit(1);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function checkPage(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
  });

  record({
    name: `${pathname} returns 200`,
    pass: response.status === 200,
    detail: `HTTP ${response.status}`,
  });
}

async function checkUnauthenticatedJson(pathname, expectedStatus, expectedError) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await readJson(response);

  record({
    name: `${pathname} rejects missing session`,
    pass: response.status === expectedStatus && payload?.error === expectedError,
    detail: `HTTP ${response.status}${payload?.error ? ` / ${payload.error}` : ""}`,
  });
}

async function checkTradingConfig() {
  const response = await fetch(`${baseUrl}/api/trading/config`, {
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await readJson(response);

  record({
    name: "/api/trading/config exposes builder readiness",
    pass: response.status === 200 && typeof payload?.builderCode === "string" && payload.builderCode.length > 0,
    detail: `HTTP ${response.status}${payload?.builderTakerFeeRate !== undefined ? ` / fee ${payload.builderTakerFeeRate}` : ""}`,
  });
}

async function checkRemoteD1Tables() {
  const command = [
    "wrangler",
    "d1",
    "execute",
    d1Database,
    "--remote",
    "--command",
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_trading_orders','user_trading_audit_events') ORDER BY name;",
  ];

  try {
    const { stdout } = await execFileAsync("npx", command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 2,
    });
    const hasOrders = stdout.includes('"name": "user_trading_orders"');
    const hasAudit = stdout.includes('"name": "user_trading_audit_events"');

    record({
      name: "remote D1 trading tables exist",
      pass: hasOrders && hasAudit,
      detail: hasOrders && hasAudit ? d1Database : "missing one or more tables",
    });
  } catch (error) {
    record({
      name: "remote D1 trading tables exist",
      pass: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function record({ name, pass, detail }) {
  checks.push({
    name,
    status: pass ? "pass" : "fail",
    detail,
  });
}
