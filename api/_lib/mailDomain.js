// Server-side proof that an email domain can really receive mail (MX record, or an A/AAAA record as the RFC fallback).
// A DNS outage or timeout never blocks a visitor: only a definite "this domain does not exist / has no mail" answer does.
import { promises as dns } from "node:dns";

let resolver = {
  mx: (d) => dns.resolveMx(d),
  a: (d) => dns.resolve4(d).catch(() => dns.resolve6(d)),
};
/** Tests can replace the resolver: setMailResolver({ mx: async (d) => [...], a: async (d) => [...] }) */
export const setMailResolver = (r) => { resolver = r; cache.clear(); };

const cache = new Map(); // domain -> { ok, at }
const TTL = 6 * 3600_000;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);
const DEFINITE = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

/** true = can receive mail (or we could not tell), false = definitely cannot. */
export async function domainCanReceiveMail(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < TTL) return hit.ok;
  let ok = true;
  try {
    const mx = await withTimeout(resolver.mx(domain), 3000);
    ok = Array.isArray(mx) && mx.length > 0 && !(mx.length === 1 && (!mx[0].exchange || mx[0].exchange === "."));  // "." = null MX: explicitly no mail
  } catch (e) {
    if (DEFINITE.has(e?.code)) {
      try { const a = await withTimeout(resolver.a(domain), 3000); ok = Array.isArray(a) && a.length > 0; }
      catch (e2) { ok = DEFINITE.has(e2?.code) ? false : true; }
    } else ok = true; // SERVFAIL / timeout / network: do not punish the visitor
  }
  if (cache.size > 2000) cache.clear();
  cache.set(domain, { ok, at: Date.now() });
  return ok;
}
