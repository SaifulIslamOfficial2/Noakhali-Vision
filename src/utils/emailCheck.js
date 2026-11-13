// Email checks shared by the browser forms and the server (pure functions, no Node/browser APIs).
// What this can prove: the address is well-formed, is not a throw-away / placeholder / mistyped one.
// What it cannot prove: that the mailbox exists. The server adds a DNS check (the domain must be able to receive mail).

const DISPOSABLE = new Set((
  "mailinator.com guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz guerrillamail.de guerrillamail.info guerrillamailblock.com " +
  "sharklasers.com grr.la pokemail.net spam4.me 10minutemail.com 10minutemail.net 10minutemail.co.uk 20minutemail.com temp-mail.org temp-mail.io " +
  "tempmail.com tempmail.net tempmail.dev tempmailo.com tempmailer.com tempr.email tempail.com tempinbox.com temporary-mail.net tmpmail.org tmpmail.net " +
  "throwawaymail.com throwam.com yopmail.com yopmail.fr yopmail.net cool.fr.nf jetable.org nospam.ze.tc mailnesia.com trashmail.com trashmail.net " +
  "trashmail.de getnada.com nada.email dispostable.com fakeinbox.com fakemailgenerator.com maildrop.cc mailcatch.com mytemp.email mohmal.com " +
  "emailondeck.com mintemail.com moakt.com spamgourmet.com discard.email discardmail.com burnermail.io inboxkitten.com mailtemp.net gmailnator.com " +
  "emailfake.com fake-mail.net mail.tm harakirimail.com spambox.us mailforspam.com anonbox.net owlymail.com mailpoof.com 1secmail.com 1secmail.net " +
  "1secmail.org byom.de einrot.com dayrep.com armyspy.com cuvox.de fleckens.hu gustr.com jourrapide.com rhyta.com superrito.com teleworm.us " +
  "emltmp.com mailnull.com spamex.com tempmailaddress.com tempmail.ninja temp-mail.ru tmail.ws mail7.io mailsac.com inboxbear.com mailbox.in.ua " +
  "wegwerfmail.de wegwerfmail.net wegwerfmail.org trbvm.com zetmail.com getairmail.com mailtothis.com spamfree24.org luxusmail.org"
).split(/\s+/));

const PLACEHOLDER_DOMAINS = new Set((
  "example.com example.org example.net test.com tests.com testing.com domain.com yourdomain.com yourmail.com youremail.com mydomain.com " +
  "fake.com fakemail.com fakeemail.com noemail.com nomail.com none.com invalid.com nowhere.com sample.com email.test"
).split(/\s+/));
const BAD_TLDS = new Set(["test", "example", "invalid", "localhost", "local", "internal", "lan"]);

const JUNK_LOCAL = new Set((
  "test tester testing test1 test12 test123 fake fakemail abc abcd abcde abc123 xyz asdf asdfg asdfgh asd qwe qwer qwert qwerty zxc zxcv noemail nomail " +
  "none no na nil null nobody user username name email mail example sample demo dummy temp temporary random hello hi aaa bbb ccc xxx yyy zzz " +
  "123 1234 12345 123456 1234567 12345678 123456789 111111 000000 password"
).split(/\s+/));

const TYPOS = {
  "gmail.com": "gmial.com gmai.com gmail.co gmail.cm gmail.con gmail.om gmal.com gmil.com gamil.com gnail.com gmaill.com gmaul.com gmeil.com gmail.comm gmail.vom gmail.xom gmail.ocm gmali.com gimail.com ggmail.com gmailcom.com gmail.cim".split(" "),
  "yahoo.com": "yaho.com yahooo.com yahoo.con yahoo.cm yhoo.com yaoo.com yahho.com yahoo.om".split(" "),
  "hotmail.com": "hotmial.com hotmal.com hotmail.con hotmai.com hotnail.com hotmail.cm hormail.com hotmil.com".split(" "),
  "outlook.com": "outlok.com outloook.com outlook.con outlook.cm outllok.com outlool.com".split(" "),
  "icloud.com": "iclod.com icloud.con icoud.com iclould.com".split(" "),
};
const TYPO_MAP = new Map();
for (const [good, bads] of Object.entries(TYPOS)) for (const b of bads) TYPO_MAP.set(b, good);

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const LOCAL = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?$/;

