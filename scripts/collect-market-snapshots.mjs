const baseUrl = process.argv[2] ?? process.env.MARKET_COLLECTOR_BASE_URL ?? "http://localhost:3005";
const secret = process.env.MARKET_COLLECTOR_SECRET;

const url = new URL("/api/market/snapshots/collect", baseUrl);

const headers = {};

if (secret) {
  headers.Authorization = `Bearer ${secret}`;
}

const response = await fetch(url, {
  method: "POST",
  headers,
});

const text = await response.text();

if (!response.ok) {
  console.error(text);
  process.exit(1);
}

console.log(text);
