import { useCallback, useEffect, useRef, useState } from "react";
import api from "../utils/api";
import { sanitizeHtml, toHtml } from "../utils/richText";

// Lightweight WYSIWYG editor (contentEditable + document.execCommand). No extra npm package needed.
// Output is a small safe HTML subset; the server sanitizes it again before saving.

const MAX_IMG_SIDE = 1280;

/** Shrink a photo in the browser before upload (keeps ratio, no padding/crop). */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ছবি পড়া যায়নি।"));
    reader.onload = () => {
      const src = String(reader.result || "");
      if (file.type === "image/gif") return resolve(src); // keep animation
      const img = new Image();
      img.onerror = () => reject(new Error("ছবিটি খোলা যায়নি।"));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMG_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function Btn({ title, onClick, active, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // mouseDown + preventDefault keeps the text selection inside the editor
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      className={`nv-rte-btn${active ? " is-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = "খবর লিখুন..." }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const lastHtml = useRef(null);   // last HTML we pushed to the parent (to tell outside changes from our own)
  const savedRange = useRef(null);
  const [active, setActive] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [empty, setEmpty] = useState(true);

  const isEmpty = (el) => !el.textContent.trim() && !el.querySelector("img");

  // Load / replace content when the parent changes it (editing an old story, AI draft, ...)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = toHtml(value || "");
    if (value === lastHtml.current && el.innerHTML) return;
    el.innerHTML = sanitizeHtml(next);
    lastHtml.current = value || "";
    setEmpty(isEmpty(el));
  }, [value]);

  useEffect(() => {
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* ignore */ }
    try { document.execCommand("styleWithCSS", false, false); } catch { /* ignore */ }
  }, []);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = isEmpty(el) ? "" : el.innerHTML;
    lastHtml.current = html;
    setEmpty(!html);
    onChange?.(html);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return;
    savedRange.current = sel.getRangeAt(0).cloneRange();
    const q = (c) => { try { return document.queryCommandState(c); } catch { return false; } };
    let block = "";
    try { block = String(document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, ""); } catch { /* ignore */ }
    setActive({ bold: q("bold"), italic: q("italic"), underline: q("underline"), ul: q("insertUnorderedList"), ol: q("insertOrderedList"), h2: block === "h2", h3: block === "h3", quote: block === "blockquote" });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  const focusEditor = () => {
    const el = ref.current;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && el.contains(savedRange.current.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, arg = null) => {
    focusEditor();
    document.execCommand(cmd, false, arg);
    emit();
    refreshActive();
  };

  const toggleBlock = (tag) => {
    focusEditor();
    let cur = "";
    try { cur = String(document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, ""); } catch { /* ignore */ }
    document.execCommand("formatBlock", false, cur === tag ? "<p>" : `<${tag}>`);
    emit();
    refreshActive();
  };

  const addLink = () => {
    focusEditor();
    const sel = window.getSelection();
    const url = window.prompt("লিংকের URL দিন (https://...)", "https://");
    if (!url || url === "https://") return;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url.trim())) { setErr("লিংক অবশ্যই https:// বা http:// দিয়ে শুরু হতে হবে।"); return; }
    setErr("");
    if (sel && sel.isCollapsed) document.execCommand("insertHTML", false, `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>`);
    else document.execCommand("createLink", false, url.trim());
    emit();
  };

  async function insertImageFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) { setErr("শুধু JPG, PNG, WebP বা GIF ছবি দেওয়া যাবে।"); return; }
    setErr(""); setBusy(true);
    try {
      const image = await fileToDataUrl(file);
      const r = await api.post("/news-media", { image });
      const alt = (window.prompt("ছবির সংক্ষিপ্ত বর্ণনা (ঐচ্ছিক — অন্ধ পাঠক ও Google-এর জন্য)", "") || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      focusEditor();
      document.execCommand("insertHTML", false, `<img src="${r.data.url}" alt="${alt}"><p><br></p>`);
      emit();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "ছবি আপলোড করা যায়নি।");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const onPaste = (e) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const imgFile = Array.from(cd.files || []).find((f) => f.type.startsWith("image/"));
    if (imgFile) { e.preventDefault(); insertImageFile(imgFile); return; }
    const html = cd.getData("text/html");
    e.preventDefault();
    if (html) document.execCommand("insertHTML", false, sanitizeHtml(html));      // keeps bold/italic/links, drops Word/web junk
    else document.execCommand("insertText", false, cd.getData("text/plain"));
    emit();
  };

  const onDrop = (e) => {
    const f = Array.from(e.dataTransfer?.files || []).find((x) => x.type.startsWith("image/"));
    if (f) { e.preventDefault(); insertImageFile(f); }
  };

  return (
    <div className="nv-rte">
      <div className="nv-rte-bar" role="toolbar" aria-label="Text formatting">
        <Btn title="Bold (Ctrl+B) — মোটা" active={active.bold} onClick={() => exec("bold")}><b>B</b></Btn>
        <Btn title="Italic (Ctrl+I) — বাঁকা" active={active.italic} onClick={() => exec("italic")}><i style={{ fontFamily: "serif" }}>I</i></Btn>
        <Btn title="Underline (Ctrl+U) — আন্ডারলাইন" active={active.underline} onClick={() => exec("underline")}><u>U</u></Btn>
        <span className="nv-rte-sep" />
        <Btn title="বড় উপশিরোনাম" active={active.h2} onClick={() => toggleBlock("h2")}>H2</Btn>
        <Btn title="ছোট উপশিরোনাম" active={active.h3} onClick={() => toggleBlock("h3")}>H3</Btn>
        <Btn title="উদ্ধৃতি (Quote)" active={active.quote} onClick={() => toggleBlock("blockquote")}>❝</Btn>
        <span className="nv-rte-sep" />
        <Btn title="বুলেট তালিকা" active={active.ul} onClick={() => exec("insertUnorderedList")}>• ≡</Btn>
        <Btn title="নম্বর তালিকা" active={active.ol} onClick={() => exec("insertOrderedList")}>1. ≡</Btn>
        <span className="nv-rte-sep" />
        <Btn title="লিংক যোগ করুন" onClick={addLink}>🔗</Btn>
        <Btn title="লিংক সরান" onClick={() => exec("unlink")}>🔗✕</Btn>
        <Btn title="লেখার ভেতরে ছবি যোগ করুন" disabled={busy} onClick={() => { focusEditor(); fileRef.current?.click(); }}>{busy ? "⏳ আপলোড…" : "🖼 ছবি"}</Btn>
        <span className="nv-rte-sep" />
        <Btn title="ফরম্যাট মুছুন" onClick={() => exec("removeFormat")}>Tx</Btn>
        <Btn title="Undo (Ctrl+Z)" onClick={() => exec("undo")}>↶</Btn>
        <Btn title="Redo (Ctrl+Y)" onClick={() => exec("redo")}>↷</Btn>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => insertImageFile(e.target.files?.[0])} />
      </div>

      {err && <div className="nv-rte-err">⚠ {err}</div>}

      <div className="nv-rte-wrap">
        {empty && <div className="nv-rte-ph">{placeholder}</div>}
        <div
          ref={ref}
          className="nv-prose nv-rte-body"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          spellCheck={false}
          onInput={emit}
          onBlur={emit}
          onKeyUp={refreshActive}
          onMouseUp={refreshActive}
          onPaste={onPaste}
          onDrop={onDrop}
        />
      </div>
      <p className="nv-rte-hint">💡 লেখা সিলেক্ট করে <b>B</b> / <i>I</i> চাপুন। ছবি যোগ করতে কার্সার যেখানে রাখবেন সেখানে “🖼 ছবি” চাপুন (অথবা ছবি paste/drag করুন)। ছবি মুছতে ছবিতে ক্লিক করে Delete চাপুন।</p>
    </div>
  );
}
