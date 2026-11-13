import { useEffect, useRef, useState } from "react";
import { useLang } from "../utils/LanguageContext";

/* Global "OK / Cancel" confirmation before any form is submitted.
   Works for every <form> (public + admin) without touching each page:
   the first submit is intercepted, and only after OK is it re-submitted for real.
   Skip a form with  data-no-confirm  (search, login, filters are skipped automatically). */
const SKIP = 'form[role="search"], form.nv-search, form[data-no-confirm], form[data-confirmed="1"]';
const LOGIN_PATH = /^\/admin\/?$/;

export default function SubmitConfirm() {
  const { lang } = useLang();
  const [pending, setPending] = useState(null); // { form, submitter }
  const okRef = useRef(null);
  const bn = lang === "bn";
  const admin = typeof location !== "undefined" && location.pathname.startsWith("/admin");

  useEffect(() => {
    const onSubmit = (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.confirmed === "1") { delete form.dataset.confirmed; return; } // confirmed → let it through
      if (form.matches(SKIP) || LOGIN_PATH.test(location.pathname)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setPending({ form, submitter: e.submitter || null });
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    okRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setPending(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending) return null;

  const confirm = () => {
    const { form, submitter } = pending;
    setPending(null);
    form.dataset.confirmed = "1";
    // wait a tick so the modal unmounts, then submit for real (React's onSubmit runs now)
    setTimeout(() => {
      if (!form.isConnected) return;
      try { submitter && form.contains(submitter) ? form.requestSubmit(submitter) : form.requestSubmit(); }
      catch { delete form.dataset.confirmed; }
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 px-4 nv-confirm-fade"
      role="alertdialog" aria-modal="true" aria-labelledby="nv-sc-title" onClick={() => setPending(null)}>
      <div className="nv-confirm-pop w-full max-w-sm border border-border bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 id="nv-sc-title" className="mb-2 text-lg font-black text-ink">{admin ? (bn ? "সংরক্ষণ করতে চান?" : "Save these changes?") : (bn ? "জমা দিতে চান?" : "Submit this form?")}</h3>
        <p className="mb-6 text-sm text-muted">{admin ? (bn ? "পরিবর্তনগুলো ওয়েবসাইটে প্রয়োগ হবে। নিশ্চিত হলে OK চাপুন।" : "These changes will go to the website. Press OK to confirm.") : (bn ? "তথ্যগুলো একবার দেখে নিন। নিশ্চিত হলে OK চাপুন।" : "Please review your details. Press OK to confirm.")}</p>
        <div className="flex gap-3">
          <button ref={okRef} type="button" onClick={confirm} className="flex-1 bg-primary py-2.5 text-sm font-black text-white hover:opacity-90">OK</button>
          <button type="button" onClick={() => setPending(null)} className="flex-1 border border-border py-2.5 text-sm font-bold hover:bg-gray-50">{bn ? "বাতিল" : "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}
