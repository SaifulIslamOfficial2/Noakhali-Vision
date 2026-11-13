# Noakhali Vision

React + Vite ফ্রন্টএন্ড, সাথে **Vercel Serverless Functions** (`/api`) আর **MongoDB Atlas**।
আলাদা backend server (Railway ইত্যাদি) লাগে না, সব Vercel-এই চলে।

## Deploy (Vercel + Atlas, পুরোটাই free)

1. **MongoDB Atlas**: free M0 cluster বানাও → *Database Access* এ user বানাও → *Network Access* এ `0.0.0.0/0` allow করো → *Connect → Drivers* থেকে connection string কপি করো।
2. কোড GitHub-এ push করো, Vercel-এ import করো (Framework: Vite, বাকি সব default)।
3. Vercel → Project → **Settings → Environment Variables** এ `.env.example`-এর ৪টা variable বসাও:
   `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`। তারপর **Redeploy** দাও।
4. Settings → Domains এ custom domain যোগ করো (Namecheap DNS-এ Vercel যা বলে তা বসাও)।
5. `/admin` এ গিয়ে `ADMIN_EMAIL` ও `ADMIN_PASSWORD` দিয়ে login করো।

`.env.example`-এ `SEED_SAMPLE=false` রাখা আছে, তাই নতুন database-এ কোনো demo news স্বয়ংক্রিয়ভাবে যোগ হবে না। নিজের newsroom-এর সংবাদ Admin থেকে প্রকাশ করো। চাইলে শুধু demo/testing-এর জন্য `SEED_SAMPLE=true` করতে পারো।

## কীভাবে কাজ করে
- Admin যা save করে সেটা MongoDB-তে যায়, তাই **সব ভিজিটর সঙ্গে সঙ্গে দেখতে পায়**।
- Admin API সবসময় server-এ token যাচাই করে। Password ব্রাউজারের কোডে নেই।
- Dashboard → *Change Password* করলে নতুন password hash হয়ে database-এ থাকে (তখন থেকে `ADMIN_PASSWORD` env আর ব্যবহার হয় না) এবং পুরোনো login session বাতিল হয়।
- Public ভিজিটর শুধু Published news, active ads/team/companies আর Active premium member-এর (ফোন/ইমেইল ছাড়া) তথ্য দেখে। Draft বা ব্যক্তিগত তথ্য দেখা যায় না।
- Contact/Partnership message, comment, visitor count, premium member আবেদন, **Election Spotlight আবেদন** আর **Editorial Staff তালিকা** সব database-এ জমা হয়।
- Admin login-এ ভুল password ৮ বার হলে ওই IP ১৫ মিনিট block হয় (database-এ গোনা হয়, তাই সব server instance-এ কাজ করে)।
- Facebook/WhatsApp/Telegram-এ news link share করলে preview-তে শিরোনাম, সারাংশ ও ছবি দেখায় (`api/og.js`)। `/sitemap.xml` নিজে থেকে সব published news নিয়ে তৈরি হয় (`api/sitemap.js`)।
- Custom domain দিলে env-এ `SITE_URL=https://তোমার-domain` বসাও, আর `public/robots.txt`-এর শেষ লাইনে domain ঠিক করো।

## Local development (একটি command-এ Frontend + Backend)
```bash
npm install
cp .env.example .env.local        # Windows PowerShell/CMD: copy .env.example .env.local
# .env.local ফাইলে MongoDB Atlas URI, JWT_SECRET, ADMIN_EMAIL ও ADMIN_PASSWORD-এর আসল মান বসাও
npm run dev
```
এখন ব্রাউজারে http://localhost:5173 খোলো। `npm run dev` একই সঙ্গে API (port 3001) ও Vite frontend (port 5173) চালায়; Ctrl+C দিলে দুটোই বন্ধ হবে।