/** Result: { ok:true, email, key, domain } or { ok:false, code, suggest? }. code: invalid | typo | disposable | placeholder */
export function checkEmail(raw) {
  const email = String(raw ?? "").normalize("NFKC").trim().toLowerCase();
  if (!email || email.length > 254 || /\s/.test(email)) return { ok: false, code: "invalid" };
  const at = email.lastIndexOf("@");
  if (at < 1 || email.indexOf("@") !== at) return { ok: false, code: "invalid" };
  const local = email.slice(0, at), domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL.test(local) || local.includes("..")) return { ok: false, code: "invalid" };
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((l) => !LABEL.test(l)) || domain.length > 253) return { ok: false, code: "invalid" };
  const tld = labels[labels.length - 1];
  if (!/^(?:[a-z]{2,24}|xn--[a-z0-9-]{2,20})$/.test(tld)) return { ok: false, code: "invalid" };

  if (TYPO_MAP.has(domain)) return { ok: false, code: "typo", suggest: `${local}@${TYPO_MAP.get(domain)}` };
  if (BAD_TLDS.has(tld) || PLACEHOLDER_DOMAINS.has(domain)) return { ok: false, code: "placeholder" };
  if (DISPOSABLE.has(domain) || labels.slice(1).some((_, i) => DISPOSABLE.has(labels.slice(i + 1).join(".")))) return { ok: false, code: "disposable" };

  const base = local.split("+")[0];
  const compact = base.replace(/[._%-]/g, "");
  if (base.length < 2 || JUNK_LOCAL.has(base) || JUNK_LOCAL.has(compact) || /^(.)\1{3,}$/.test(compact)) return { ok: false, code: "placeholder" };

  let key = email;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Gmail rules: 6-30 letters/digits/dots, dots and +tags are ignored -> a short or odd name is not a real Gmail address.
    const g = base.replace(/\./g, "");
    if (!/^[a-z0-9]{6,30}$/.test(g) || base.startsWith(".") || base.endsWith(".")) return { ok: false, code: "invalid" };
    key = `${g}@gmail.com`;
  } else if (local.includes("+")) key = `${base}@${domain}`;
  return { ok: true, email, key, domain };
}

export const isValidEmail = (v) => checkEmail(v).ok;

const MSG = {
  invalid:     { bn: "সঠিক ইমেইল ঠিকানা দিন।", en: "Please enter a valid email address." },
  typo:        { bn: (s) => `ইমেইলটি ভুল মনে হচ্ছে। আপনি কি ${s} লিখতে চেয়েছেন?`, en: (s) => `That looks like a typo. Did you mean ${s}?` },
  disposable:  { bn: "অস্থায়ী (temporary) ইমেইল গ্রহণযোগ্য নয়। আপনার আসল ইমেইল দিন।", en: "Temporary email addresses are not accepted. Please use your real email." },
  placeholder: { bn: "এটি আসল ইমেইল মনে হচ্ছে না। আপনার নিজের ইমেইল দিন।", en: "That doesn't look like a real email. Please use your own address." },
  nodomain:    { bn: "এই ইমেইলের ডোমেইন পাওয়া যায়নি। আসল ইমেইল দিন।", en: "We couldn't find that email domain. Please use a real email." },
  rate:        { bn: "অনেক বেশি চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।", en: "Too many attempts. Please try again in a moment." },
  error:       { bn: "পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।", en: "Could not subscribe. Please try again." },
};
export function emailMessage(code, lang = "bn", suggest = "") {
  const m = MSG[code] || MSG.error;
  const v = lang === "en" ? m.en : m.bn;
  return typeof v === "function" ? v(suggest) : v;
}
