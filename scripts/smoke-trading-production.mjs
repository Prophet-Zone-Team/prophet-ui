const DEFAULT_BASE_URL = "https://wc.dolla.market";
const baseUrl = normalizeBaseUrl(process.argv[2] ?? process.env.TRADING_SMOKE_BASE_URL ?? DEFAULT_BASE_URL);
const checks = [];

await checkPage("/bid");
await checkUnauthenticatedJson("/api/trading/orders/history", 401, "Trading session not found.");
await checkUnauthenticatedJson("/api/trading/positions", 401, "Trading session not found.");
await checkTradingConfig();

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
    pass:
      response.status === 200 &&
      typeof payload?.builderCode === "string" &&
      payload.builderCode.length > 0 &&
      payload.builderMakerFeeRate === 0.005 &&
      payload.builderTakerFeeRate === 0.01,
    detail: `HTTP ${response.status}${payload?.builderTakerFeeRate !== undefined ? ` / taker ${payload.builderTakerFeeRate} / maker ${payload.builderMakerFeeRate}` : ""}`,
  });
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
