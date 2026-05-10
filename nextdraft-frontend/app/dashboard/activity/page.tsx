"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken, getUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

/* ── Types ─────────────────────────────────────── */

interface Resume {
  _id: string;
  fileName: string;
  version: number;
  isEdited: boolean;
  createdAt: string;
}

interface SuggestionHistory {
  _id: string;
  resumeId: string;
  overallScore: number;
  appliedCount?: number;
  pointsSpent?: number;
  jobTitle?: string;
  createdAt: string;
}

interface LedgerEntry {
  type: "credit" | "debit";
  points: number;
  rupees?: number;
  reason?: string;
  createdAt?: string;
}

/* ── Helpers ───────────────────────────────────── */

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 55
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      <TrendingUp className="h-3 w-3" />
      {score}
    </span>
  );
}

/* ── Page ──────────────────────────────────────── */

export default function ActivityPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [history, setHistory] = useState<SuggestionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resumes" | "points">("resumes");

  const user = getUser();
  const ledger: LedgerEntry[] = [...(user?.pointsLedger ?? [])].reverse();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [resumeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/resumes`, { headers }),
      ]);

      if (!resumeRes.ok) throw new Error("Failed to load resumes");
      const resumeData: Resume[] = await resumeRes.json();
      setResumes(resumeData);

      // Fetch suggestion history for all resumes
      const allHistory: SuggestionHistory[] = [];
      await Promise.all(
        resumeData.map(async (resume) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/suggestions/resume/${resume._id}`, { headers });
            if (res.ok) {
              const data: SuggestionHistory[] = await res.json();
              allHistory.push(...data.map((item) => ({ ...item, resumeId: resume._id })));
            }
          } catch {
            /* skip failed fetches */
          }
        })
      );

      allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(allHistory);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resumeMap = new Map(resumes.map((r) => [r._id, r]));

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const tabs = [
    { key: "resumes" as const, label: "Resume History", icon: FileText },
    { key: "points" as const, label: "Points History", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Header */}
        <header>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to overview
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <Clock className="h-4 w-4" />
            Activity center
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">History</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            View all your resume optimization runs and points transactions in one place.
          </p>
        </header>

        {/* Stats row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <FileText className="mb-3 h-5 w-5 text-slate-400" />
            <div className="text-3xl font-semibold">{resumes.length}</div>
            <div className="text-sm text-slate-500">Total resumes</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Sparkles className="mb-3 h-5 w-5 text-slate-400" />
            <div className="text-3xl font-semibold">{history.length}</div>
            <div className="text-sm text-slate-500">AI optimizations run</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Wallet className="mb-3 h-5 w-5 text-teal-600" />
            <div className="text-3xl font-semibold">{user?.pointsBalance ?? 0}</div>
            <div className="text-sm text-slate-500">Points balance</div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "resumes" ? (
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-semibold">All optimization runs</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No AI optimization runs yet. Go to the{" "}
                  <Link href="/dashboard/resumes" className="font-semibold text-teal-700 underline">
                    Resume Optimizer
                  </Link>{" "}
                  to run your first analysis.
                </div>
              ) : (
                history.map((item) => {
                  const resume = resumeMap.get(item.resumeId);
                  return (
                    <div key={item._id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {item.jobTitle || "Untitled role"}
                          </span>
                          <ScorePill score={item.overallScore} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {resume && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {resume.fileName}
                            </span>
                          )}
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                          {item.pointsSpent ? <span>· {item.pointsSpent} pts</span> : null}
                          {item.appliedCount ? (
                            <span>· {item.appliedCount} changes applied</span>
                          ) : null}
                        </div>
                      </div>
                      <Link href="/dashboard/resumes">
                        <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Open optimizer
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-semibold">All point transactions</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No point activity yet. Buy points from your{" "}
                  <Link href="/dashboard/profile" className="font-semibold text-teal-700 underline">
                    Profile
                  </Link>{" "}
                  to get started.
                </div>
              ) : (
                ledger.map((item, index) => (
                  <div
                    key={`${item.createdAt}-${index}`}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.reason || "Point activity"}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        item.type === "credit" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {item.type === "credit" ? "+" : "−"}
                      {item.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
