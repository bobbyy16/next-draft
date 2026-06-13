"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Database,
  Eye,
  FileText,
  Folder,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const sections = [
  { id: "access", label: "Accessing the admin panel" },
  { id: "overview", label: "Admin panel overview" },
  { id: "admin-actions", label: "What admins can do" },
  { id: "user-features", label: "User-facing features" },
  { id: "workflows", label: "Common workflows" },
  { id: "api", label: "API reference" },
  { id: "security", label: "Security model" },
  { id: "env", label: "Environment variables" },
  { id: "deployment", label: "Deployment checklist" },
];

export default function AdminDocsPage() {
  const [activeId, setActiveId] = useState<string>("access");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          Reference
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <BookOpen className="h-6 w-6 text-purple-700" />
          Documentation
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Everything in NextDraft — admin tools, user features, API, security, and deployment.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-1" aria-label="On this page">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              On this page
            </div>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeId === s.id
                    ? "bg-purple-50 text-purple-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="max-w-4xl space-y-10">
          {/* === Access === */}
          <Section id="access" icon={KeyRound} title="1. Accessing the admin panel">
            <p>
              You've already promoted one account to admin via the script. Here's how to reach the panel from
              that account:
            </p>

            <SubHeading>Option A — Sidebar link (easiest)</SubHeading>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Log in at <Code>/auth/login</Code> with your admin email.</li>
              <li>
                In the dashboard sidebar a purple <strong>"Admin panel"</strong> card appears below the
                regular nav items — only admins see it.
              </li>
              <li>Click it.</li>
            </ol>

            <SubHeading>Option B — Direct URL</SubHeading>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Production: <Code>https://&lt;your-frontend&gt;/admin</Code></li>
              <li>Local: <Code>http://localhost:3000/admin</Code></li>
            </ul>
            <p className="text-sm">
              Non-admins are redirected to <Code>/dashboard</Code>. Unauthenticated users go to{" "}
              <Code>/auth/login</Code>.
            </p>

            <SubHeading>Option C — Promote more admins from inside the UI (new)</SubHeading>
            <p className="text-sm">
              From <Code>/admin/users</Code> → search the user → click <strong>"Make admin"</strong>. A
              confirmation modal requires you to type the user's email before the action takes effect.
            </p>
          </Section>

          {/* === Overview === */}
          <Section id="overview" icon={LayoutDashboard} title="2. Admin panel overview">
            <p>
              The admin panel lives at <Code>/admin</Code>. Five sections in the sidebar:
            </p>
            <div className="not-prose grid gap-3 sm:grid-cols-2">
              <RouteCard
                icon={LayoutDashboard}
                title="Overview"
                href="/admin"
                description="KPI cards: users, banned count, revenue (lifetime + 30-day), transactions, content stats, open tickets, system health."
              />
              <RouteCard
                icon={BarChart3}
                title="Reports"
                href="/admin/reports"
                description="Time-series charts: signups, revenue, AI usage, transactions. Pack-revenue pie, status breakdown, top spenders. 7/30/90/180-day windows."
              />
              <RouteCard
                icon={Users}
                title="Users"
                href="/admin/users"
                description="Search & paginate every account. Adjust points, promote/demote admin, ban/unban, delete on request."
              />
              <RouteCard
                icon={CreditCard}
                title="Transactions"
                href="/admin/transactions"
                description="Every Razorpay order — paid, failed, abandoned (status created), or refunded. Razorpay order/payment IDs included."
              />
              <RouteCard
                icon={LifeBuoy}
                title="Support inbox"
                href="/admin/feedback"
                description="User-submitted tickets. Each has a status workflow: open → in progress → resolved → closed."
              />
            </div>
            <p className="text-sm">
              The sidebar also has a <strong>"Back to app"</strong> link to jump to your regular dashboard
              without logging out.
            </p>
          </Section>

          {/* === Admin actions === */}
          <Section id="admin-actions" icon={ShieldCheck} title="3. What admins can do">
            <FeatureCard
              icon={UserPlus}
              title="3.1 Manage other admins"
              tone="purple"
            >
              <p>
                On <Code>/admin/users</Code>, each user row has a <strong>"Make admin"</strong> button (or{" "}
                <strong>"Demote"</strong> if they're already an admin). Clicking opens a modal that requires
                you to <strong>type the user's email</strong> to confirm.
              </p>
              <p className="font-semibold">Built-in guardrails:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>You can't change your own role (button hidden on your own row).</li>
                <li>You can't promote a banned user — reactivate them first.</li>
                <li>The system refuses to demote the last remaining admin (no lockout).</li>
              </ul>
            </FeatureCard>

            <FeatureCard
              icon={Wallet}
              title="3.2 Adjust points manually"
              tone="emerald"
            >
              <p>
                This is the "user paid but didn't get points" workflow you specifically asked for.
              </p>
              <p>
                On <Code>/admin/users</Code>, click <strong>"Points"</strong> on any row. The modal lets you:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Choose <strong>Credit</strong> (add) or <strong>Debit</strong> (remove)</li>
                <li>Enter the number of points (1 to 100,000)</li>
                <li>Enter a reason — gets logged in the user's ledger</li>
              </ul>
              <p>
                Every manual adjustment is recorded with <Code>adminAction: true</Code> and{" "}
                <Code>actorId: &lt;your-id&gt;</Code>. The user sees the entry in their activity tagged with a
                small <strong>admin</strong> badge.
              </p>
              <p className="text-xs text-slate-500">
                <strong>Safety:</strong> debit is refused if the user doesn't have enough points (no negative
                balances).
              </p>
            </FeatureCard>

            <FeatureCard
              icon={AlertTriangle}
              title="3.3 Ban / unban users"
              tone="rose"
            >
              <p>
                On <Code>/admin/users</Code>, click <strong>"Ban"</strong>. Supply an internal reason. After
                banning:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The user is immediately blocked the next time their token is used.</li>
                <li>
                  Login attempts return 403: "Account suspended. Contact support if you believe this is a
                  mistake."
                </li>
                <li>
                  Their data (resumes, points, transactions) is <strong>preserved</strong>, just inaccessible.
                </li>
                <li>Unban with the same button (now labeled "Unban").</li>
              </ul>
              <p className="font-semibold">Guardrails:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>You can't ban another admin.</li>
                <li>You can't ban yourself.</li>
              </ul>
            </FeatureCard>

            <FeatureCard
              icon={CreditCard}
              title="3.4 Reconcile payments"
              tone="amber"
            >
              <p>
                <Code>/admin/transactions</Code> is where you go when a user complains "I paid but didn't get
                points":
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Find their order using the status filter.</li>
                <li>
                  Check the <strong>status</strong>:
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>
                      <Badge tone="emerald">paid</Badge> — they were credited (verify in their ledger).
                    </li>
                    <li>
                      <Badge tone="slate">created</Badge> — started checkout, never completed.
                    </li>
                    <li>
                      <Badge tone="rose">failed</Badge> — signature failed or Razorpay returned an error. Reason shown.
                    </li>
                    <li>
                      <Badge tone="amber">refunded</Badge> — refund recorded.
                    </li>
                  </ul>
                </li>
                <li>Cross-check Razorpay order/payment IDs against the Razorpay dashboard.</li>
                <li>
                  If payment cleared in Razorpay but never credited in our DB: go to{" "}
                  <Code>/admin/users</Code>, find them, use <strong>Points → Credit</strong> with reason
                  "Reconciliation — order_xxx".
                </li>
              </ol>
            </FeatureCard>

            <FeatureCard
              icon={LifeBuoy}
              title="3.5 Handle support tickets"
              tone="blue"
            >
              <p>
                <Code>/admin/feedback</Code> shows every message users submit via{" "}
                <Code>/dashboard/support</Code>. Each ticket has:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>User name + email</li>
                <li>Topic (bug / feature / support / other)</li>
                <li>Subject and full message</li>
                <li>Status dropdown — change between open / in_progress / resolved / closed</li>
              </ul>
              <p>
                Users see their own tickets and current status on their own{" "}
                <Code>/dashboard/support</Code> page.
              </p>
            </FeatureCard>

            <FeatureCard
              icon={Sparkles}
              title="3.6 View stats / KPIs"
              tone="teal"
            >
              <p>
                <Code>/admin</Code> (overview) shows at a glance:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Users:</strong> total, banned, new this week, new this month</li>
                <li><strong>Revenue:</strong> lifetime ₹, last-30-days ₹, paid transaction count</li>
                <li><strong>Content:</strong> resumes uploaded, JDs saved, optimizations run</li>
                <li><strong>Support:</strong> open ticket count (red if &gt; 0)</li>
                <li><strong>System status:</strong> healthy indicator</li>
              </ul>
            </FeatureCard>
          </Section>

          {/* === User features === */}
          <Section id="user-features" icon={Users} title="4. User-facing features">
            <FeatureCard icon={UserCog} title="Account & auth" tone="slate">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Register</strong> at <Code>/auth/register</Code> — name (2–80 chars), unique email,
                  strong password (8+ chars, upper/number/symbol), optional profile image (JPEG/PNG/WEBP, max
                  2 MB).
                </li>
                <li>Signup grants <strong>50 free starter points</strong> (= 1 free AI edit).</li>
                <li>JWT sessions, 7-day expiry, auto-logout on 401.</li>
                <li>
                  Forgot password: <Code>/auth/forgot-password</Code> sends a reset email (30-minute token
                  expiry).
                </li>
              </ul>
            </FeatureCard>

            <FeatureCard icon={FileText} title="Resumes" tone="slate">
              <ul className="list-disc space-y-1 pl-5">
                <li>Upload PDF / DOC / DOCX (max 5 MB, max 5 per account).</li>
                <li>Stored in Cloudinary; text extracted with pdf-parse or mammoth.</li>
                <li>Live editable resume template — every line is contenteditable.</li>
                <li>Save edits to DB; export PDF via browser print → "Save as PDF".</li>
              </ul>
            </FeatureCard>

            <FeatureCard icon={Sparkles} title="AI optimize" tone="slate">
              <ul className="list-disc space-y-1 pl-5">
                <li>Paste job description (40–20,000 chars). Optional role title + company.</li>
                <li>
                  Backend atomically debits <strong>50 points</strong>, sends to Gemini 2.5 Flash with strict
                  prompt rules, applies exact-text replacements.
                </li>
                <li>Returns 5–7 suggestions with priority (high/medium/low).</li>
                <li><strong>Auto-refunds points</strong> if anything fails midway.</li>
                <li>Rate-limited: 5 AI requests/minute per user.</li>
              </ul>
            </FeatureCard>

            <FeatureCard icon={Folder} title="Library" tone="slate">
              <p>
                <Code>/dashboard/library</Code> — save / edit / delete reusable job descriptions (role,
                company, full text, max 20,000 chars). All destructive actions have confirmation modals.
              </p>
            </FeatureCard>

            <FeatureCard icon={Wallet} title="Profile & wallet" tone="slate">
              <ul className="list-disc space-y-1 pl-5">
                <li>Update name + profile image.</li>
                <li>See points balance and full ledger.</li>
                <li>
                  <strong>Buy points via Razorpay:</strong> Starter (50 pts / ₹50), Plus (150 pts / ₹150), Pro
                  (500 pts / ₹500).
                </li>
                <li>See payment history with paid/failed/refunded badges.</li>
                <li>
                  <strong>Delete account</strong> — cascade: removes resumes, JDs, suggestions, transactions,
                  feedback, Cloudinary files. Requires confirmation.
                </li>
              </ul>
            </FeatureCard>

            <FeatureCard icon={RefreshCw} title="Activity & support" tone="slate">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <Code>/dashboard/activity</Code> — every AI run + every point credit/debit, with admin
                  actions labeled.
                </li>
                <li>
                  <Code>/dashboard/support</Code> — submit tickets that land in your admin inbox; users see
                  their own ticket history and status.
                </li>
              </ul>
            </FeatureCard>
          </Section>

          {/* === Workflows === */}
          <Section id="workflows" icon={Zap} title="5. Common workflows">
            <Workflow
              title='"User paid but no points credited"'
              steps={[
                "Open /admin/transactions",
                "Filter by 'paid' (or ask user for Razorpay order ID)",
                "If status is 'paid' but their ledger doesn't show it: go to /admin/users, find them, click Points → Credit, with reason 'Reconciliation — order_xxxx'",
                "If status is 'failed' or 'created': share the failure reason with the user; ask them to retry",
              ]}
            />
            <Workflow
              title="Promote a teammate to admin"
              steps={[
                "Open /admin/users, search their email",
                "Click 'Make admin'",
                "Type their email in the confirmation field",
                "They'll see the Admin Panel link on their next page load",
              ]}
            />
            <Workflow
              title="Demote a former admin"
              steps={[
                "Open /admin/users, filter Role = admin",
                "Click 'Demote' on the row",
                "Type their email to confirm",
                "If they're the last admin, system will refuse — promote someone else first",
              ]}
            />
            <Workflow
              title="Ban a bad actor"
              steps={[
                "Open /admin/users, search by email",
                "Click 'Ban', enter an internal reason",
                "Their next request returns 403 — they're locked out immediately",
              ]}
            />
            <Workflow
              title='"Please delete my account" (user emailed or filed a ticket)'
              steps={[
                "Verify the request is genuine — confirm via the email address on file or via /admin/feedback",
                "Open /admin/users, search by email",
                "Click the red 'Delete' button",
                "Type the user's email to confirm — this permanently removes account, resumes, JDs, optimization history, support tickets, and remaining points",
                "Note: paid Razorpay orders themselves stay in Razorpay for accounting; only our internal records are removed",
              ]}
            />
            <Workflow
              title="Refund a user"
              steps={[
                "Process the refund manually in your Razorpay dashboard",
                "In /admin/users, find them",
                "Points → Debit their points (e.g. 50) with reason 'Refund — order_xxxx'",
              ]}
            />
          </Section>

          {/* === API === */}
          <Section id="api" icon={Server} title="6. API reference">
            <p>
              All <Code>/api/admin/*</Code> routes require both a valid JWT <strong>and</strong>{" "}
              <Code>role === &quot;admin&quot;</Code>. Non-admins get 403.
            </p>

            <SubHeading>Public auth endpoints</SubHeading>
            <ApiTable
              rows={[
                ["POST", "/api/users/register", "form: name, email, password, profileImage?", "Rate-limited 5/hr"],
                ["POST", "/api/users/login", "{ email, password }", "Rate-limited 10/15min"],
                ["POST", "/api/users/forgot-password", "{ email }", "Rate-limited 5/hr"],
                ["POST", "/api/users/reset-password", "{ token, password }", "Rate-limited 5/hr"],
              ]}
            />

            <SubHeading>Logged-in user</SubHeading>
            <ApiTable
              rows={[
                ["GET", "/api/users/me", "—", "Current user"],
                ["GET", "/api/users/:id", "—", "Self or admin only"],
                ["PUT", "/api/users/:id", "form-data", "Self or admin only"],
                ["DELETE", "/api/users/:id", "—", "Self or admin — cascade"],
                ["*", "/api/resumes/*", "—", "Owner-scoped"],
                ["*", "/api/job-descriptions/*", "—", "Owner-scoped"],
                ["POST", "/api/suggestions/optimize", "{ resumeId, jobDescriptionText, roleTitle?, companyName? }", "Debits 50 pts"],
                ["GET", "/api/payments/packs", "—", "Public — pack list + availability"],
                ["POST", "/api/payments/create-order", "{ pack }", "Razorpay order"],
                ["POST", "/api/payments/verify", "{ razorpay_order_id, razorpay_payment_id, razorpay_signature }", "Idempotent"],
                ["GET", "/api/payments/me", "—", "User's payment history"],
                ["POST", "/api/feedback", "{ type, subject, message }", "Submit ticket"],
                ["GET", "/api/feedback/me", "—", "User's tickets"],
              ]}
            />

            <SubHeading>Admin-only</SubHeading>
            <ApiTable
              rows={[
                ["GET", "/api/admin/stats", "—", "KPIs"],
                ["GET", "/api/admin/users", "?page&limit&search&status&role", "Paginated user list"],
                ["GET", "/api/admin/users/:id", "—", "User detail + content"],
                ["POST", "/api/admin/users/:id/points", '{ type: "credit"|"debit", points, reason }', "Manual adjustment"],
                ["POST", "/api/admin/users/:id/role", '{ role: "admin"|"user" }', "Promote / demote"],
                ["POST", "/api/admin/users/:id/status", '{ status: "active"|"banned", reason }', "Ban / unban"],
                ["GET", "/api/admin/transactions", "?page&status", "All transactions"],
                ["GET", "/api/admin/feedback", "?page&status", "Support inbox"],
                ["PATCH", "/api/admin/feedback/:id", "{ status?, adminNotes? }", "Update ticket"],
              ]}
            />
          </Section>

          {/* === Security === */}
          <Section id="security" icon={Lock} title="7. Security model">
            <SubHeading>Enforced server-side</SubHeading>
            <div className="not-prose grid gap-2">
              {[
                ["JWT auth on every protected route + ban-check before any request reaches a controller", ShieldCheck],
                ["Role-based access — protect + adminOnly on every /api/admin/* route", Lock],
                ["Ownership checks on every resource — IDOR is impossible", Eye],
                ["CORS whitelist — only FRONTEND_URL origins allowed in production", Server],
                ["Helmet security headers + crossOriginResourcePolicy for Cloudinary", Lock],
                ["Rate limiting — auth 10/15min, register 5/hr, AI 5/min/user, payments 10/min/user", Zap],
                ["express-mongo-sanitize strips $ and . from request bodies (NoSQL-injection prevention)", Database],
                ["Bcrypt password hashing with select:false — password never serialized", KeyRound],
                ["Razorpay signature verification with crypto.timingSafeEqual", CreditCard],
                ["Atomic point operations via Mongo $inc + conditional findOneAndUpdate", RefreshCw],
                ["Idempotent payment verify — same payment can't credit points twice", CheckCircle2],
                ["Size limits — 5 MB resume, 2 MB image, 1 MB JSON body, capped text fields", Database],
                ["Banned users get 403 immediately; their JWT becomes useless", AlertTriangle],
                ["Cascade delete on user removal — no orphan records", Database],
              ].map(([text, Icon]) => (
                <SecurityRow key={text as string} icon={Icon as typeof Lock} text={text as string} />
              ))}
            </div>

            <SubHeading>Enforced client-side</SubHeading>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>401 from any API call → automatic logout + redirect to <Code>/auth/login</Code></li>
              <li>Admin pages verify <Code>role === &quot;admin&quot;</Code> from the server on mount</li>
              <li>Form validation mirrors backend rules (defense in depth)</li>
              <li>Critical actions (delete account, role change, ban) require modal confirmation</li>
              <li>Role changes require typing the user's email to confirm</li>
            </ul>
          </Section>

          {/* === Env vars === */}
          <Section id="env" icon={KeyRound} title="8. Environment variables">
            <SubHeading>Backend — <Code>nextdraft-backend/.env</Code></SubHeading>
            <EnvTable
              rows={[
                ["NODE_ENV", "yes", "production or development"],
                ["PORT", "no", "Defaults to 5000"],
                ["FRONTEND_URL", "yes in prod", "Comma-separated allowed CORS origins"],
                ["MONGODB_URI", "yes", "MongoDB Atlas connection string"],
                ["JWT_SECRET", "yes", "At least 64 random chars"],
                ["CLOUDINARY_CLOUD_NAME", "yes", "File storage"],
                ["CLOUDINARY_API_KEY", "yes", "File storage"],
                ["CLOUDINARY_API_SECRET", "yes", "File storage"],
                ["GEMINI_API_KEY", "yes", "Google Gemini API"],
                ["RAZORPAY_KEY_ID", "for payments", "Without it, Buy Points UI is disabled"],
                ["RAZORPAY_KEY_SECRET", "for payments", "Signature verification"],
                ["SMTP_HOST", "recommended", "Without it in dev, Ethereal test inbox is used"],
                ["SMTP_PORT", "recommended", "Usually 587"],
                ["SMTP_USER", "recommended", ""],
                ["SMTP_PASS", "recommended", "App password, not account password"],
                ["SMTP_FROM", "recommended", "NextDraft <noreply@nextdraft.app>"],
              ]}
            />

            <SubHeading>Frontend — <Code>nextdraft-frontend/.env.local</Code></SubHeading>
            <EnvTable
              rows={[
                ["NEXT_PUBLIC_API_BASE_URL", "yes", "Backend URL — https://api.example.com or http://localhost:5000"],
              ]}
            />
          </Section>

          {/* === Deployment === */}
          <Section id="deployment" icon={CheckCircle2} title="9. Deployment checklist">
            <p>Before going live, confirm every item:</p>
            <ul className="space-y-2">
              {[
                "Set strong JWT_SECRET (64+ random hex chars)",
                "Set FRONTEND_URL to exact production frontend URL(s)",
                "Set NODE_ENV=production so rate limits and security checks kick in",
                "Set MONGODB_URI to Atlas (not local)",
                "Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET to LIVE keys (not test)",
                "Set SMTP credentials for production email",
                "Set Cloudinary credentials",
                "Set GEMINI_API_KEY (and confirm quota)",
                "Set NEXT_PUBLIC_API_BASE_URL on Vercel to the Render URL",
                "Run node scripts/promote_admin.js <your-email> on the production DB",
                "Verify a test payment goes through in Razorpay live mode",
                "Verify a banned user really is locked out",
                "Verify password reset email arrives",
                "Open /admin and confirm stats load",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
        <Icon className="h-5 w-5 text-purple-700" />
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-500">{children}</h3>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-800">
      {children}
    </code>
  );
}

