import crypto from "node:crypto";

const b64u = (v) => Buffer.from(v).toString("base64url");

export function signToken(payload, secret, ttlSec = 7 * 24 * 3600) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ ...payload, iat: now, exp: now + ttlSec }));
  const sig = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function verifyToken(token, secret) {
  try {
    const [head, body, sig] = String(token || "").split(".");
    if (!head || !body || !sig) return null;
    const expected = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPassword(password, { salt, hash }) {
  try {
    const test = crypto.scryptSync(String(password), Buffer.from(salt, "hex"), 64);
    const real = Buffer.from(hash, "hex");
    return test.length === real.length && crypto.timingSafeEqual(test, real);
  } catch {
    return false;
  }
}

// Constant-time string comparison (hashes both sides so lengths never leak).
export function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
