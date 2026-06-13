# NextDraft — Admin & Feature Guide

Complete reference for what the app does, who can do it, and how to manage it.

---

## Table of Contents

1. [How to access the admin panel](#1-how-to-access-the-admin-panel)
2. [Admin panel overview](#2-admin-panel-overview)
3. [What admins can do](#3-what-admins-can-do)
4. [User-facing features](#4-user-facing-features)
5. [Backend API reference](#5-backend-api-reference)
6. [Common admin workflows](#6-common-admin-workflows)
7. [Security model](#7-security-model)
8. [Environment variables](#8-environment-variables)
9. [Deployment checklist](#9-deployment-checklist)

---

## 1. How to access the admin panel

You've already promoted one account to admin via the script. Here's how to reach the panel from that account:

### Option A — Sidebar link
1. Log in at `/auth/login` with your admin email.
2. The dashboard sidebar will show a purple **"Admin panel"** card below the regular nav items (only visible to admins).
3. Click it.

### Option B — Direct URL
- Production: `https://<your-frontend>/admin`
- Local: `http://localhost:3000/admin`

If a non-admin tries that URL they get redirected to `/dashboard`. If they're not logged in at all, they go to `/auth/login`.

### Option C — Promote more admins later
From inside the admin panel: **Users → search → "Make admin"** button. (More on this below.)

---

## 2. Admin panel overview

The admin panel lives at `/admin` and has four sections, accessible from the left sidebar:

| Route | Section | What it shows |
|---|---|---|
| `/admin` | **Overview** | KPI cards — total users, banned count, revenue (lifetime + 30-day), transactions, resumes uploaded, AI optimizations run, open support tickets, system health. |
| `/admin/users` | **Users** | Searchable, paginated table of every account. Filter by status (active / banned) and role. Per-user actions: adjust points, promote / demote admin, ban / unban. |
| `/admin/transactions` | **Transactions** | Every Razorpay order — paid, failed, abandoned (status `created`), or refunded. Shows the user, amount, points purchased, and Razorpay order/payment IDs for cross-checking. |
| `/admin/feedback` | **Support inbox** | User-submitted bug reports, feature requests, and support tickets (e.g. "I paid but no points"). Each ticket has a status workflow: `open → in_progress → resolved → closed`. |

The sidebar also includes a **"Back to app"** link so you can hop back to your regular dashboard without logging out.

---

## 3. What admins can do

### 3.1 Manage other admins (NEW)
On `/admin/users`, the user row has a **"Make admin"** button (or **"Demote"** if they're already an admin). Click it to open a confirmation modal that requires you to **type the user's email** to proceed. Guardrails:

- You **can't change your own role** (the button is hidden on your own row).
- You **can't promote a banned user** — reactivate them first.
- The system refuses to demote the **last remaining admin** (you can't lock yourself out).

### 3.2 Adjust points manually
This is the "user paid but didn't get points" workflow you specifically asked for.

On `/admin/users`, click **"Points"** on any row. The modal lets you:
- Choose **Credit** (add) or **Debit** (remove)
- Enter the **number of points** (1 to 100,000)
- Enter a **reason** (gets logged in their ledger and visible to the user)

Every manual adjustment is recorded in the user's point ledger with:
- `adminAction: true`
- `actorId: <your admin user id>`

So both you and the user can later see who made the change and why. The user sees the entry in their activity page tagged with a small `admin` badge.

**Safety**: debit is refused if the user doesn't have enough points (no negative balances allowed).

### 3.3 Ban / unban users
On `/admin/users`, click **"Ban"**. The modal lets you supply an internal reason. Ban behavior:
- The user is immediately signed out the next time they make any request.
- Login attempts return a 403 with the message: "Account suspended. Contact support if you believe this is a mistake."
- Their data (resumes, points, transactions) is **preserved**, just inaccessible.
- Unban with the same button (now labeled **"Unban"**).

Guardrails:
- You **can't ban another admin**.
- You **can't ban yourself**.

### 3.4 See all transactions / reconcile payments
`/admin/transactions` is where you go when a user complains "I paid but didn't get points":

1. Find their order using the filter or scrolling.
2. Check the **status**:
   - `paid` → they did get credited (verify via their ledger).
   - `created` → they started checkout but never completed payment.
   - `failed` → signature verification failed or Razorpay returned an error. The exact reason is shown below the status pill.
   - `refunded` → admin / manual refund has been recorded.
3. Cross-check the **Razorpay Order ID / Payment ID** against the Razorpay dashboard.
4. If their payment **did** go through Razorpay but didn't credit (rare — only happens if our verification call failed), go to `/admin/users`, search them, and use the **Points** modal to credit the missing amount with reason like "Reconciliation — order_xxx".

### 3.5 Handle support tickets
`/admin/feedback` shows every message users send via `/dashboard/support`. Each ticket has:
- The user (name + email)
- Topic type (bug / feature / support / other)
- Subject and full message
- Created timestamp
- Status dropdown — change between **open / in progress / resolved / closed**

The user can see their own tickets and current status from their support page.

### 3.6 View stats / KPIs
`/admin` (the overview) gives you at-a-glance:
- **Users**: total, banned, new this week, new this month
- **Revenue**: lifetime total ₹, last-30-days ₹, number of paid transactions
- **Content**: resumes uploaded, JDs saved, total AI optimizations run
- **Support**: open ticket count (red when > 0)
- **System status**: healthy indicator

---

## 4. User-facing features

What every regular user can do once they sign up.

### 4.1 Account & auth
- **Register** at `/auth/register`. Requires:
  - Name (2–80 chars)
  - Email (unique, valid format, lowercased)
  - Password (8+ chars, must include uppercase, number, symbol — live strength meter shown)
  - Optional profile image (JPEG/PNG/WEBP, max 2 MB)
- On signup: gets **50 free starter points** (= 1 free AI edit).
- **Login** at `/auth/login`.
- **Forgot password** at `/auth/forgot-password` — sends email with a reset token (30 min expiry).
- **Reset password** at `/auth/reset-password?token=...` — sets a new password meeting the same complexity rules.
- JWT-based sessions, 7-day expiry; expired tokens trigger automatic logout client-side.

### 4.2 Resumes (`/dashboard/resumes`)
- Upload PDF / DOC / DOCX files (max 5 MB, max 5 resumes per account).
- Files are pushed to Cloudinary; text is extracted via `pdf-parse` or `mammoth`.
- A live, in-place editable resume template renders parsed text — every line is contenteditable.
- **Save edits** — persists changes to the database.
- **Export PDF** — uses the browser's "Save as PDF" via print.

### 4.3 AI optimize
- Paste any job description (40–20,000 chars).
- Optional: role title + company name.
- Click "AI apply changes" — backend:
  1. Atomically debits **50 points** (refuses if balance < 50).
  2. Sends resume + JD to Google Gemini 2.5 Flash with strict prompt rules (no fabricated experience, exact-text matches only).
  3. Applies safe character-for-character replacements to the resume.
  4. Returns 5–7 suggestions with priority (high/medium/low).
- **Refunds points automatically** if anything fails midway.
- Rate-limited: 5 AI requests/minute per user.
- AI run history is per-resume — you can re-open old runs.

### 4.4 Job descriptions library (`/dashboard/library`)
- Save / edit / delete reusable job descriptions (role, company, full text).
- 20,000 character limit per JD.
- All actions have delete confirmations.

### 4.5 Profile & wallet (`/dashboard/profile`)
- Update name + profile image.
- See current points balance, point ledger (credits and debits with reasons).
- **Buy points** via Razorpay checkout:
  - **Starter** — 50 pts = ₹50 (1 edit)
  - **Plus** — 150 pts = ₹150 (3 edits)
  - **Pro** — 500 pts = ₹500 (10 edits)
- See payment history (paid / failed / refunded badges).
- Link to support if a payment didn't credit.
- **Delete account** — permanent cascade: removes all resumes, JDs, suggestions, transactions, feedback, Cloudinary files. Requires a confirmation modal.

### 4.6 Activity (`/dashboard/activity`)
- Tab 1 — every AI optimization run (across all resumes)
- Tab 2 — every point credit / debit, with admin actions labeled

### 4.7 Support (`/dashboard/support`)
- Submit a bug / feature / support ticket.
- See history of their own submissions and current status.

---

## 5. Backend API reference

All `/api/admin/*` routes require both a valid JWT **and** the user's `role === "admin"`. Non-admins get 403.

### Auth (public)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/users/register` | form-data: name, email, password, profileImage? | Rate-limited 5/hr in prod |
| POST | `/api/users/login` | { email, password } | Rate-limited 10/15min |
| POST | `/api/users/forgot-password` | { email } | Rate-limited 5/hr |
| POST | `/api/users/reset-password` | { token, password } | Rate-limited 5/hr |

### Logged-in user
| Method | Path | Notes |
|---|---|---|
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users/:id` | Self or admin only |
| PUT | `/api/users/:id` | Self or admin only |
| DELETE | `/api/users/:id` | Self or admin only — cascade delete |
| GET / POST / PATCH / DELETE | `/api/resumes/*` | Owner-scoped |
| GET / POST / PATCH / DELETE | `/api/job-descriptions/*` | Owner-scoped |
| POST | `/api/suggestions/generate` | Owner-scoped, rate-limited |
| POST | `/api/suggestions/optimize` | Owner-scoped, rate-limited, debits points |
| GET | `/api/suggestions/resume/:resumeId` | Owner-scoped |
| GET | `/api/dashboard` | User's own stats |
| GET | `/api/payments/packs` | Public — returns pack list + payment availability |
| POST | `/api/payments/create-order` | Creates Razorpay order |
| POST | `/api/payments/verify` | Verifies signature, credits points (idempotent) |
| GET | `/api/payments/me` | User's payment history |
| POST | `/api/feedback` | Submit a ticket |
| GET | `/api/feedback/me` | User's tickets |

### Admin-only
| Method | Path | Body | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | — | KPIs |
| GET | `/api/admin/users?page=&limit=&search=&status=&role=` | — | User list with search |
| GET | `/api/admin/users/:id` | — | User detail with content & transactions |
| POST | `/api/admin/users/:id/points` | { type: "credit"\|"debit", points, reason } | Manual adjustment |
| POST | `/api/admin/users/:id/role` | { role: "admin"\|"user" } | Promote / demote |
| POST | `/api/admin/users/:id/status` | { status: "active"\|"banned", reason } | Ban / unban |
| GET | `/api/admin/transactions?page=&status=` | — | All transactions |
| GET | `/api/admin/feedback?page=&status=` | — | Support inbox |
| PATCH | `/api/admin/feedback/:id` | { status, adminNotes } | Update ticket |

---

## 6. Common admin workflows

### "User says they paid but no points credited"
1. `/admin/transactions` → filter by `paid` or search Razorpay order ID
2. If not in `paid`: ask user to share order ID, check `created` / `failed`
3. If status is `paid` but they say no points: check `/admin/users` → search them → look at point ledger
4. If genuinely missing: `/admin/users` → Points → Credit with reason "Reconciliation — order_xxxx"

### "Promote a teammate to admin"
1. `/admin/users` → search their email
2. Click **"Make admin"**
3. Type their email to confirm
4. They'll see the Admin Panel link on their next page load

### "Demote a former admin"
1. `/admin/users` → filter `Role: admin`
2. Click **"Demote"** on the row
3. Type their email to confirm
4. (System refuses if they'd be the last admin remaining)

### "Bad actor abusing the API"
1. `/admin/users` → search by email
2. Click **"Ban"** → enter internal reason
3. Their next request returns 403 + "Account suspended" message

### "Investigate user activity"
1. `/admin/users` → search them
2. (Future enhancement: detail page already returns resumes/JDs/transactions, just needs a UI page — currently the API exists at `GET /api/admin/users/:id`)

### "Refund a user"
1. Process refund manually in Razorpay dashboard
2. `/admin/users` → Points → Debit `<their points>` with reason "Refund — order_xxxx"
3. (Future enhancement: dedicated `/admin/transactions/:id/refund` UI button)

---

## 7. Security model

What's enforced at the backend:

- **JWT authentication** on every protected route
- **Role-based access** — `protect` then `adminOnly` on `/api/admin/*`
- **Ownership checks** on every resource — IDOR is impossible
- **CORS whitelist** — only `FRONTEND_URL` origins allowed in production
- **Helmet** security headers + crossOriginResourcePolicy for Cloudinary
- **Rate limiting** — auth (10/15min), register (5/hr), reset (5/hr), AI (5/min/user), payments (10/min/user), global (240/min/IP)
- **express-mongo-sanitize** — strips `$` and `.` from request bodies (NoSQL injection prevention)
- **Bcrypt password hashing** with `select: false` so password is never serialized
- **Razorpay signature verification** with `crypto.timingSafeEqual`
- **Atomic point operations** via Mongo `$inc` + conditional `findOneAndUpdate`
- **Idempotent payment verify** — same payment can't credit points twice
- **Resource size limits** — files (5 MB resume, 2 MB image), JSON body (1 MB), text fields (capped per model)
- **Banned users can't act** — request immediately returns 403, JWT becomes useless without removing it
- **Cascade delete** on user removal — no orphan records

What's enforced at the frontend:
- 401 from any API call → automatic logout + redirect to `/auth/login`
- Admin pages check `role === "admin"` from server on mount (any tampering with localStorage is detected)
- Form validation mirrors backend rules (defense in depth)
- Critical actions (delete account, role change, ban) require modal confirmation
- Role changes require typing the user's email to confirm

---

## 8. Environment variables

### Backend (`nextdraft-backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | yes | `production` or `development` |
| `PORT` | no | Defaults to 5000 |
| `FRONTEND_URL` | **yes in prod** | Comma-separated list of allowed origins for CORS. Without this in prod, the API rejects all browser requests. |
| `MONGODB_URI` | yes | MongoDB Atlas connection string |
| `JWT_SECRET` | yes | At least 64 random chars |
| `CLOUDINARY_CLOUD_NAME` | yes | File storage |
| `CLOUDINARY_API_KEY` | yes | File storage |
| `CLOUDINARY_API_SECRET` | yes | File storage |
| `GEMINI_API_KEY` | yes | Google Gemini for AI suggestions |
| `RAZORPAY_KEY_ID` | for payments | Without it, "Buy points" UI is disabled |
| `RAZORPAY_KEY_SECRET` | for payments | Used for signature verification |
| `SMTP_HOST` | recommended | If unset in dev, Ethereal test inbox is used and reset URL is returned in response (dev only) |
| `SMTP_PORT` | recommended | Usually 587 |
| `SMTP_USER` | recommended | |
| `SMTP_PASS` | recommended | App password, not the account password |
| `SMTP_FROM` | recommended | e.g. `NextDraft <noreply@nextdraft.app>` |

### Frontend (`nextdraft-frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | Backend URL — e.g. `https://api.nextdraft.app` or `http://localhost:5000` |

---

## 9. Deployment checklist

Before going live:

- [ ] Set strong `JWT_SECRET` (64+ random hex chars)
- [ ] Set `FRONTEND_URL` to exact production frontend URL(s)
- [ ] Set `NODE_ENV=production` so rate limits and security checks kick in
- [ ] Set `MONGODB_URI` to Atlas (NOT the local one)
- [ ] Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to **live** keys (not test)
- [ ] Set SMTP credentials for production email
- [ ] Set Cloudinary credentials
- [ ] Set `GEMINI_API_KEY` (and confirm quota)
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` on Vercel to the Render URL
- [ ] Run `node scripts/promote_admin.js <your-email>` against the production DB to grant yourself admin
- [ ] Verify a test payment goes through in Razorpay live mode
- [ ] Verify a banned user really is locked out
- [ ] Verify password reset email arrives
- [ ] Open `/admin` and confirm stats load

---

## Where things live in code

```
nextdraft-backend/
├── server.js                          # CORS, helmet, rate limit, route mounting, error handler
├── config/
│   ├── db.js                          # MongoDB connection
│   ├── cloudinary.js                  # Cloudinary SDK config
│   └── razorpay.js                    # Razorpay SDK with optional-config detection
├── middleware/
│   ├── auth.js                        # protect, adminOnly, ownerOnly
│   ├── rate_limit.js                  # All rate limiters
│   ├── validate.js                    # ObjectId validation, input sanitization
│   ├── upload.js                      # Profile image multer
│   └── upload_resume.js               # Resume multer
├── models/
│   ├── User_model.js                  # User schema with role, status, ledger
│   ├── Resume_model.js
│   ├── JobDescription_model.js
│   ├── Suggestion_model.js
│   ├── Transaction_model.js           # Payment records
│   └── Feedback_model.js              # Support tickets
├── controllers/
│   ├── user_controller.js             # Register, login, reset, get/update/delete self
│   ├── resume_controller.js           # CRUD + parsing
│   ├── job_description_controller.js  # CRUD
│   ├── suggestion_controller.js       # Generate, optimize, apply
│   ├── dashboard_controller.js        # User stats aggregation
│   ├── payment_controller.js          # Create order + verify signature
│   ├── admin_controller.js            # Stats, list users, adjust points, role, status, list TX, feedback
│   └── feedback_controller.js         # Submit + list own tickets
├── routes/                             # Express routers, mostly thin wiring
├── services/
│   ├── email_service.js               # Nodemailer wrapper with templates
│   └── suggestion_service.js          # Gemini integration + atomic point debit
└── scripts/
    └── promote_admin.js               # Run: node scripts/promote_admin.js you@example.com

nextdraft-frontend/
├── app/
│   ├── layout.tsx                     # Theme + Sonner toaster
│   ├── page.tsx                       # Landing page
│   ├── auth/                          # login, register, forgot, reset
│   ├── dashboard/                     # User app — layout has admin link if admin
│   │   ├── page.tsx                   # Overview
│   │   ├── resumes/                   # Main optimizer
│   │   ├── library/                   # Resume + JD management
│   │   ├── activity/                  # History
│   │   ├── profile/                   # Profile + Razorpay buy points
│   │   └── support/                   # User tickets
│   └── admin/                         # Admin panel
│       ├── layout.tsx                 # Admin sidebar (purple theme)
│       ├── page.tsx                   # Stats overview
│       ├── users/                     # User table + Points/Role/Ban modals
│       ├── transactions/              # Transaction log
│       └── feedback/                  # Support inbox
├── lib/
│   ├── api.ts                         # Auth-aware fetch wrapper, auto-logout on 401
│   ├── auth.ts                        # Token + user storage, isAdmin helper
│   ├── razorpay.ts                    # Checkout helper
│   └── utils.ts                       # API_BASE_URL, cn classnames
└── components/
    ├── templates/ResumeTemplates.tsx  # Live editable resume preview
    └── ui/                            # shadcn primitives
```
