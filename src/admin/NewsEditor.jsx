import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "./Shell";
import api, { imageUrl } from "../utils/api";
import { locations, categories } from "../utils/data";

const blank = { title: "", slug: "", location: "Noakhali Sadar", content: "", status: "draft", category: "স্থানীয়", videoUrl: "" };

/** Bengali + English + numbers → URL-safe slug */
function makeSlug(text) {
  // Transliterate common Bengali characters to Latin equivalents
  const bn2en = {
    'অ':'a','আ':'a','ই':'i','ঈ':'i','উ':'u','ঊ':'u','এ':'e','ঐ':'oi','ও':'o','ঔ':'ou',
    'ক':'k','খ':'kh','গ':'g','ঘ':'gh','ঙ':'ng',
    'চ':'ch','ছ':'chh','জ':'j','ঝ':'jh','ঞ':'n',
    'ট':'t','ঠ':'th','ড':'d','ঢ':'dh','ণ':'n',
    'ত':'t','থ':'th','দ':'d','ধ':'dh','ন':'n',
    'প':'p','ফ':'ph','ব':'b','ভ':'bh','ম':'m',
    'য':'j','র':'r','ল':'l','শ':'sh','ষ':'sh','স':'s','হ':'h',
    'ড়':'r','ঢ়':'rh','য়':'y','ৎ':'t','ং':'ng','ঃ':'h','ঁ':'n',
    'া':'a','ি':'i','ী':'i','ু':'u','ূ':'u','ে':'e','ৈ':'oi','ো':'o','ৌ':'ou',
    'ক্':'k','ক্ষ':'ksh','জ্ঞ':'gg',
    '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9',
  };

  let result = '';
  for (const ch of text) {
    result += bn2en[ch] ?? ch;
  }

  return result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `news-${Date.now()}`;
}

export default function NewsEditor() {
  const [form, setForm]         = useState(blank);
  const [mainFile, setMainFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const { id } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    if (id) api.get(`/news/id/${id}`).then(r => setForm(r.data.news)).catch(() => {});
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // AI দিয়ে title generate করো
  const handleAITitle = async () => {
    if (!form.content || form.content.trim().length < 50) {
      setError("AI title বানাতে আগে অন্তত ৫০ অক্ষরের content লিখুন।");
      return;
    }
    setAiTitleLoading(true);
    setError("");
    try {
      const r = await api.post("/summarize/title", { content: form.content });
      const newTitle = r.data.title || "";
      if (newTitle) {
        set("title", newTitle);
        if (!id) set("slug", makeSlug(newTitle));
      }
    } catch (err) {
      setError(err.response?.data?.message || "AI title তৈরি করা যায়নি।");
    } finally {
      setAiTitleLoading(false);
    }
  };

  const handleTitleChange = (val) => {
    set("title", val);
    // Auto-generate slug only for new news
    if (!id) {
      set("slug", makeSlug(val));
    }
  };

  async function save(e) {
    e.preventDefault();
    setError("");

    // Validate slug
    if (!form.slug || form.slug === "-") {
      const generated = makeSlug(form.title);
      set("slug", generated);
      form.slug = generated;
    }

    setSaving(true);
    try {
      const b = new FormData();
      ["title","slug","location","content","status","category","videoUrl"].forEach(k => b.append(k, form[k] || ""));
      if (mainFile) b.append("image", mainFile);
      galleryFiles.forEach(f => b.append("gallery", f));
      id ? await api.put(`/news/${id}`, b) : await api.post("/news", b);
      nav("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
      setSaving(false);
    }
  }

  const F = ({ label, children }) => (
    <div>
      <label className="block mb-1 text-xs font-bold uppercase text-gray-500">{label}</label>
      {children}
    </div>
  );
  const inp = "border border-border px-4 py-3 w-full focus:outline-none focus:border-primary";

  return (
    <Shell>
      <h1 className="text-3xl font-black">{id ? "Edit" : "Create"} News</h1>
      <form onSubmit={save} className="mt-6 grid max-w-4xl gap-5 border border-border p-5">

        {error && (
          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            ⚠ {error}
          </div>
        )}

        <F label="Title (শিরোনাম)">
          <div className="flex gap-2 items-stretch">
            <input className={inp} placeholder="শিরোনাম লিখুন অথবা AI দিয়ে বানাও" value={form.title}
              onChange={e => handleTitleChange(e.target.value)} required />
            <button
              type="button"
              onClick={handleAITitle}
              disabled={aiTitleLoading}
              title="Content থেকে AI দিয়ে শিরোনাম তৈরি করুন"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              {aiTitleLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z"/></svg>
                  AI Title
                </>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">💡 Content লেখার পর "AI Title" বাটন চাপলে AI নিজে শিরোনাম বানিয়ে দেবে</p>
        </F>

        <F label="Slug (URL — স্বয়ংক্রিয়ভাবে তৈরি হয়)">
          <input className={inp} placeholder="news-slug"
            value={form.slug || ""}
            onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-"))}
            onBlur={e => {
              // If slug is empty on blur, generate from title
              if (!e.target.value.trim() && form.title) {
                set("slug", makeSlug(form.title));
              }
            }}
          />
          <p className="mt-1 text-xs text-gray-400">
            Preview: <span className="font-mono text-primary">/news/{form.slug || "…"}</span>
          </p>
        </F>

        <F label="Main Image (প্রধান ছবি)">
          <input type="file" accept="image/*" onChange={e => setMainFile(e.target.files[0])} className="text-sm" />
          {form.image && !mainFile && (
            <img src={imageUrl(form.image)} alt="" className="mt-2 h-24 w-auto object-cover border border-border" />
          )}
        </F>

        <F label="Gallery Images (অতিরিক্ত ছবি — একাধিক সিলেক্ট করুন)">
          <input type="file" accept="image/*" multiple onChange={e => setGalleryFiles(Array.from(e.target.files))} className="text-sm" />
          {form.gallery?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {form.gallery.map((g, i) => (
                <img key={i} src={imageUrl(g)} alt="" className="h-16 w-16 object-cover border border-border" />
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">নতুন ছবি পুরানো ছবির সাথে যোগ হবে</p>
        </F>

        <F label="Video URL (YouTube link বা সরাসরি video URL)">
          <input className={inp} placeholder="https://youtube.com/watch?v=... অথবা ফাঁকা রাখুন"
            value={form.videoUrl || ""} onChange={e => set("videoUrl", e.target.value)} />
        </F>

        <F label="Category (বিভাগ)">
          <select className={inp} value={form.category} onChange={e => set("category", e.target.value)}>
            {categories.filter(c => c.en !== "all").map(c => <option key={c.en} value={c.en}>{c.bn}</option>)}
          </select>
        </F>

        <F label="Location (এলাকা — ঐচ্ছিক)">
          <select className={inp} value={form.location} onChange={e => set("location", e.target.value)}>
            <option value="">-- কোনো এলাকা নেই --</option>
            {locations.map(x => <option key={x.slug} value={x.en}>{x.bn} ({x.en})</option>)}
          </select>
        </F>

        <F label="Content (খবরের বিবরণ)">
          <textarea className={`${inp} min-h-56`} placeholder="খবর লিখুন..."
            value={form.content} onChange={e => set("content", e.target.value)}
            style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }} required />
        </F>

        <F label="Status">
          <select className={inp} value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </F>

        <button
          disabled={saving}
          className="w-fit bg-primary px-6 py-3 font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : (id ? "Update News" : "Publish News")}
        </button>
      </form>
    </Shell>
  );
}
