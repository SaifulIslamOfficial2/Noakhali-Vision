# Noakhali Vision v8 — implementation handover

## Implemented in this working copy
- Added staff account passwords (scrypt hash + salt), staff login through the existing `/api/auth/login`, password reset via the staff editor, and permission arrays stored on staff records.
- Added server-side permission checks for news create/edit/delete, comment moderation, and category management. Main admin access remains supported.
- Added comment edit/delete controls for signed-in admin/moderator users.
- Added dynamic categories API and an admin News Categories page. Existing news records are retained; category rename updates matching article labels, and deleting a category with assigned articles is blocked.
- Added server-side AI News Writer endpoint (`/api/ai/news-writer`) and review UI with 3 headline choices, summary, and short-news draft. It never auto-publishes. The API key is read only on the server.
- Added public author profile endpoint and profile page. New articles are attributed to the staff member or Noakhali Vision Desk; legacy desk articles are included in the desk profile fallback.
- Added optional `OPENAI_API_KEY` and `OPENAI_MODEL` entries to `.env.example`.

## Environment setup
- Set `OPENAI_API_KEY` in Vercel project environment variables to enable AI News Writer; do not prefix it with `VITE_`.
- `OPENAI_MODEL` is optional; defaults to `gpt-4o-mini`.
- New staff accounts require passwords of at least 8 characters. Existing staff records without a password must have one set by the admin in Editorial Staff & Roles.

## Important verification note
- `node --check api/_lib/routes.js` passes.
- A production build and existing tests could not be completed in this environment because `npm ci` did not finish installing dependencies; `vite` and `mongodb` were missing from the partial `node_modules`. Run `npm ci`, `npm run build`, `npm run test:api`, and `npm run test:seo` in a normal Node 22 environment before deploying.
- No live database was connected or changed by this work. The new `categories` collection is created lazily by MongoDB on first insert; no destructive migration is required.

## Suggested next steps
1. Install dependencies and run build/tests.
2. Test staff login with a non-admin account, including a denied API request for a missing permission.
3. Configure `OPENAI_API_KEY` and test Bangla and English drafts against source text; review facts before publishing.
4. Verify comment moderation, category rename/delete safeguards, and public author profiles on staging.
5. Deploy only after successful staging checks and keep the original ZIP as a backup.


## Follow-up fixes in this delivery
- Staff sign-in now accepts legacy staff records whose `status` field was never set, while still blocking explicitly inactive accounts; email matching is case-insensitive.
- Gallery uploads are center-cropped and encoded to the exact 1200 × 1500 (4:5) photocard canvas before upload. Gallery previews and public gallery tiles use the same ratio.
- Article pages clearly label the generated summary as “AI Summary” / “AI সারসংক্ষেপ”.
- Public article data is briefly cached in-memory and article details are prefetched on story hover/touch to reduce perceived navigation delay.
- Homepage carousel uses a 4:5 portrait card on mobile, keeps a landscape spotlight on desktop, and uses high-contrast visible navigation arrows. The mobile news lead image also uses the 4:5 editorial ratio.
- Homepage hero headline, description, and calls to action now follow the selected Bangla/English language.

## Verification status
- `node --check api/_lib/routes.js` passed.
- Dependency installation (`npm ci`) did not complete before the environment timeout, so a Vite production build and full test suite could not be run here. Run `npm ci`, `npm run build`, `npm run test:api`, and `npm run test:seo` locally before deploying.


## 2026-11-07 — Full-frame photocard + newsroom author profiles

- Main news image and additional gallery uploads are fitted onto a 1200×1500 (4:5) canvas with neutral padding when source aspect ratio differs; no center-crop is performed.
- News thumbnails, Homepage carousel, editorial cards, listing thumbnails, article gallery, related stories, and admin news thumbnails now use contain/full-frame rendering.
- Homepage editorial lead changed from a full-bleed cropped background to a split editorial feature: full 4:5 image on the left and headline/summary on the right (stacks on mobile).
- Editorial Staff profiles now support a circular avatar (upload or hosted image URL) and short bio.
- News Editor now lets the publisher select an active staff author; otherwise the logged-in staff member or newsroom desk is used.
- Published articles store author name/avatar and article bylines link to a profile page; author profile endpoint now exposes only public profile fields. Staff profile edits propagate updated name/avatar to their articles.
- Static syntax checks passed for API route and Node entry files. Full Vite production build/browser test could not be run because project dependencies are not installed and the offline npm cache does not contain all packages.

