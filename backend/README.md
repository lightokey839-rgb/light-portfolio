# light-portfolio — backend

Fastify + TypeScript API backing the admin dashboard and the public
portfolio's dynamic content. Built in phases — see the root project notes
for the full plan. This document covers what exists so far.

**Status: Phase 5 — services, technologies, messages, and settings CRUD,
completing the API surface the frontend needs.**
Implemented: everything from Phases 1–4, plus full CRUD for services
(`/services`, `/services/:id`) and technologies (`/technologies`,
`/technologies/:id`); a public `POST /messages` (the contact form) with
admin-only list/mark-read/delete; and `GET`/`PATCH /settings` for the
site's name, title, bio, profile image, and social links.

## Prerequisites

- Node.js 20+
- A PostgreSQL database. Any of these work:
  - Local Postgres (e.g. via `brew install postgresql` or Docker)
  - A free hosted instance from [Neon](https://neon.tech) or [Supabase](https://supabase.com)

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `JWT_EXPIRES_IN` — optional, defaults to `7d` (how long a login session lasts)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the initial admin login, used by
  the seed script to create the one Admin row
- `FRONTEND_URL` — `http://localhost:5173` for local dev

Then create the database schema and seed data:

```bash
npx prisma migrate dev --name init
npm run seed
```

`prisma migrate dev` will create the tables (and prompt to create the
database itself if it doesn't exist yet, for a local Postgres). The seed
script creates your admin account and populates projects, services,
technologies, and site settings with the starter content the frontend
used to hardcode before the admin dashboard existed. It deliberately
doesn't seed any `Message` rows — those are meant to come from real
visitors via the public contact form (see the Messages section below for
how to test that without waiting on one).

## Run it

```bash
npm run dev
```

The API starts on `http://localhost:4000` (change with `PORT` in `.env`).

## Test it

With the server running:

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-08-12T...",
  "uptimeSeconds": 3,
  "database": "connected"
}
```

If `database` says `"unreachable"`, double-check `DATABASE_URL` and that
Postgres is running.

### Auth

The admin created by `npm run seed` (using `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `.env`) can log in right away. Cookies need to persist across
requests, so use `-c`/`-b` with curl (or just use a REST client like
Insomnia/Postman/Thunder Client, which handle cookies automatically):

```bash
# Log in — saves the session cookie to cookies.txt
curl -i -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-admin-password"}'
```

Expected: `200 OK`, a `Set-Cookie: admin_session=...; HttpOnly` header,
and a JSON body with the admin's `id`, `email`, `name`, timestamps — no
`passwordHash`.

```bash
# Wrong password — should be a clean 401, not a stack trace
curl -i -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"wrong"}'

# 6 rapid attempts in a row should 429 on the 6th (rate limit: 5 / 10 min)
for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"wrong"}'; done

# Who am I — uses the saved cookie, should return the same admin
curl -i -b cookies.txt http://localhost:4000/api/v1/auth/me

# No cookie at all — should be a clean 401 UNAUTHENTICATED
curl -i http://localhost:4000/api/v1/auth/me

# Log out — clears the cookie
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/api/v1/auth/logout

# /me again with the now-cleared cookie — back to 401
curl -i -b cookies.txt http://localhost:4000/api/v1/auth/me
```

Other things worth checking by hand:

- `npm run typecheck` — should report no errors
- `npm run build` — should compile cleanly into `dist/`
- Inspect the seeded data with `npx prisma studio` (opens a local GUI at `http://localhost:5555`)
- Hit a route that doesn't exist (e.g. `curl http://localhost:4000/api/v1/nope`) — should return a clean `404` JSON error, not a stack trace

### Projects

The seed script already created 4 sample projects, so listing works
without logging in first:

