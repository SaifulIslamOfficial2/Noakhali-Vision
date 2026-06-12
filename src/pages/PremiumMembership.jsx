import { Award, BadgeCheck, Clipboard, Eye, Facebook, FileText, IdCard, Search, Send, ShieldCheck, Star, Upload, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { imageUrl } from "../utils/api";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";

const bkash = "01863184444";
const fee   = "৳ ৫০০";

const benefits = {
  bn: [
    ["পাবলিক প্রিমিয়াম মেম্বার প্রোফাইল", Users],
    ["প্রিমিয়াম মেম্বার ব্যাজ", BadgeCheck],
    ["প্রফেশনাল ডিজিটাল মেম্বারশিপ কার্ড", IdCard],
    ["ওয়েবসাইটে প্রোফাইল তালিকা", Search],
    ["অগ্রাধিকার ভিত্তিক নিউজ প্রকাশ", Zap],
    ["বছরে সর্বোচ্চ ১২টি নিউজ প্রকাশ", FileText],
    ["দ্রুত সম্পাদকীয় পর্যালোচনা", ShieldCheck],
    ["প্রিমিয়াম মেম্বার স্বীকৃতি", Award],
    ["সার্চযোগ্য মেম্বার প্রোফাইল", Search],
    ["ফিচার্ড মেম্বার ডিরেক্টরি তালিকা", Star],
  ],
  en: [
    ["Public Premium Member Profile", Users],
    ["Premium Member Badge", BadgeCheck],
    ["Professional Digital Membership Card", IdCard],
    ["Profile Listed On Website", Search],
    ["Priority News Publishing", Zap],
    ["Up To 12 News Publications Per Year", FileText],
    ["Faster Editorial Review", ShieldCheck],
    ["Premium Member Recognition", Award],
    ["Searchable Member Profile", Search],
    ["Featured Member Directory Listing", Star],
  ],
};

const fields = {
  bn: [
    ["name",              "পুরো নাম"],
    ["facebookUrl",       "ফেসবুক প্রোফাইল লিংক"],
    ["phone",             "মোবাইল নম্বর"],
    ["email",             "ইমেইল ঠিকানা"],
    ["address",           "ঠিকানা"],
    ["bio",               "সংক্ষিপ্ত পরিচিতি"],
    ["bkashSenderNumber", "বিকাশ প্রেরকের নম্বর"],
    ["transactionId",     "বিকাশ ট্রানজেকশন আইডি"],
  ],
  en: [
    ["name",              "Full Name"],
    ["facebookUrl",       "Facebook Profile URL"],
    ["phone",             "Mobile Number"],
    ["email",             "Email Address"],
    ["address",           "Address"],
    ["bio",               "Short Bio"],
    ["bkashSenderNumber", "bKash Sender Number"],
    ["transactionId",     "bKash Transaction ID"],
  ],
};

const t = {
  bn: {
    seoTitle: "প্রিমিয়াম মেম্বার | নোয়াখালী ভিশন",
    badge: "প্রিমিয়াম মেম্বার",
    heading: "নোয়াখালী ভিশন প্রিমিয়াম মেম্বার হন",
    sub: "নোয়াখালী ভিশন প্রিমিয়াম মেম্বারশিপে যোগ দিন এবং এক্সক্লুসিভ সুবিধা, অগ্রাধিকার নিউজ প্রকাশ, পাবলিক প্রোফাইল তালিকা এবং প্রফেশনাল ডিজিটাল মেম্বারশিপ কার্ড উপভোগ করুন।",
    payLabel: "পেমেন্ট পদ্ধতি: বিকাশ",
    feeLabel: "মেম্বারশিপ ফি",
    copyBtn: "নম্বর কপি করুন",
    step1: "ধাপ ১",
    step1t: `বিকাশ পার্সোনাল নম্বরে ${fee} মেম্বারশিপ ফি পাঠান: ${bkash}`,
    step2: "ধাপ ২",
    step2t: "পেমেন্টের পর স্ক্রিনশট নিন।",
    step3: "ধাপ ৩",
    step3t: "প্রিমিয়াম মেম্বার ফর্ম পূরণ করুন।",
    benHeading: "সুবিধাসমূহ",
    formHeading: "প্রিমিয়াম মেম্বার ফর্ম",
    photoLabel: "প্রোফাইল ছবি",
    payScreenshot: "পেমেন্ট স্ক্রিনশট আপলোড",
    submitBtn: "জমা দিন",
    submitting: "জমা হচ্ছে...",
    successMsg: "নিবন্ধন সফলভাবে জমা হয়েছে। আপনার পেমেন্ট যাচাইয়ের পর মেম্বারশিপ সক্রিয় হবে।",
    errorMsg: "এই মুহূর্তে ফর্ম জমা দিতে সমস্যা হচ্ছে।",
    browseDir: "প্রিমিয়াম ডিরেক্টরি দেখুন",
    membersBannerTitle: "আমাদের প্রিমিয়াম সদস্যরা",
    membersBannerSub: "নোয়াখালী ভিশনের বিশেষ সম্মানিত সদস্যবৃন্দ",
    viewAll: "সকল সদস্য দেখুন",
    viewProfile: "প্রোফাইল দেখুন",
  },
  en: {
    seoTitle: "Premium Member | Noakhali Vision",
    badge: "Premium Member",
    heading: "Become a Noakhali Vision Premium Member",
    sub: "Join Noakhali Vision Premium Membership and enjoy exclusive benefits, priority news publishing, public profile listing and a professional digital membership card.",
    payLabel: "Payment Method: bKash",
    feeLabel: "Membership Fee",
    copyBtn: "Copy Number",
    step1: "Step 1",
    step1t: `Send ${fee} membership fee using bKash to: ${bkash}`,
    step2: "Step 2",
    step2t: "Take a screenshot after payment.",
    step3: "Step 3",
    step3t: "Fill the Premium Member Form.",
    benHeading: "Benefits",
    formHeading: "Premium Member Form",
    photoLabel: "Profile Photo",
    payScreenshot: "Payment Screenshot Upload",
    submitBtn: "Submit",
    submitting: "Submitting...",
    successMsg: "Registration submitted successfully. Your membership request is pending payment verification.",
    errorMsg: "Unable to submit the premium member form right now.",
    browseDir: "Browse Premium Directory",
    membersBannerTitle: "Our Premium Members",
    membersBannerSub: "Honoured members of Noakhali Vision",
    viewAll: "View All Members",
    viewProfile: "View Profile",
  },
};

export default function PremiumMembership() {
  const { lang } = useLang();
  const tx = t[lang];
  const [msg, setMsg]         = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [members, setMembers] = useState([]);
  setSEO({ title: tx.seoTitle });

  useEffect(() => {
    api.get("/premium/members")
      .then(r => setMembers((r.data.members || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const submit = async e => {
    e.preventDefault(); setLoading(true); setMsg("");
    try {
      const data = new FormData(e.currentTarget);
      const r = await api.post("/premium/members", data);
      setCreated(r.data.member);
      setMsg(tx.successMsg);
      e.currentTarget.reset();
    } catch (err) {
      setMsg(err.response?.data?.message || tx.errorMsg);
    } finally { setLoading(false); }
  };

  return (
    <section className="bg-white">

      {/* ── Members Banner ── */}
      {members.length > 0 && (
        <div className="bg-[#EF152B] py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-3 sm:px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <p className="text-white/70 text-sm font-bold uppercase tracking-widest">{tx.membersBannerSub}</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">{tx.membersBannerTitle}</h2>
              </div>
              <Link
                to="/premium-members"
                className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-black text-[#EF152B]">
                {tx.viewAll} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {members.map(m => (
                <Link
                  key={m.memberId}
                  to={`/member/${m.memberId}`}
                  className="group bg-white/10 hover:bg-white/20 transition-colors p-3 sm:p-4 flex flex-col items-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/40 mb-3">
                    <img
                      src={imageUrl(m.photo)}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = "/logo.svg"; }}
                    />
                  </div>
                  <p className="text-white font-black text-sm sm:text-base line-clamp-1 w-full">{m.name}</p>
                  <p className="text-white/60 text-xs font-bold mt-0.5">{m.memberId}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-white/80 text-xs font-bold group-hover:text-white transition-colors">
                    <Eye size={12} /> {tx.viewProfile}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-8 sm:py-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">

        {/* Left — Info */}
        <div>
          <p className="inline-flex items-center gap-2 border border-primary px-3 py-2 text-sm font-black uppercase text-primary">
            <BadgeCheck size={18} /> {tx.badge}
          </p>
          <h1 className="mt-4 sm:mt-5 text-3xl sm:text-5xl lg:text-6xl font-black leading-tight">
            {tx.heading}
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted">{tx.sub}</p>

          {/* bKash Box */}
          <div className="mt-6 sm:mt-8 border border-border bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-secondary">{tx.payLabel}</p>
                <p className="mt-2 text-3xl sm:text-4xl font-black text-primary">{bkash}</p>
                <p className="mt-1 text-base font-black text-secondary">{tx.feeLabel}: {fee}</p>
              </div>
              <button type="button"
                onClick={() => navigator.clipboard?.writeText(bkash)}
                className="inline-flex items-center gap-2 bg-primary px-4 sm:px-5 py-3 font-black text-white text-sm">
                <Clipboard size={18} />{tx.copyBtn}
              </button>
            </div>
            <div className="mt-5 sm:mt-6 grid gap-3 text-sm font-semibold text-ink sm:grid-cols-3">
              <p><b className="block text-primary">{tx.step1}</b>{tx.step1t}</p>
              <p><b className="block text-primary">{tx.step2}</b>{tx.step2t}</p>
              <p><b className="block text-primary">{tx.step3}</b>{tx.step3t}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {benefits[lang].map(([label, Icon]) => (
              <div className="border border-border p-4 sm:p-5" key={label}>
                <Icon className="text-primary" size={22} />
                <h3 className="mt-3 font-black text-sm sm:text-base">✓ {label}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <form onSubmit={submit} className="h-fit border border-border bg-white p-4 sm:p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black">{tx.formHeading}</h2>
          <div className="mt-4 sm:mt-5 grid gap-3 sm:gap-4">
            {fields[lang].map(([name, label]) =>
              name === "bio" || name === "address"
                ? <textarea required key={name} name={name} className="min-h-24 border border-border px-4 py-3 focus-ring text-sm w-full resize-none" placeholder={label} />
                : <input required key={name} name={name} type={name === "email" ? "email" : "text"}
                    className="border border-border px-4 py-3 focus-ring text-sm w-full" placeholder={label} />
            )}
            <label className="grid gap-2 border border-border px-4 py-3 text-sm font-bold">
              <span className="flex items-center gap-2"><Upload size={18} />{tx.photoLabel}</span>
              <input required name="photo" type="file" accept="image/*" />
            </label>
            <label className="grid gap-2 border border-border px-4 py-3 text-sm font-bold">
              <span className="flex items-center gap-2"><Upload size={18} />{tx.payScreenshot}</span>
              <input required name="paymentScreenshot" type="file" accept="image/*" />
            </label>
            <button disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 font-black text-white disabled:opacity-60 w-full">
              <Send size={18} />{loading ? tx.submitting : tx.submitBtn}
            </button>
            {msg && <p className="border border-border bg-white p-3 text-sm font-bold text-secondary">{msg}</p>}
            {created && (
              <Link className="inline-flex items-center justify-center gap-2 border border-primary px-5 py-3 font-black text-primary"
                to={`/member/${created.memberId}`}>
                <Facebook size={18} /> {created.memberId}
              </Link>
            )}
            <Link className="text-center text-sm font-black text-primary" to="/premium-members">
              {tx.browseDir}
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
