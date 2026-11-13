// Cross-platform API test runner. Uses FakeDb; no MongoDB Atlas credentials required.
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const env = {
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET || "testsecret-testsecret-testsecret-1234567890",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Str0ng!Pass",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "noakhalivision1@gmail.com",
  API_PORT: "3001",
};
const server = spawn(process.execPath, ["tests/server.mjs"], { stdio: "inherit", env });
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  if (!server.killed) server.kill();
};
process.on("SIGINT", () => { stop(); process.exit(130); });
process.on("SIGTERM", () => { stop(); process.exit(143); });

try {
  let ready = false;
  let serverExit = null;
  server.once("exit", (code, signal) => { serverExit = signal || code || 1; });
  for (let i = 0; i < 60; i++) {
    if (serverExit !== null) throw new Error(`API test server exited early (${serverExit}). Review the startup error above; make sure dependencies are installed and port 3001 is free.`);
    try {
      const response = await fetch("http://localhost:3001/api/news", { signal: AbortSignal.timeout(1000) });
      if (response.ok) { ready = true; break; }
    } catch { /* wait for startup */ }
    await delay(250);
  }
  if (!ready) throw new Error("API test server did not become ready on port 3001.");
  const tests = spawn(process.execPath, ["tests/api.test.mjs"], { stdio: "inherit", env });
  const code = await new Promise((resolve, reject) => {
    tests.on("error", reject);
    tests.on("exit", (c) => resolve(c ?? 1));
  });
  process.exitCode = code;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