```bash
# Public list — published only, no auth needed
curl http://localhost:4000/api/v1/projects

# Same request, but as the logged-in admin (reuse cookies.txt from the
# auth section above) — includes drafts, unlocks status/search/sort
curl -b cookies.txt "http://localhost:4000/api/v1/projects?status=all&sort=newest"

# Search + pagination
curl -b cookies.txt "http://localhost:4000/api/v1/projects?q=telegram&page=1&pageSize=2"

# Create (requires auth)
curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Project","description":"A project created via curl.","category":"Test","technologies":["React","Testing"]}'

# Grab the id from that response, then update it
curl -i -b cookies.txt -X PATCH http://localhost:4000/api/v1/projects/<id> \
  -H "Content-Type: application/json" \
  -d '{"published": false}'

# Delete it — should 204, then a second delete should 404
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/v1/projects/<id>
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/v1/projects/<id>

# Without a login, create/update/delete should all 401
curl -i -X POST http://localhost:4000/api/v1/projects \
  -H "Content-Type: application/json" -d '{}'
```

### Image uploads

```bash
# Upload an image (requires auth) — replace with a real path to a jpg/png/webp
curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/uploads/image \
  -F "file=@/path/to/image.jpg"

# Response: {"url":"/uploads/<generated-name>.jpg"} — fetch it back directly
curl -I http://localhost:4000/uploads/<generated-name>.jpg

# Wrong file type should 400
curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/uploads/image \
  -F "file=@/path/to/document.pdf"

# No login should 401
curl -i -X POST http://localhost:4000/api/v1/uploads/image -F "file=@/path/to/image.jpg"
```

### Services & technologies

Both follow the same shape — public reads, admin-only writes, no
published/draft state (unlike projects, every row here is always public):

```bash
# Public list — no auth needed
curl http://localhost:4000/api/v1/services
curl http://localhost:4000/api/v1/technologies

# Create (requires auth)
curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/services \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Service","description":"A service created via curl.","icon":"🧪"}'

curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/technologies \
  -H "Content-Type: application/json" \
  -d '{"name":"Vitest","category":"Tools"}'

# Duplicate technology name should 409 (name is unique)
curl -i -b cookies.txt -X POST http://localhost:4000/api/v1/technologies \
  -H "Content-Type: application/json" \
  -d '{"name":"Vitest","category":"Tools"}'

# Update / delete follow the same pattern as projects (PATCH / DELETE by id)
```

### Messages

`POST /messages` is the one public *write* endpoint in the whole API — it's
what the portfolio's contact form submits to. Everything else here needs
the admin session:

```bash
# Submit a message — no auth needed. Always responds the same way whether
# or not it was actually saved (see the honeypot note below).
curl -i -X POST http://localhost:4000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan","email":"jordan@example.com","message":"Hi, I have a project in mind — got 15 minutes this week?"}'

# The honeypot field: filling it in should still 201, but nothing should
# show up in the admin list below. This simulates a bot filling every field.
curl -i -X POST http://localhost:4000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@example.com","message":"This should be silently discarded.","website":"http://spam.example"}'

# 6 rapid submissions should 429 on the 6th (rate limit: 5 / 10 min, same as login)
for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:4000/api/v1/messages -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Rate limit test message."}'; done

# List (requires auth) — the two real messages above should be here, not the bot one
curl -b cookies.txt "http://localhost:4000/api/v1/messages?status=unread&sort=newest"

# Mark one read
curl -i -b cookies.txt -X PATCH http://localhost:4000/api/v1/messages/<id> \
  -H "Content-Type: application/json" -d '{"read": true}'

# Without a login, list/update/delete should all 401
curl -i http://localhost:4000/api/v1/messages
```

### Settings

A singleton — there's always exactly one row, seeded on `npm run seed`
and lazily created with placeholder values if it's ever missing:

```bash
# Public — this is what the live site reads
curl http://localhost:4000/api/v1/settings

# Update (requires auth) — partial updates are fine, only sends what changed
curl -i -b cookies.txt -X PATCH http://localhost:4000/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{"title":"Full-Stack Web3 Builder"}'

# Invalid email should 400
curl -i -b cookies.txt -X PATCH http://localhost:4000/api/v1/settings \
  -H "Content-Type: application/json" -d '{"email":"not-an-email"}'
```