## Rich text news body (bold / italic / inline images)
- `src/admin/RichTextEditor.jsx` — editor toolbar (B, I, U, H2, H3, quote, lists, link, image, clear, undo/redo). Used in `NewsEditor.jsx` instead of the old textarea.
- `src/utils/richText.js` — shared whitelist sanitizer (`sanitizeHtml`, `renderContent`, `stripHtml`, `toHtml`). Used by the editor, `Details.jsx` and the API.
- `POST /api/news-media` — uploads a picture for the news body (stored in `newsImages`, served at `/api/media/newsImages/<id>/image`).
- `POST/PUT /api/news` sanitize `content` server-side (`cleanContent`). Old plain-text news is untouched and shown as paragraphs.
- CSS: `.nv-prose` (article body) and `.nv-rte*` (editor) at the end of `src/index.css`.
- Not done yet: deleting orphaned inline images when a story is deleted; image captions.

## Search overlay
- `src/components/SearchModal.jsx` (opened from Navbar search button, `/` or Ctrl/Cmd+K). Recent searches in localStorage (`nv_recent_searches`), Trending = most-viewed published stories (`/news?sort=views&limit=5`), live results while typing, arrow keys + Enter + Esc. Texts: `extra[lang].searchModal` in `translations.js`.

## Category page, Navbar Menu, Website Sections
- `/category/:slug` → `src/pages/CategoryPage.jsx` (label, big title, area tabs, "Read by month", 4-column grid, load more). `slug` can be the category slug or its name. Article kicker links here.
- `src/components/StoryTile.jsx` (editorial card), `SectionBlock.jsx` (renders one designed section; also the admin live preview), `HomeSections.jsx` (all visible sections on the home page, after the top-stories block).
- API (`api/_lib/routes.js`): `/nav-items` and `/sections` — public GET (visible only, sorted by `order`), `?all=1` for managers; POST/PUT/DELETE need `navigation.manage` / `sections.manage` (admin has all). Fields are validated and clamped server-side (`cleanNavItem`, `cleanSection`).
- Admin: `/admin/navigation` (Navbar Menu), `/admin/sections` (Website Sections). New staff permissions: `navigation.manage`, `sections.manage`.
- NEW tag: shown for `badgeDays` days after creation (`.nv-nav-new` in the navbar, small red tag above the section label).
- `SubmitConfirm.jsx`: global OK/Cancel popup for every form submit (admin wording: "সংরক্ষণ করতে চান?").
- Custom navbar items are appended after the built-in links (desktop + mobile); public GETs are CDN-cached ~20s.


## 2026-11-12 — Image sizes everywhere + summary on news page
- Main image = 1200×1500 (4:5) in every listing/card/hero (NewsPage hero + side + grid, StoryTile, section blocks, category page, related cards, author page, admin thumbs). Never cropped (object-contain).
- Gallery images = 1280×720 (16:9): upload canvas (`src/utils/api.js`), admin previews, article gallery.
- Home sections ignore the old ratio option; main image is always 4:5.
- News page hero shows the AI/editor-written `summary` (falls back to the first words of the story).
- Only syntax-checked with esbuild here; run `npm ci && npm run build && npm run test:api`.

## 2026-11-12 (2) — AI summary, smaller titles, bigger category tabs
- `api/_lib/ai.js` `generateSummary()`: when a story is saved (POST/PUT /api/news) with an empty Summary and `OPENAI_API_KEY` is set, a 2–3 sentence summary is written and stored with `summaryAi: true`. Fail-soft (story always saves). Manual summaries clear the flag.
- News page hero and article "Quick read" box show an "AI Summary / AI সারসংক্ষেপ" tag only when `summaryAi` is true.
- `npm run backfill:summaries -- --dry-run` / `npm run backfill:summaries` fills old stories that have no summary. Tests: `npm run test:ai` (10).
- News titles smaller with tighter line height (news page hero + cards, StoryTile); category tabs slightly larger.

## 2026-11-12 (3) — One typeface: Hind Siliguri
- Every `font-family` (CSS, Tailwind config, inline styles) is now Hind Siliguri; Inter, Newsreader, Noto Serif Bengali, Kalpurush and IBM Plex Mono are no longer used or loaded (`index.html` loads only Hind Siliguri 400/500/600/700).
- Hind Siliguri has no weight above 700: all 800/900/950 weights and Tailwind `font-extrabold`/`font-black` now render as 700. Body text 400, small labels 500–600, headlines 700.
- Fake italics removed (quick-read lead, blockquotes); negative letter-spacing on headlines set to 0 so Bangla conjuncts are not squeezed.

## 2026-11-12 (4) — Picture padding, sidebar, tabs, related cards
- New `src/components/FramedImage.jsx`: shows the picture whole inside its frame and fills leftover space with a blurred copy of the same picture (no flat beige/grey bars). Used by NewsPage (hero, grid, sidebar), StoryTile, NewsCard, related cards and the article gallery. Pictures that already have the frame's exact shape skip the blurred copy.
- Upload canvas (`fileToDataUrl`): when a photo's shape differs from 1200×1500 / 1280×720, the leftover space is a blurred copy of the photo instead of a flat colour.
- News page "More today" is now compact rows (88px 4:5 thumbnail + headline) so the right column no longer makes the page very tall.
- Category tabs fade at the right edge and the selected tab scrolls into view; related-story cards are three equal columns (equal picture heights); article body line height 2.1 → 1.9.