function RouteCard({
  icon: Icon,
  title,
  href,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-purple-300 hover:bg-purple-50"
    >
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-purple-700" />
        <span className="text-sm font-semibold">{title}</span>
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-700" />
      </div>
      <div className="text-xs text-slate-500">{href}</div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
    </a>
  );
}

const toneClasses = {
  purple: { wrap: "border-purple-200 bg-purple-50/40", icon: "text-purple-700 bg-purple-100" },
  emerald: { wrap: "border-emerald-200 bg-emerald-50/40", icon: "text-emerald-700 bg-emerald-100" },
  rose: { wrap: "border-rose-200 bg-rose-50/40", icon: "text-rose-700 bg-rose-100" },
  amber: { wrap: "border-amber-200 bg-amber-50/40", icon: "text-amber-700 bg-amber-100" },
  blue: { wrap: "border-blue-200 bg-blue-50/40", icon: "text-blue-700 bg-blue-100" },
  teal: { wrap: "border-teal-200 bg-teal-50/40", icon: "text-teal-700 bg-teal-100" },
  slate: { wrap: "border-slate-200 bg-white", icon: "text-slate-600 bg-slate-100" },
} as const;

function FeatureCard({
  icon: Icon,
  title,
  tone = "slate",
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  tone?: keyof typeof toneClasses;
  children: React.ReactNode;
}) {
  const t = toneClasses[tone];
  return (
    <div className={`not-prose rounded-lg border ${t.wrap} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${t.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      <div className="space-y-2 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

function Workflow({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="not-prose rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
      <ol className="space-y-2">
        {steps.map((step, idx) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-700">
              {idx + 1}
            </span>
            <span className="leading-6 text-slate-700">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ApiTable({ rows }: { rows: string[][] }) {
  return (
    <div className="not-prose overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2">Method</th>
            <th className="px-3 py-2">Path</th>
            <th className="px-3 py-2">Body / Query</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([method, path, body, notes]) => (
            <tr key={`${method}-${path}`} className="border-t border-slate-100">
              <td className="px-3 py-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                  {method}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[11px]">{path}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{body}</td>
              <td className="px-3 py-2 text-slate-600">{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvTable({ rows }: { rows: string[][] }) {
  return (
    <div className="not-prose overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2">Variable</th>
            <th className="px-3 py-2">Required</th>
            <th className="px-3 py-2">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, required, purpose]) => (
            <tr key={name} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono text-[11px]">{name}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    required.startsWith("yes")
                      ? "bg-rose-100 text-rose-700"
                      : required === "recommended" || required.includes("for")
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {required}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600">{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "rose" | "amber" | "slate"; children: React.ReactNode }) {
  const classes = {
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${classes[tone]}`}>
      {children}
    </span>
  );
}

function SecurityRow({ icon: Icon, text }: { icon: typeof Lock; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
      <span className="text-sm leading-5 text-slate-700">{text}</span>
    </div>
  );
}
