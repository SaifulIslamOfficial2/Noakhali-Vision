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
    '্':'',
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

// Must live outside NewsEditor: a component defined inside the render function gets a new
// identity on every keystroke, which remounts the inputs and makes them lose focus.
function F({ label, children }) {
  return (
    <div>
      <label className="block mb-1 text-xs font-bold uppercase text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function NewsEditor() {
  const [form, setForm]         = useState(blank);
  const [mainFile, setMainFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [language, setLanguage] = useState("bn");
  const { id } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    if (id) api.get(`/news/id/${id}`).then(r => setForm(r.data.news)).catch(() => {});
    api.get("/categories").then(r => setCategoriesList(r.data.categories || [])).catch(() => {});
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // AI দিয়ে title generate করো
  const handleAITitle = async () => {
    if (!form.content || form.content.trim().length < 50) {
      setError("স্বয়ংক্রিয় শিরোনামের জন্য আগে অন্তত ৫০ অক্ষরের content লিখুন।");
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
      setError(err.response?.data?.message || "শিরোনাম তৈরি করা যায়নি।");
    } finally {
      setAiTitleLoading(false);
    }
  };


  const handleAIWriter = async () => {
    if (!form.content || form.content.trim().length < 80) { setError("AI লেখার জন্য অন্তত ৮০ অক্ষরের সংবাদ বিবরণ দিন।"); return; }
    setAiLoading(true); setError("");
    try { const r = await api.post("/ai/news-writer", { content: form.content, language }); setAiDraft(r.data.result || null); }
    catch (err) { setError(err.response?.data?.message || "AI News Writer চালু করা যায়নি।"); }
    finally { setAiLoading(false); }
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
    let slug = form.slug;
    if (!slug || slug === "-") {
      slug = makeSlug(form.title);
      set("slug", slug);
    }

    setSaving(true);
    try {
      const b = new FormData();
      ["title","slug","location","content","summary","status","category","videoUrl"].forEach(k => b.append(k, (k === "slug" ? slug : form[k]) || ""));
      if (mainFile) b.append("image", mainFile);
      galleryFiles.forEach(f => b.append("gallery", f));
      id ? await api.put(`/news/${id}`, b) : await api.post("/news", b);
      nav("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
      setSaving(false);
    }
  }

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
            <input className={inp} placeholder="শিরোনাম লিখুন অথবা content থেকে স্বয়ংক্রিয় নিন" value={form.title}
              onChange={e => handleTitleChange(e.target.value)} required />
            <button
              type="button"
              onClick={handleAITitle}
              disabled={aiTitleLoading}
              title="Content-এর প্রথম বাক্য থেকে শিরোনাম নিন"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #0B4D35, #55B52E)" }}
            >
              {aiTitleLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z"/></svg>
                  Auto Title
                </>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">💡 Content লেখার পর "Auto Title" চাপলে content-এর প্রথম বাক্য শিরোনাম হিসেবে বসবে (আসল AI নয়, তাই দেখে ঠিক করে নিন)</p>
        </F>

        <F label="Summary (সারসংক্ষেপ — ফাঁকা রাখলে সংবাদের শুরুর অংশ দেখাবে)">
          <textarea className={inp} rows={3} maxLength={600} placeholder="২–৩ বাক্যে সংবাদের সারসংক্ষেপ"
            value={form.summary || ""} onChange={e => set("summary", e.target.value)} />
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
            {(categoriesList.length ? categoriesList.map(c => ({ value: c.name, label: c.name })) : categories.filter(c => c.en !== "all").map(c => ({ value: c.en, label: c.bn }))).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
        <div className="flex flex-wrap items-center gap-2"><select className={inp+" max-w-40"} value={language} onChange={e=>setLanguage(e.target.value)}><option value="bn">বাংলা</option><option value="en">English</option></select><button type="button" onClick={handleAIWriter} disabled={aiLoading} className="rounded bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{aiLoading ? "AI তৈরি করছে…" : "AI News Writer"}</button></div>
        {aiDraft && <div className="grid gap-3 rounded border border-border bg-gray-50 p-4"><h3 className="font-bold">AI খসড়া — প্রকাশের আগে যাচাই করুন</h3><div className="grid gap-2">{(aiDraft.headlines || []).map((h,i)=><button type="button" key={i} onClick={()=>{set("title",h); if(!id)set("slug",makeSlug(h));}} className="rounded border border-border bg-white p-2 text-left text-sm hover:border-primary">{i+1}. {h}</button>)}</div><button type="button" className="rounded border border-border bg-white px-3 py-2 text-sm" onClick={()=>{const title=aiDraft.bestHeadline || aiDraft.headlines?.[0]; if(title){set("title",title);if(!id)set("slug",makeSlug(title));} if(aiDraft.shortNews)set("content",aiDraft.shortNews); if(aiDraft.summary)set("summary",aiDraft.summary);}}>সেরা শিরোনাম, সংক্ষিপ্ত সংবাদ ও Summary ফর্মে বসান</button><label className="grid gap-1 text-sm">Summary<textarea className={inp} rows={3} value={aiDraft.summary || ""} onChange={e=>setAiDraft({...aiDraft,summary:e.target.value})}/></label></div>}


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
