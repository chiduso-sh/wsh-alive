# CLAUDE.md: WSH Alive

Handoff file for Claude Code. Drop this in the repo root.

## What this is
**WSH Alive** is a fitness and wellness blog (Next.js) with an **EngageAI** AI chat assistant. It is a portfolio piece by Arinze Chiduso David. Live at https://wsh-alive.vercel.app/ (Vercel, deployed from GitHub).

The assistant can fetch posts, navigate pages and subscribe users through registered function calls.

## Stack
- Next.js 16.2.4 (App Router), React, TypeScript
- Tailwind CSS v4 (`@theme` tokens in `app/globals.css`)
- Markdown posts via `gray-matter` + `next-mdx-remote/rsc` (**v6+ required**; v5 fails the Vercel build on a security check)
- EngageAI (custom client, see below)
- Resend (planned, not wired)

## Commands
```
npm install
npm run dev     # runs `next dev --webpack`. Do NOT switch to Turbopack: the proxy route 404'd under it.
npm run build
```
Invalid flags: `--turbopack=false`, `--no-turbopack`. The working flag is `--webpack`.

## Env vars (`.env.local`, never commit, set in Vercel too; template in `.env.local.example`)
- `ENGAGEAI_API_KEY`: EngageAI API key (`eai_...`), server-only. Never prefix it with `NEXT_PUBLIC_`.
- `ENGAGEAI_APP_ID`: must match the app the key was created for in the EngageAI dashboard. Defaults to `wsh_alive`.
- `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`: for the newsletter (unused so far)

## EngageAI integration (important)
Docs: https://dashboard.engageai.tech/docs. API spec: `https://engageai-sdk-production.up.railway.app/openapi.json` (v0.3.2 as of Nov 2026). The official SDKs are React Native and Flutter only, so the protocol is reimplemented:

- `lib/engageai/manifest.ts`: shared function definitions, categories, nav paths, `buildManifest(appId)`. No secrets.
- `lib/engageai/server.ts` (`server-only`): adds the key and `app_id`, 30 s timeout, registers the manifest **once per server instance**, and re-registers + retries once when EngageAI answers 404 (app not registered).
- `app/api/engageai/route.ts`: the only browser entry point. Accepts `{action: "chat" | "results" | "confirm", session_id, ...}`, validates everything (session id format, 2000-char messages, known function names, 16 KB body), and forwards to a fixed endpoint. The browser cannot pick a URL, `app_id` or manifest. Only status codes are logged, never bodies.
- `lib/engageai/client.ts`: browser client. Handles every action type (`respond`, `clarify`, `function_call`, `confirm`, `error`), sends an `idempotency_key` with results, caps function-call rounds at 4.
- `components/EngageAIChat.tsx`: the chat UI and the function handlers. Session id and messages persist in sessionStorage.

### API quirks (learned the hard way)
- Manifest `description` max **512 chars** (422 otherwise). Every parameter property needs a `description` (422).
- `domain` enum: food_delivery, fintech, ecommerce, transportation, health, social, productivity, entertainment, utilities, other. We send `health`.
- `requires_confirmation: true` makes the model ask in text **and then** send a formal `confirm` action: users confirm twice. So `subscribe_user` is registered without it and the site shows its own Yes/No card inside the handler before anything is submitted. The `confirm` action is still handled in case EngageAI sends one.
- EngageAI sometimes echoes simple function results verbatim (it once produced "opened: /nutrition."), so handlers that change state return a human-readable sentence.
- Post handlers render post cards in the chat and also return the post data, so the model can answer follow-ups. No more "done" suppression or yes/ok regex interception.
- Free tier: 500 credits/month, roughly 10 per text turn. This will not cover real traffic.

### Registered functions
| Function | Purpose |
|---|---|
| `get_all_posts` | List all posts (shown as cards) |
| `get_posts_by_category` | Enum: workouts, nutrition, lifestyle, mindfulness |
| `navigate_to` | Enum of site paths, `router.push` (chat stays open) |
| `subscribe_user` | Asks the visitor to confirm, then POSTs to `/api/subscribe` |

## File map
- `app/layout.tsx`: root layout and metadata. Mounts Navbar, Footer, EngageAIChat.
- `app/globals.css`: Google Fonts `@import` must come **before** `@import "tailwindcss"`. Hand-written `.prose` styles (`@tailwindcss/typography` plugin breaks the build).
- `app/page.tsx`: home (hero, CategoryBar, featured PostCards, newsletter)
- `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`: listing and post (MDX, `generateStaticParams`, `generateMetadata`)
- `app/{workouts,nutrition,lifestyle,mindfulness}/page.tsx`: category pages
- `app/about`, `app/subscribe`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`
- `app/api/engageai/route.ts`: validated action proxy to EngageAI
- `app/api/posts/route.ts`: GET posts, optional `?category=`
- `app/api/subscribe/route.ts`: POST name and email (validates, only `console.log`s)
- `components/`: `EngageAIChat.tsx`, `Navbar.tsx`, `Footer.tsx`, `PostCard.tsx`, `CategoryBar.tsx`, `NewsletterForm.tsx`
- `lib/engageai/`: `manifest.ts`, `server.ts`, `client.ts` (see EngageAI section)
- `lib/posts.ts`: server-only post reader (fs + gray-matter). `lib/posts-client.ts` is unused.
- `content/posts/*.md`: frontmatter `title, excerpt, category, date, readTime`
- `PROJECT_FILES.md`: file-by-file explanation (if present)

## Design tokens
sage `#6B7F5E`, sage-light `#8FA07F`, sage-pale `#EEF2EB`, earth `#A07850`, earth-light `#C4A882`, cream `#F9F6F0`, bark `#3D2E1E`, mist `#D4DDD0`, warm-white `#FDFAF5`.
Fonts: Playfair Display (serif), Jost (sans). Tone: calm, earthy, nature and wellness.

## Known issues / TODO (priority order)
1. **Old EngageAI key is compromised and the account is lost.** It leaked through the old proxy (SSRF via `path`). Email help@engageai.tech to revoke it, create a new account and app, and set `ENGAGEAI_API_KEY` + `ENGAGEAI_APP_ID` locally and in Vercel (delete `NEXT_PUBLIC_ENGAGEAI_KEY` there).
2. Add per-IP rate limiting to `/api/engageai` and `/api/subscribe` (e.g. Upstash). Credits run out fast without it.
3. **Newsletter doesn't send anything.** Wire up Resend in `/api/subscribe` (code is commented out). The CV says "Resend-powered", so either do this or soften the CV line.
4. `app/sitemap.ts` and `app/robots.ts` use base URL `https://wshalive.com`. Change to `https://wsh-alive.vercel.app` (or an env var).
5. Remove unused deps: `@mdx-js/*`, `@next/mdx`, `@tailwindcss/typography`, `rehype-highlight`, `remark-gfm`.
6. Remove unused file `lib/posts-client.ts`.
7. `CategoryBar` counts are hardcoded (24/18/31/12). Compute them from the posts.
8. Only 3 posts exist. Add more, plus cover images.
9. Add the missing `/privacy` and `/contact` pages (linked from the footer).

## Conventions
- Server components by default. Add `"use client"` only for interactivity (hover handlers, hooks). `PostCard` is a client component.
- Use Tailwind utilities and the theme tokens above. Don't hard-code hex values in components.
- Never hard-code API keys.
- After changes, run `npm run build` before pushing, since Vercel builds from GitHub on every push.
- Hot-reload may show "Router action dispatched before initialization". It's harmless, so refresh.
