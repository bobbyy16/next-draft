"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Clock,
  FileText,
  Gauge,
  Sparkles,
  TrendingUp,
  Upload,
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
  appliedCount?: number;
  pointsSpent?: number;
  jobTitle?: string;
  createdAt: string;
}

/* ── Page ──────────────────────────────────────── */

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [recentOptimizations, setRecentOptimizations] = useState<SuggestionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const fetchData = useCallback(async () => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${API_BASE_URL}/api/resumes`, { headers });
      if (!response.ok) return;
      const resumeData: Resume[] = await response.json();
      setResumes(resumeData);

      // Fetch recent optimization history from all resumes
      const allHistory: SuggestionHistory[] = [];
      await Promise.all(
        resumeData.slice(0, 5).map(async (resume) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/suggestions/resume/${resume._id}`, { headers });
            if (res.ok) {
              const data: SuggestionHistory[] = await res.json();
              allHistory.push(...data);
            }
          } catch { /* skip */ }
        })
      );
      allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentOptimizations(allHistory.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const editedCount = resumes.filter((r) => r.isEdited).length;
  const ledger = [...(user?.pointsLedger ?? [])].reverse().slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Welcome header */}
        <header className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Sparkles className="h-4 w-4" />
                Resume workspace
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Upload a resume, paste a job description, apply AI changes, edit the resume template, and export.
              </p>
            </div>
            <Link href="/dashboard/resumes">
              <button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                Open optimizer
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <FileText className="mb-4 h-5 w-5 text-slate-500" />
            <div className="text-3xl font-semibold">{loading ? "--" : resumes.length}</div>
            <div className="text-sm text-slate-600">Uploaded resumes</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Gauge className="mb-4 h-5 w-5 text-slate-500" />
            <div className="text-3xl font-semibold">{loading ? "--" : editedCount}</div>
            <div className="text-sm text-slate-600">AI or manual edits</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Upload className="mb-4 h-5 w-5 text-slate-500" />
            <div className="text-3xl font-semibold">1</div>
            <div className="text-sm text-slate-600">Basic resume template</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Wallet className="mb-4 h-5 w-5 text-teal-600" />
            <div className="text-3xl font-semibold">{user?.pointsBalance ?? 0}</div>
            <div className="text-sm text-slate-600">Points balance</div>
          </div>
        </section>

        {/* Recent activity row */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent resumes */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Recent resumes</h2>
              <Link href="/dashboard/activity" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-200">
              {resumes.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No resumes yet. Open the optimizer and upload your first resume.
                </div>
              ) : (
                resumes.slice(0, 3).map((resume) => (
                  <div key={resume._id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{resume.fileName}</div>
                      <div className="text-xs text-slate-500">
                        Version {resume.version} · {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link href="/dashboard/resumes">
                      <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent optimization runs + points */}
          <div className="space-y-5">
            {/* Recent AI runs */}
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold">Recent optimizations</h2>
                </div>
                <Link href="/dashboard/activity" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">
                  See all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentOptimizations.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">No AI runs yet.</div>
                ) : (
                  recentOptimizations.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.jobTitle || "Untitled role"}</div>
                        <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                      </div>
                      <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                        {item.appliedCount ?? 0} changes
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent points */}
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold">Points history</h2>
                </div>
                <Link href="/dashboard/activity" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">
                  See all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {ledger.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">No point activity yet.</div>
                ) : (
                  ledger.map((item, i) => (
                    <div key={`${item.createdAt}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{item.reason || "Point activity"}</div>
                        <div className="text-xs text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${item.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.type === "credit" ? "+" : "−"}{item.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
