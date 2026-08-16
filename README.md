# LIGHT — Web3 Developer & Builder Portfolio.   

Live-https://light-portfolio-smoky.vercel.app/

A premium, dark, single-page portfolio built with **React + TypeScript + Vite**,
backed by a **Fastify + PostgreSQL + Prisma** API and an `/admin` dashboard —
so every piece of content (projects, services, tech stack, site settings) is
managed from the browser, and visitor messages come in through a real
contact form.

The public site at `/` and `/admin` are the same app; `/admin` is just the
authenticated section, reachable once the backend (see below) is running.
Everything the public site shows — services, projects, tech stack, name,
title, bio, social links — now comes from the API rather than source files.

## Run the frontend locally

```bash
npm install
cp .env.example .env   # points the admin app at your local API
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).
Visiting `/admin` without the backend running will redirect you to
`/admin/login`, which will show a "couldn't reach the server" error on
submit — that's expected until the backend (below) is up. The public site
at `/` also needs the backend running, since its content now comes from
the API rather than static files.

To produce a production build:

```bash
npm run build
npm run preview   # serve the built dist/ folder locally
```

## Backend + admin dashboard

The API lives in `backend/` as a separate Node project. See
`backend/README.md` for setup, environment variables, and how to run
migrations and the seed script. Current status: **Phase 5 — services,
technologies, messages, and settings management, plus the public site
reading everything from the API.**

What works end-to-end right now:
- `/admin/login` — real login against the backend, sets a secure httpOnly
  session cookie.
- `/admin` — dashboard shell with a responsive sidebar (drawer on mobile)
  and stat cards for projects/services/technologies/messages.
- Session persistence (refreshing `/admin` doesn't log you out) and
  logout.
- `/admin/projects` — full project management: search, category filter,
  status filter, sort, pagination, delete (with confirmation), and
  toast feedback on every action. Create/edit includes image upload with
  preview and a technologies tag input.
- `/admin/services`, `/admin/technologies` — full management: create,
  edit, delete, all wired to real API calls.
- `/admin/messages` — an inbox for contact-form submissions: filter by
  read/unread, expand a row to read the full message, mark read/unread,
  reply by email, delete.
- `/admin/settings` — edit name, title, bio, profile image, contact email,
  and social links (Telegram, X, GitHub, LinkedIn) shown on the live site.
- The public site (`/`) reads its Services, Projects, and Tech Stack
  sections from the API, and the Hero section's name/title from Settings.
  Project cards show a real uploaded image when one's set on the project,
  falling back to the placeholder otherwise.
- The public Contact section has a real form (name, email, optional
  subject, message) that submits to the same `Message` rows shown in
  `/admin/messages` — with rate-limiting and a honeypot field against spam.

What's not wired up yet, by choice rather than oversight:
- `src/data/site.ts` (nav links, and the Telegram/X links used in the Hero
  and Contact quick-actions) stays static — there's no natural DB field for
  nav structure, and the seeded social URLs already match it exactly.
- The About section's copy is still hand-written in `About.tsx` rather than
  driven by Settings' `bio` field — it's several paragraphs of specific
  copy, not a single bio blurb. `bio` is still saved and available via the
  API for a future pass.
- Project videos (`videoUrl`) aren't rendered on the public site yet, only
  images — the admin form already collects the URL, ready for that later.

## Project structure

```text
src/
├── components/       # public-site sections, each with its .tsx and .css
│   ├── Navbar
│   ├── Hero            (name/title from Settings; includes NodeField + TerminalCard)
│   ├── About
│   ├── Services         (fetches from the API)
│   ├── Projects         (fetches from the API; renders uploaded images)
│   ├── TechStack        (fetches from the API, grouped by category)
│   ├── Contact          (real contact form, posts to the API)
│   ├── Footer
│   └── ScrollReveal     # shared scroll-in-view animation wrapper
├── pages/
│   └── PortfolioPage.tsx  # the public site, rendered at "/"
├── admin/                 # everything under /admin
│   ├── AdminApp.tsx         # route tree: /login public, rest protected
│   ├── context/
│   │   └── AdminAuthContext.tsx  # session state, login/logout, /auth/me on load
│   ├── hooks/
│   │   └── useAdminResource.ts   # shared loading/error/data fetch hook
│   ├── components/          # AdminLayout (sidebar+topbar), ProtectedRoute,
│   │                           StatCard, StatusBadge, AsyncStates, ComingSoon,
│   │                           ConfirmDialog, ToastProvider, TagInput, ImageUploadField…
│   └── pages/                # LoginPage, DashboardPage, *ListPage, *FormPage, SettingsPage…
├── lib/
│   └── api/                 # typed fetch wrappers — client.ts, auth.ts, uploads.ts,
│                               projects.ts, services.ts, technologies.ts, messages.ts,
│                               settings.ts
├── data/
│   └── site.ts          # nav links + the static Telegram/X quick-action links
├── hooks/
├── assets/
│   ├── images/          # drop real project screenshots here
│   └── videos/          # drop real preview clips here
├── App.tsx            # top-level route switch: "/" vs "/admin/*"
├── main.tsx
└── index.css           # design tokens (color, type, spacing) + global styles
```

## Managing content

Everything the public site shows now lives in the database, edited from
`/admin`:

- **Projects** — `/admin/projects`. Title, description, category, image
  upload, live/GitHub links, technologies, published/draft, sort order.
- **Services** ("What I Build") — `/admin/services`. Title, description,
  icon, featured flag, sort order.
- **Technologies** (tech-stack section) — `/admin/technologies`. Name,
  category (free text — the public site groups by whatever categories
  exist, with a few well-known ones ordered first), optional icon.
- **Site settings** (Hero name/title, bio, profile image, social links) —
  `/admin/settings`.
- **Messages** — read-only from the visitor's side; they arrive via the
  public Contact form and show up in `/admin/messages`.

The only content still edited by hand, in source:

- **Colors, type, spacing** — CSS variables at the top of `src/index.css`.
- **Nav links / the Telegram + X quick-action links** — `src/data/site.ts`.
- **About copy** — directly in `src/components/About/About.tsx`.

## Testing the admin section and public site

With the backend running (see `backend/README.md` for the full setup —
`npm install && npx prisma generate && npx prisma migrate dev && npm run seed && npm run dev`):

1. `npm run dev` here, open `http://localhost:5173/admin` — you should
   land on `/admin/login` (unauthenticated redirect).
2. Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend's
   `.env`. You should land on the dashboard, with stat cards for
   projects/services/technologies/messages all loading successfully.
3. Visit `/admin/services` and `/admin/technologies` — try **New**, fill
   in the fields, save, edit an existing entry, then delete one (with
   confirmation). Toasts should confirm each action.
4. Visit `/admin/settings` — change the name or title, save, then check
   `http://localhost:5173/` — the Hero section should reflect the change.
5. Open `http://localhost:5173/` and scroll to Contact — submit the form.
   It should show a thank-you message, and the message should appear in
   `/admin/messages`. Try marking it read/unread and deleting it.
6. Confirm the public Services, Projects, and Tech Stack sections show
   whatever's currently in the database (edit something in `/admin` and
   refresh `/` to see it reflected).

Without the backend running, everything above still works up through
step 1 and the login form itself — submitting will show "Couldn't
reach the server" instead of an invalid-credentials error, which is
also expected. The public site's Services/Projects/Tech Stack sections
will just render empty without the backend, since they no longer have
static fallback data.

## Notes

- Respects `prefers-reduced-motion` throughout (scroll reveals, the hero's
  node field, and the terminal typing effect all degrade to static/instant).
- Fully responsive from mobile to large desktop, with a dedicated mobile nav.
- The public Contact form is rate-limited server-side and includes a
  hidden honeypot field — see `backend/README.md` for details.
