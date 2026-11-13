/* Central category labels.
   Categories are stored in the database by their Bangla name (news.category), and that stored value is also
   what the API filters on — so it is never changed. This file only decides how a category is DISPLAYED:
   Bangla mode shows the stored name, English mode shows the matching English label below.
   A category created in the admin panel that is not listed here simply keeps its Bangla name in English mode. */

const EN = {
  "জাতীয়": "National",
  "আন্তর্জাতিক": "International",
  "রাজনীতি": "Politics",
  "অর্থনীতি": "Economy",
  "ব্যবসা": "Business",
  "ব্যবসা-বাণিজ্য": "Business",
  "খেলাধুলা": "Sports",
  "খেলা": "Sports",
  "শিক্ষা": "Education",
  "প্রযুক্তি": "Technology",
  "বিনোদন": "Entertainment",
  "ধর্ম ও ইসলাম": "Religion & Islam",
  "ধর্ম": "Religion",
  "অপরাধ": "Crime",
  "দুর্ঘটনা": "Accidents",
  "স্বাস্থ্য": "Health",
  "কৃষি": "Agriculture",
  "চাকরি": "Jobs",
  "চাকুরি": "Jobs",
  "আবহাওয়া": "Weather",
  "প্রবাস": "Expatriates",
  "আইন ও আদালত": "Law & Courts",
  "আইন-আদালত": "Law & Courts",
  "মতামত": "Opinion",
  "অনুসন্ধানী প্রতিবেদন": "Investigative Reports",
  "যোগাযোগ": "Contact",
  "স্থানীয়": "Local",
  "সংবাদ": "News",
  "সর্বশেষ সংবাদ": "Latest News",
  "সব সংবাদ": "All News",
  "সব": "All",
  "সারাদেশ": "Countrywide",
  "লাইফস্টাইল": "Lifestyle",
  "ফিচার": "Features",
  "সাহিত্য": "Literature",
  "পরিবেশ": "Environment",
  "ছবি": "Photos",
  "ভিডিও": "Videos",
};

/* Normalise so "ব্যবসা - বাণিজ্য" / extra spaces still match */
const norm = (s) => String(s || "").trim().replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");
const TABLE = new Map(Object.entries(EN).map(([k, v]) => [norm(k), v]));
const BN_FOR_EN = new Map(Object.entries(EN).map(([k, v]) => [v.toLowerCase(), k]));

/** Display label for a stored category name. */
export function categoryLabel(name, lang, fallback) {
  if (!name) return fallback || (lang === "bn" ? "সংবাদ" : "News");
  if (name === "all") return lang === "bn" ? "সব সংবাদ" : "All News";
  if (lang !== "en") return BN_FOR_EN.get(String(name).toLowerCase()) || name; // English value stored → show Bangla
  return TABLE.get(norm(name)) || name;
}