## Project structure

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/             # login/me/logout routes, credential + cookie logic
│   │   ├── projects/         # project CRUD — schema/service/routes
│   │   ├── uploads/          # image upload endpoint
│   │   ├── services/         # service CRUD — schema/service/routes
│   │   ├── technologies/     # technology CRUD — schema/service/routes
│   │   ├── messages/         # public contact-form intake + admin inbox
│   │   └── settings/         # singleton site settings — get/update
│   ├── plugins/             # cors.ts, prisma.ts, jwt.ts — Fastify plugins
│   ├── middleware/          # errorHandler.ts — centralized error handling
│   ├── routes/              # health.ts (more added per phase)
│   ├── utils/                # env.ts, paths.ts — config + shared paths
│   ├── app.ts                # builds & configures the Fastify instance
│   └── server.ts             # entry point — starts listening, graceful shutdown
├── prisma/
│   ├── schema.prisma        # Admin, Project, Technology, Service, Message, SiteSettings
│   └── seed.ts                # creates admin + sample data
└── uploads/                  # local media storage — uploaded images land here
```

## How admin auth works

- Login (`POST /auth/login`) checks the email/password against the
  `Admin` row (argon2 hash comparison), then issues a JWT and sets it
  as an **httpOnly, Secure-in-production** cookie (`admin_session`).
  The token itself never touches frontend JavaScript.
- Every protected route uses the shared `fastify.authenticate`
  preHandler (`src/plugins/jwt.ts`), which verifies that cookie and
  attaches `request.user.adminId`. Every write endpoint across every
  module reuses this same guard.
- `GET /auth/me` re-reads the admin from the DB on every call (not just
  trusting the token payload), so a deleted/changed admin can't stay
  "logged in".
- Login is rate-limited harder than the rest of the API — 5 attempts
  per 10 minutes per IP — independent of the global 100/minute limit.
- Wrong email and wrong password return the identical `401
  INVALID_CREDENTIALS` response (and take about the same time to
  respond), so the endpoint can't be used to check which admin emails
  exist.

## How projects & uploads work

- `GET /projects` and `GET /projects/:id` never require login — they use
  a soft-auth check (`tryGetAdminId`) that quietly checks for a valid
  session cookie without rejecting the request if there isn't one.
  Anonymous callers only ever see `published: true` projects; a valid
  admin session additionally sees drafts and unlocks `status`/`q`/`sort`
  filtering. This is the same endpoint the public site calls.
- Slugs are generated once from the title at creation time and never
  silently regenerate on edit — changing a project's title later won't
  break a link to it.
- The technologies field on the project form is free-text tags, not a
  dropdown. Typed names are matched case-insensitively against existing
  `Technology` rows, or created fresh (category `"Other"`) if new — this
  is independent of the `/technologies` CRUD endpoints below, which
  manage the canonical list shown in the public tech-stack section.
- Uploaded images are validated by declared MIME type and capped at 5MB;
  the filename is always server-generated (`randomUUID + extension`),
  so the client's original filename is never used for anything — no
  path traversal, no arbitrary extensions.
- `/uploads/*` is served outside the `/api/v1` prefix, since it's static
  files rather than API responses. Helmet's default
  Cross-Origin-Resource-Policy would otherwise block the frontend (a
  different origin) from loading these images — that's relaxed
  explicitly in `app.ts`.

## How services, technologies, messages & settings work

- **Services and technologies** have no `published`/draft state at all —
  unlike projects, every row is always public, so `GET /services` and
  `GET /technologies` don't branch on admin vs. anonymous the way
  `GET /projects` does. Deleting a technology that's attached to
  projects is safe: the relation is an implicit many-to-many, so Prisma
  just drops the join-table rows, no cascade or FK error.
- **Messages**: `POST /messages` is public and unauthenticated by
  necessity (it's the contact form), which makes it the obvious spam
  target in this API. It's rate-limited the same way `/auth/login` is
  (5 / 10 min per IP), and includes a honeypot field (`website`) that's
  rendered hidden on the real form — a filled value is treated as spam
  and silently discarded rather than saved, but the response is
  identical either way so nothing here reveals to a bot that its
  submission didn't go through.
- **Settings** is a singleton table by design: `GET /settings` and
  `PATCH /settings` always operate on "the one row," creating it with
  placeholder values on first access if `npm run seed` was somehow
  skipped, so the public site's Hero section never has to handle a
  404 just because setup was incomplete.
