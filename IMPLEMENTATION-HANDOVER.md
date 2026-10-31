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
