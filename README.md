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

প্রথম request-এ database খালি থাকলে কয়েকটা নমুনা সংবাদ ও site settings নিজে তৈরি হয়। এগুলো Admin থেকে মুছে নিজের news দিতে পারো। নমুনা news একদমই না চাইলে প্রথম deploy-এর আগে env-এ `SEED_SAMPLE=false` দাও।

## কীভাবে কাজ করে
- Admin যা save করে সেটা MongoDB-তে যায়, তাই **সব ভিজিটর সঙ্গে সঙ্গে দেখতে পায়**।
- Admin API সবসময় server-এ token যাচাই করে। Password ব্রাউজারের কোডে নেই।
- Dashboard → *Change Password* করলে নতুন password hash হয়ে database-এ থাকে (তখন থেকে `ADMIN_PASSWORD` env আর ব্যবহার হয় না) এবং পুরোনো login session বাতিল হয়।
- Public ভিজিটর শুধু Published news, active ads/team/companies আর Active premium member-এর (ফোন/ইমেইল ছাড়া) তথ্য দেখে। Draft বা ব্যক্তিগত তথ্য দেখা যায় না।
- Contact/Partnership message, comment, visitor count, premium member আবেদন, **Election Spotlight আবেদন** আর **Editorial Staff তালিকা** সব database-এ জমা হয়।
- Admin login-এ ভুল password ৮ বার হলে ওই IP ১৫ মিনিট block হয় (database-এ গোনা হয়, তাই সব server instance-এ কাজ করে)।
- Facebook/WhatsApp/Telegram-এ news link share করলে preview-তে শিরোনাম, সারাংশ ও ছবি দেখায় (`api/og.js`)। `/sitemap.xml` নিজে থেকে সব published news নিয়ে তৈরি হয় (`api/sitemap.js`)।
- Custom domain দিলে env-এ `SITE_URL=https://তোমার-domain` বসাও, আর `public/robots.txt`-এর শেষ লাইনে domain ঠিক করো।

## Local development (দুইটা terminal লাগবে)
```bash
npm install
cp .env.example .env.local        # Windows-এ: copy .env.example .env.local, তারপর ভেতরের মানগুলো বসাও

# Terminal 1 (backend, port 3001)
npm run dev:api

# Terminal 2 (frontend, port 5173)
npm run dev
```
ব্রাউজারে http://localhost:5173 খোলো। `/api` অটোমেটিক localhost:3001-এ চলে যায়, তাই দুটো একসাথে কাজ করে।
API টেস্ট (in-memory database দিয়ে, Atlas লাগে না):
`JWT_SECRET=testsecret-testsecret-1234 ADMIN_PASSWORD='Str0ng!Pass' npm run test:api` এবং `npm run test:seo`

## সীমাবদ্ধতা
- ছবি ছোট করে (সর্বোচ্চ ১১০০px) base64 হিসেবে database-এ থাকে, আর API সেগুলো `/api/media/...` লিংক (browser-এ cache হয়) দিয়ে দেখায়, যাতে তালিকার response ছোট থাকে; Atlas free-তে ৫১২MB। অনেক ছবি হলে Cloudinary-র মতো image hosting নেওয়া ভালো।
- একটা request-এর সর্বোচ্চ সাইজ প্রায় ৪.৫MB (Vercel limit)।
- অনেকক্ষণ কেউ না এলে প্রথম request ১–২ সেকেন্ড ধীর হতে পারে (cold start)।
- "AI Title/Summary" বাটন এখন সাধারণ টেক্সট কেটে কাজ চালায়, আসল AI নয়।
- Push notification (ঘণ্টা আইকন) এখন লুকানো; আসল push service (যেমন OneSignal) যোগ না করা পর্যন্ত চালু করা হয়নি।
- Election আবেদনে অনলাইন পেমেন্ট নেই; ফি আলাদাভাবে নিতে হবে। ছবি ছাড়া অন্য নথি আপলোড হয় না।
- Vercel Hobby plan শুধু non-commercial ব্যবহারের জন্য; সাইটে আয় শুরু হলে Pro plan লাগতে পারে।
