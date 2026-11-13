// Start the local API and Vite frontend together. Works on Windows, macOS and Linux.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load local secrets for Node as well as Vite. Prefer .env.local, then fall back
// to .env so a common dotenv filename does not leave the API unconfigured.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(resolve(file))) continue;
  try { process.loadEnvFile(resolve(file)); }
  catch (error) { console.warn(`[Noakhali Vision] Could not load ${file}:`, error.message); }
}

const missing = [];
if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) missing.push("JWT_SECRET (minimum 16 characters)");
if (missing.length) {
  console.error("\n[Noakhali Vision] Backend configuration is incomplete:");
  for (const item of missing) console.error(`  - ${item}`);
  console.error("Copy .env.example to .env.local, fill in the real values, then run npm run dev:all again.\n");
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn("[Noakhali Vision] ADMIN_PASSWORD is not set. Initial admin login will fail unless an admin password hash already exists in MongoDB.");
}

const viteBin = resolve("node_modules/vite/bin/vite.js");
if (!existsSync(viteBin)) {
  console.error("Vite is not installed. Run npm install first.");
  process.exit(1);
}

const children = [];
function start(label, args) {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", (error) => {
    console.error(`[${label}]`, error.message);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`[${label}] stopped (${signal || code}).`);
      shutdown(code || 1);
    }
  });
  return child;
}
let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (!child.killed) child.kill();
  process.exitCode = code;
}

start("API", ["dev-api.mjs"]);
start("Vite", [viteBin, "--host", "0.0.0.0"]);
console.log("\nNoakhali Vision is starting:");
console.log("  Website: http://localhost:5173");
console.log("  API:     http://localhost:3001/api/health");
console.log("Press Ctrl+C to stop both servers.\n");
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