## 2026-11-12 (5) — Article lead
- Article main image: frame hugs the picture with a 3px border (no side bands, no blurred background); the AI summary box sits directly under the picture, same width.
- Box shows only a saved summary: "✦ AI সারসংক্ষেপ" when `summaryAi` is true, plain "সারসংক্ষেপ" when an editor wrote it, nothing when empty (the old "দ্রুত পড়ুন" extractive box and its helpers are removed).
- Gallery thumbnails are never cropped (16:9 box, picture shown whole; lightbox object-contain).


## 2026-11-14 — Admin panel audit and fixes
Frontend (`src/admin`, `src/App.jsx`):
- New `src/admin/session.js`: reads the session, drops an expired token, `hasPermission()`. `Protected` in `App.jsx` now takes `adminOnly` / `perm`: staff are sent to the dashboard instead of seeing a page that only shows 403 errors. `/admin` redirects to the dashboard when already signed in.
- Dashboard: news list is paged (20 at a time, "আরও দেখান"), status filter, search, View-on-website link, visible error + retry, delete errors shown in the dialog. Before, only the first 50 stories could ever be reached and failures were silent.
- News editor: a new story always starts with a category that exists in the list (the old default could be missing, so the dropdown showed one category while another was saved); existing stories keep their category even if it is no longer listed; load errors are shown; saved gallery pictures can now be removed ("✕ সরান").
- Staff can change their own password (menu item "Change Password" is now visible to staff).
- Categories page: the 4 built-in categories are no longer hidden; slug hint for Bangla names; empty state.
- Inbox: removed the "frontend demo" wording, no list flicker on open, errors on "Mark read" are shown.
- Ads / Companies / Premium Members: load and delete failures are shown (no more silent failures or `alert()`); Ad link is checked (http(s) or `/path` only); broken ad thumbnails fall back to the logo.

API (`api/_lib/routes.js`):
- `PUT /auth/change-password` works for staff (verifies the staff password, issues a fresh token).
- `PUT /news/:id` accepts `galleryRemove` (JSON list of indexes) to delete saved gallery pictures; new pictures are still appended.
- Built-in categories are stored as real records once (flag `settings/categoriesSeeded`) the first time an admin opens categories or adds one; before, adding the first custom category made স্থানীয়/রাজনীতি/খেলাধুলা/শিক্ষা vanish from the API.
- Ads: `link` must start with `https://`, `http://` or `/` (it is rendered as an `href`).

Verification here: `npm run test:api` 227 passed (22 new), seo 13, cloudinary 17, ai 11, newsletter 38. All JSX files parse and the app bundles with esbuild (imports resolve). `vite build` and a browser test could NOT be run here (offline, dependencies could not be installed) — run `npm ci && npm run build` before deploying.

## 2026-11-14 — Author page + category page restyle
- `AuthorProfile.jsx` rewritten: AUTHOR label, big name, bio, "N category · N category" line, divider, then all of the author's stories in a 3-column grid (16:10 cards: category • date • N min read, bold title). Load more after 12.
- `CategoryPage.jsx`: same card style, 3 columns, story count line under the title.
- `StoryTile.jsx`: new `fit` prop ("cover" for these two pages; default stays "contain").

## 2026-11-14 — 3:1 images, article page like Gridlove
- Every news main image is now 1200×633 (about 1.9:1). Upload (`src/utils/api.js`) scales to cover and centre-crops, never stretches. Cards, hero poster, related, category/author tiles use the same ratio with `object-fit: cover`.
- Article page: the picture shows only in the top band (no second copy inside the white card).
- Article sidebar: Topics = 5 categories with story-count circles; Recent posts = newest stories with working ‹ › arrows (also fixed on the News page).
- Only syntax-checked with esbuild here; run `npm ci && npm run build`.
- AI Summary box (Details.jsx `AISummary`): when it scrolls into view it shows "Thinking" dots + shimmer, then streams the summary word by word with a caret (like an AI answering live). Animated gradient bar/background/glow in gridlove.css (`.nva-ai*`). Respects prefers-reduced-motion.
- Titles smaller (cards 15.5–16px, article 20–26px, line-height ~1.3). Flat white cards replaced by soft mint/sky/lavender/peach gradients (`--gl-mint/sky/lav/peach` at the end of gridlove.css); Election Spotlight has its own stronger gradient. "This week's hottest" removed from Home.