আলাদাভাবে চালাতে চাইলে দুটি terminal ব্যবহার করো: প্রথমটিতে `npm run dev:api`, দ্বিতীয়টিতে `npm run dev:frontend`। Backend health check: http://localhost:3001/api/health অথবা Vite proxy দিয়ে http://localhost:5173/api/health।

API test (in-memory FakeDb; MongoDB Atlas লাগে না): `npm run test:api`। SEO test: `npm run test:seo`।

## ছবি Cloudinary-তে রাখা (MongoDB হালকা রাখতে)
ডিফল্টে ছবি MongoDB-তে base64 হিসেবে জমা হয়, যা খবর বাড়লে database ভরিয়ে দেয় ও সাইট ধীর করে। Cloudinary চালু করলে নতুন ছবি সরাসরি সেখানে যায়, database-এ শুধু লিংক থাকে।

1. cloudinary.com-এ ফ্রি অ্যাকাউন্ট খুলুন। Dashboard → **Programmable Media → API Keys** থেকে Cloud name, API Key, API Secret নিন।
2. Vercel → Settings → Environment Variables-এ বসান: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (লোকালের জন্য `.env.local`-এও)। তারপর **Redeploy**।
3. এখন থেকে অ্যাডমিন থেকে আপলোড করা খবর/গ্যালারি/বডির ছবি, কোম্পানি, টিম ও বিজ্ঞাপনের ছবি Cloudinary-তে যাবে। আপলোড ব্যর্থ হলে ছবি আগের মতো database-এ সেভ হয় (কাজ হারায় না)।
4. **পুরোনো ছবি সরানো (একবারই):** আগে Atlas-এ ব্যাকআপ/স্ন্যাপশট নিন, তারপর
   ```bash
   npm run migrate:images -- --dry-run   # শুধু দেখায়, কিছু বদলায় না
   npm run migrate:images                # আসল কাজ
   ```
   স্ক্রিপ্টটি আবার চালালেও ক্ষতি নেই (শুধু যে ছবি এখনও base64, সেগুলোই নেয়)। পুরোনো `/api/media/...` লিংক নিজে থেকে Cloudinary-তে redirect হয়, তাই কিছু ভাঙে না।
5. Member/Premium/Election/Career-এর ছবি ইচ্ছা করেই সরানো হয় না (এগুলো ব্যক্তিগত বা অনুমোদন-নির্ভর, Cloudinary-র পাবলিক লিংকে রাখা ঠিক নয়)।

ফেসবুক/WhatsApp শেয়ারে Cloudinary ছবি এখন ১২০০×৬৩০-এ (কাটা ছাড়া) দেখায়। টেস্ট: `npm run test:cloudinary`।

## সীমাবদ্ধতা
- ছবি ছোট করে (সর্বোচ্চ ১১০০px) base64 হিসেবে database-এ থাকে, আর API সেগুলো `/api/media/...` লিংক (browser-এ cache হয়) দিয়ে দেখায়, যাতে তালিকার response ছোট থাকে; Atlas free-তে ৫১২MB। অনেক ছবি হলে Cloudinary-র মতো image hosting নেওয়া ভালো।
- একটা request-এর সর্বোচ্চ সাইজ প্রায় ৪.৫MB (Vercel limit)।
- অনেকক্ষণ কেউ না এলে প্রথম request ১–২ সেকেন্ড ধীর হতে পারে (cold start)।
- "AI Title/Summary" বাটন এখন সাধারণ টেক্সট কেটে কাজ চালায়, আসল AI নয়।
- Push notification (ঘণ্টা আইকন) এখন লুকানো; আসল push service (যেমন OneSignal) যোগ না করা পর্যন্ত চালু করা হয়নি।
- Election আবেদনে অনলাইন পেমেন্ট নেই; ফি আলাদাভাবে নিতে হবে। ছবি ছাড়া অন্য নথি আপলোড হয় না।
- Vercel Hobby plan শুধু non-commercial ব্যবহারের জন্য; সাইটে আয় শুরু হলে Pro plan লাগতে পারে।
