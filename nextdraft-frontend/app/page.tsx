"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Gauge,
  Menu,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { getUser } from "@/lib/auth";

const workflow = [
  {
    icon: Upload,
    title: "Upload one resume",
    text: "Use your current PDF or Word resume. NextDraft extracts the content for editing.",
  },
  {
    icon: Sparkles,
    title: "Paste one job description",
    text: "The optimizer compares your resume with the role and finds safe wording upgrades.",
  },
  {
    icon: MousePointerClick,
    title: "Apply AI changes",
    text: "One click applies exact-text improvements and saves the updated resume.",
  },
  {
    icon: Gauge,
    title: "Edit and export",
    text: "Review the ATS score, edit the basic template, and export a clean PDF.",
  },
];

const benefits = [
  "One basic ATS-friendly resume template",
  "AI changes applied in one click",
  "Manual text editor for final control",
  "ATS score after every optimization",
  "No prompt writing or template switching",
  "PDF export from the live preview",
];

const sampleResume = `ALEX MORGAN
alex@email.com | Bengaluru, IN | linkedin.com/in/alexmorgan

SUMMARY
Operations analyst improving onboarding, reporting, and customer workflows.

EXPERIENCE
Operations Analyst | BrightDesk | 2022 - Present
- Improved team reporting and reduced manual follow-up work.
- Coordinated customer escalations across support and product teams.

SKILLS
Reporting, CRM, process improvement, customer operations`;

export default function LandingPage() {
  const [user, setUser] = useState<import("@/lib/auth").User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-normal">NextDraft</div>
              <div className="text-xs text-slate-500">ATS resume editor</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="#workflow" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Workflow
            </Link>
            <Link href="#features" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Features
            </Link>
            <Link href="#preview" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Preview
            </Link>
            {user ? (
              <Link href="/dashboard">
                <button className="ml-2 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="ml-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Log in
                </Link>
                <Link href="/auth/register">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                    Start free <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </>
            )}
          </nav>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md border border-slate-200 bg-white p-2 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <Link onClick={() => setMenuOpen(false)} href="#workflow" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700">
                Workflow
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="#features" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700">
                Features
              </Link>
              <Link onClick={() => setMenuOpen(false)} href={user ? "/dashboard" : "/auth/register"} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                {user ? "Dashboard" : "Start free"}
              </Link>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-6 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Sparkles className="h-3.5 w-3.5" />
            One-click AI resume changes
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
            Build one ATS resume for the job you want.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 lg:text-lg">
            NextDraft is a focused resume optimizer. Upload your resume, paste a job description, let AI apply safe changes, then edit a clean basic template before exporting.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={user ? "/dashboard/resumes" : "/auth/register"}>
              <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto">
                Optimize my resume <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto">
                Log in
              </button>
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["No prompts", "One template", "ATS score"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Check className="h-4 w-4 text-teal-700" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div id="preview" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Live resume preview</div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              82 ATS
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-slate-700">
              {sampleResume}
            </pre>
          </div>
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-teal-900">
              <ShieldCheck className="h-4 w-4" />
              Safe AI edit applied
            </div>
            <p className="text-xs leading-5 text-teal-800">
              Reworded an existing operations bullet to include target keywords without inventing new experience.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-normal">One workflow, no clutter</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The product is intentionally narrow: optimize one resume against one job description and keep editing in one basic ATS template.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <item.icon className="mb-5 h-5 w-5 text-teal-700" />
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Built for people who just need the resume fixed.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No prompt engineering. No template marketplace. No separate suggestions page. The app does the change and lets you review it.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <Check className="h-4 w-4 shrink-0 text-teal-700" />
                <span className="text-sm font-medium text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="rounded-xl bg-slate-950 p-6 text-white lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal">Ready to optimize your first resume?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Create an account, upload a resume, paste the job description, and run the one-click AI optimizer.
              </p>
            </div>
            <Link href={user ? "/dashboard/resumes" : "/auth/register"}>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 sm:w-auto">
                Get started <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>NextDraft &#169; {new Date().getFullYear()}. Focused ATS resume optimization.</div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-slate-950">Login</Link>
            <Link href="/auth/register" className="hover:text-slate-950">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
