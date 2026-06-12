export const locations = [
  { en: "Noakhali Sadar", bn: "নোয়াখালী সদর", slug: "noakhali-sadar" },
  { en: "Begumganj",      bn: "বেগমগঞ্জ",      slug: "begumganj" },
  { en: "Chatkhil",       bn: "চাটখিল",         slug: "chatkhil" },
  { en: "Senbagh",        bn: "সেনবাগ",          slug: "senbagh" },
  { en: "Companyganj",    bn: "কোম্পানীগঞ্জ",   slug: "companyganj" },
  { en: "Subarnachar",    bn: "সুবর্ণচর",        slug: "subarnachar" },
  { en: "Kabirhat",       bn: "কবিরহাট",         slug: "kabirhat" },
  { en: "Hatiya",         bn: "হাতিয়া",          slug: "hatiya" },
];

const img = i => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${i%2?720:560}"><rect width="900" height="${i%2?720:560}" fill="#EAEAEA"/><rect x="40" y="40" width="260" height="260" fill="#EF152B"/><path d="M40 40h260v260z" fill="#A71926"/><rect x="350" y="80" width="450" height="50" fill="#111"/><rect x="350" y="170" width="390" height="34" fill="#fff"/></svg>`)}`;

export const sampleNews = [1,2,3,4,5,6].map(i => ({
  title: ["নোয়াখালী সদরে ডিজিটাল সেবা ডেস্ক উদ্বোধন","বেগমগঞ্জ বাজার সড়ক সংস্কারের সময়সূচি","হাতিয়ার জেলেরা বর্ষার প্রস্তুতি নিচ্ছেন","সুবর্ণচরে স্কুলগুলোতে পাঠ ঘণ্টা চালু","কোম্পানীগঞ্জ যুব দল পরিচ্ছন্নতা অভিযান শুরু করেছে","চাটখিলে ক্লিনিকে রোগী সহায়তা বাড়ানো হয়েছে"][i-1],
  slug: ["sadar-digital-service","begumganj-road-repair","hatiya-monsoon-safety","subarnachar-reading-hour","companyganj-clean-drive","chatkhil-patient-support"][i-1],
  location: locations[i % locations.length].bn,
  content: "নোয়াখালী ভিশন থেকে একটি সংক্ষিপ্ত স্থানীয় সংবাদ, দ্রুত পাঠ এবং দৃশ্যমান আবিষ্কারের জন্য লেখা হয়েছে। প্ল্যাটফর্মটি সংক্ষিপ্ত যাচাইকৃত আপডেট, অবস্থান-ভিত্তিক প্রতিবেদন এবং নোয়াখালী জুড়ে পাঠকদের জন্য একটি পরিষ্কার পাঠক অভিজ্ঞতার উপর দৃষ্টি নিবদ্ধ করে।",
  status: "published",
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  author: "নোয়াখালী ভিশন ডেস্ক",
  image: img(i),
}));

export const categories = [
  { bn: "সব", en: "all" },
  { bn: "রাজনীতি", en: "রাজনীতি" },
  { bn: "খেলাধুলা", en: "খেলাধুলা" },
  { bn: "ব্যবসা", en: "ব্যবসা" },
  { bn: "শিক্ষা", en: "শিক্ষা" },
  { bn: "স্বাস্থ্য", en: "স্বাস্থ্য" },
  { bn: "বিনোদন", en: "বিনোদন" },
  { bn: "আন্তর্জাতিক", en: "আন্তর্জাতিক" },
  { bn: "স্থানীয়", en: "স্থানীয়" },
  { bn: "প্রযুক্তি", en: "প্রযুক্তি" },
  { bn: "অর্থনীতি", en: "অর্থনীতি" },
];
