import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = ["src", ".env.example"];
const IGNORED_DIRS = new Set([".next", ".open-next", "node_modules", ".git"]);
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\bENABLE_REAL_POLYMARKET_ORDERS\b/,
    reason: "Deployment-level trading flag must not gate consumer order submission.",
  },
  {
    pattern: /\b(?:POLYMARKET_PRIVATE_KEY|POLY_PRIVATE_KEY|PRIVATE_KEY)\b/,
    reason: "Consumer trading must never use a platform/deployment private key.",
  },
  {
    pattern: /\b(?:POLYMARKET_API_KEY|POLYMARKET_API_SECRET|POLYMARKET_API_PASSPHRASE|CLOB_API_KEY|CLOB_SECRET|CLOB_PASS_PHRASE)\b/,
    reason: "Consumer trading must use user-derived CLOB credentials, not platform CLOB credentials.",
  },
  {
    pattern: /\b(?:submitPolymarketOrder|getPolymarketTradingConfigStatus)\b/,
    reason: "Legacy server-wallet submission helpers must not be reintroduced.",
  },
  {
    pattern: /\b(?:MockBid|readStoredBids|writeStoredBids|simulatedOrderId|simulatedTokenId)\b/,
    reason: "The bid flow should not persist or expose local simulated order paths.",
  },
];

const violations = [];

for (const target of TARGETS) {
  await scanPath(path.join(ROOT, target));
}

if (violations.length > 0) {
  console.error("Trading safety check failed:");

  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line}: ${violation.reason}`);
    console.error(`  ${violation.text}`);
  }

  process.exit(1);
}

console.log("Trading safety check passed.");

async function scanPath(targetPath) {
  const stats = await statSafe(targetPath);

  if (!stats) {
    return;
  }

  if (stats.isDirectory()) {
    const entries = await readdir(targetPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      await scanPath(path.join(targetPath, entry.name));
    }

    return;
  }

  if (!stats.isFile() || !isTextFile(targetPath)) {
    return;
  }

  const content = await readFile(targetPath, "utf8");
  const relativeFile = path.relative(ROOT, targetPath);

  content.split(/\r?\n/).forEach((line, index) => {
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: relativeFile,
          line: index + 1,
          reason: rule.reason,
          text: line.trim(),
        });
      }
    }
  });
}

async function statSafe(targetPath) {
  try {
    const { stat } = await import("node:fs/promises");

    return stat(targetPath);
  } catch {
    return undefined;
  }
}

function isTextFile(filePath) {
  return /\.(?:css|env|example|js|jsx|json|md|mjs|ts|tsx|txt|yml|yaml)$/.test(filePath) || path.basename(filePath) === ".env.example";
}
