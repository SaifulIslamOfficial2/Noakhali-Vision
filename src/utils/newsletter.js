import emailjs from "@emailjs/browser";

// Same EmailJS service/template the footer newsletter already uses.
const SERVICE_ID  = "service_ob8wmh3";
const TEMPLATE_ID = "template_9e4nrsz";
const PUBLIC_KEY  = "ASAezSfaSVjMd75v5";

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

/** Sends the subscriber's email to the site owner via EmailJS. Throws on failure. */
export function subscribeNewsletter(email) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, { subscriber_email: String(email).trim() }, PUBLIC_KEY);
}
