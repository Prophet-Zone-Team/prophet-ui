import { execSync } from "node:child_process";

const ports = [8787, 8788];

for (const port of ports) {
  try {
    const output = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!output) {
      continue;
    }

    const pids = [...new Set(output.split("\n").map((value) => value.trim()).filter(Boolean))];

    if (pids.length > 0) {
      execSync(`kill ${pids.join(" ")}`, { stdio: "ignore" });
    }
  } catch {
    // No listener on this port.
  }
}
