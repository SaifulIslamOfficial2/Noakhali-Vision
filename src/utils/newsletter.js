import { useState } from "react";
import emailjs from "@emailjs/browser";
import api from "./api";
import { checkEmail, emailMessage } from "./emailCheck";

export { isValidEmail } from "./emailCheck";

// Optional heads-up e-mail to the site owner (same EmailJS service as before). The subscriber itself is stored by the server.
const SERVICE_ID  = "service_ob8wmh3";
const TEMPLATE_ID = "template_9e4nrsz";
const PUBLIC_KEY  = "ASAezSfaSVjMd75v5";

/** Saves the subscriber on the server (which re-checks the address). Resolves { already }, rejects with Error{ userMessage }. */
export async function subscribeNewsletter(email, { source = "web", lang = "bn" } = {}) {
  try {
    const r = await api.post("/newsletter", { email: String(email).trim(), source, lang });
    if (!r.data?.already) emailjs.send(SERVICE_ID, TEMPLATE_ID, { subscriber_email: String(email).trim() }, PUBLIC_KEY).catch(() => {});
    return { already: !!r.data?.already };
  } catch (e) {
    const d = e.response?.data;
    const err = new Error(d?.message || "subscribe failed");
    err.userMessage = e.response?.status === 429 ? emailMessage("rate", lang) : (d?.code ? emailMessage(d.code, lang, d.suggest) : emailMessage("error", lang));
    throw err;
  }
}

/** One hook for every newsletter box: checks the address in the browser first, then the server does the strict check. */
export function useNewsletter(lang, source) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [msg, setMsg] = useState("");
  const [already, setAlready] = useState(false);
  const onChange = (v) => { setEmail(v); if (state !== "sending") { setState("idle"); setMsg(""); } };
  const submit = async (e) => {
    e?.preventDefault?.();
    if (state === "sending") return;
    const c = checkEmail(email);
    if (!c.ok) { setState("error"); setMsg(emailMessage(c.code, lang, c.suggest)); return; }
    setState("sending"); setMsg("");
    try { const r = await subscribeNewsletter(c.email, { source, lang }); setAlready(r.already); setState("done"); setEmail(""); }
    catch (err) { setState("error"); setMsg(err.userMessage || emailMessage("error", lang)); }
  };
  return { email, onChange, state, msg, already, submit, sending: state === "sending", done: state === "done", error: state === "error" };
}
