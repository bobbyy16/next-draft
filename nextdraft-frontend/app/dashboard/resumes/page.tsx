"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Check,
  Download,
  Italic,
  List,
  Loader2,
  Redo2,
  Save,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken, getUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";
import { BasicResumeTemplate } from "@/components/templates/ResumeTemplates";

/* ── Types ─────────────────────────────────────── */

interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  parsedText: string;
  version: number;
  isEdited: boolean;
  createdAt: string;
}

interface Suggestion {
  type: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  priority: "high" | "medium" | "low";
  applied?: boolean;
}

interface OptimizeResult {
  suggestion: {
    overallScore: number;
    suggestions: Suggestion[];
  };
  resume: Resume;
  appliedCount: number;
  totalSuggestions: number;
  pointsBalance?: number;
}

/* ── Constants ─────────────────────────────────── */

const DEFAULT_ATS_SCORE = 0;

const sampleResume = `JANE CARTER
jane.carter@email.com | (555) 123-4567 | Austin, TX | linkedin.com/in/janecarter

SUMMARY
Customer operations specialist with 4 years of experience improving support workflows, resolving escalations, and coordinating cross-functional projects.

EXPERIENCE
Customer Operations Specialist | BrightDesk | 2021 - Present
- Managed daily customer requests across email, chat, and phone channels.
- Improved onboarding documentation for new team members.
- Coordinated with product and sales teams to resolve account issues.

Support Associate | Northstar Services | 2019 - 2021
- Responded to customer tickets and maintained service records.
- Trained new hires on internal tools and support processes.

SKILLS
Customer support, CRM, reporting, process improvement, onboarding, documentation

EDUCATION
B.A. Business Administration | State University | 2019`;

/* ── Components ────────────────────────────────── */

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : score >= 55
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : score > 0
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-500";

  return (
    <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-2 ${color}`}>
      <span className="text-2xl font-bold">{score || "--"}</span>
      <span className="text-[10px] font-semibold uppercase">ATS Score</span>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeText, setResumeText] = useState(sampleResume);
  const [jobText, setJobText] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [atsScore, setAtsScore] = useState(DEFAULT_ATS_SCORE);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [pointsBalance, setPointsBalance] = useState<number>(getUser()?.pointsBalance ?? 0);
  const templateRef = useRef<HTMLDivElement>(null);

  const selectedResume = useMemo(
    () => resumes.find((r) => r._id === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (!selectedResume) return;
    setResumeText(selectedResume.parsedText || sampleResume);
    setAtsScore(DEFAULT_ATS_SCORE);
    setSuggestions([]);
    setAppliedCount(0);
    setMessage("");
    setError("");
  }, [selectedResume]);

  /* ── API helpers ──────────────────────────────── */

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load resumes");
      const data: Resume[] = await res.json();
      setResumes(data);
      if (data.length > 0) setSelectedResumeId(data[0]._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const syncTemplateText = () => {
    const value = templateRef.current?.innerText?.trim();
    if (value) {
      setResumeText(value);
      return value;
    }
    return resumeText;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setError("");
  };

  const uploadResume = async () => {
    if (!selectedFile) {
      setError("Choose a PDF or Word resume first.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      syncTemplateText();
      const token = getAuthToken();
      const fd = new FormData();
      fd.append("resume", selectedFile);
      const res = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setSelectedFile(null);
      setMessage("Resume uploaded. You can optimize it now.");
      await fetchResumes();
      setSelectedResumeId(data.resume._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const optimizeAndApply = async () => {
    if (!selectedResumeId) { setError("Upload or select a resume first."); return; }
    if (jobText.trim().length < 40) { setError("Paste the target job description before optimizing."); return; }
    setOptimizing(true);
    setError("");
    setMessage("");
    try {
      const latestText = syncTemplateText();
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/api/resumes/${selectedResumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ parsedText: latestText, isEdited: true }),
      });
      const res = await fetch(`${API_BASE_URL}/api/suggestions/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeId: selectedResumeId, jobDescriptionText: jobText, roleTitle, companyName }),
      });
      const data: OptimizeResult & { message?: string } = await res.json();
      if (!res.ok) throw new Error(data.message || "AI optimize failed");

      setResumeText(data.resume.parsedText);
      setAtsScore(data.suggestion.overallScore);
      setSuggestions(data.suggestion.suggestions ?? []);
      setAppliedCount(data.appliedCount);
      if (typeof data.pointsBalance === "number") {
        setPointsBalance(data.pointsBalance);
        const user = getUser();
        if (user) localStorage.setItem("user", JSON.stringify({ ...user, pointsBalance: data.pointsBalance }));
      }
      setMessage(
        data.appliedCount > 0
          ? `Applied ${data.appliedCount} AI change${data.appliedCount === 1 ? "" : "s"} to your resume.`
          : "AI analysis finished. No safe exact-text changes were applied."
      );
      setResumes((prev) => prev.map((r) => (r._id === data.resume._id ? data.resume : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI optimize failed");
    } finally {
      setOptimizing(false);
    }
  };

  const saveManualEdits = async () => {
    if (!selectedResumeId) { setError("Upload or select a resume first."); return; }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const latestText = syncTemplateText();
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/resumes/${selectedResumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ parsedText: latestText, isEdited: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setMessage("Resume edits saved.");
      setResumes((prev) => prev.map((r) => (r._id === data.resume._id ? data.resume : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── Editor helpers ──────────────────────────── */

  const execCmd = (cmd: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand(cmd, false);
  };



  /* ── Render ──────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden !important; }
              #resume-print-area, #resume-print-area * { visibility: visible !important; }
              #resume-print-area { position: absolute; left: 0; top: 0; width: 100%; }
              @page { size: letter portrait; margin: 0; }
            }
          `,
        }}
      />
      <div className="min-h-screen bg-slate-100 text-slate-950">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-4 lg:p-6">
          {/* Header */}
          <header className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <Sparkles className="h-4 w-4" />
                  One-click resume optimizer
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                  Resume Optimizer
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Upload a resume, paste a job description, let AI optimize, then fine-tune in the editor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/dashboard/activity" className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-100">
                  <Wallet className="h-4 w-4" />
                  {pointsBalance} pts
                </Link>
                <button
                  onClick={saveManualEdits}
                  disabled={saving || !selectedResumeId}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save edits
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </header>

          {/* Flash messages */}
          {(message || error) && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                error
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {error || message}
            </div>
          )}

          {/* Main layout: sidebar + editor + applied changes */}
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)_280px]">
            {/* Left sidebar */}
            <aside className="space-y-4">
              {/* Upload / Select */}
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold">Resume</h2>
                </div>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                  />
                  <button
                    onClick={uploadResume}
                    disabled={uploading || !selectedFile}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload resume
                  </button>
                  {resumes.length > 0 && (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>{r.fileName}</option>
                      ))}
                    </select>
                  )}
                </div>
              </section>

              {/* AI Optimize */}
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-4">
                  <ScoreBadge score={atsScore} />
                  <div>
                    <h2 className="text-sm font-semibold">AI optimize</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Runs ATS analysis and applies safe changes. Costs 50 points per run.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Target role, optional"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  />
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company, optional"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  />
                  <textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    rows={9}
                    placeholder="Paste the full job description here..."
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-teal-600"
                  />
                  <button
                    onClick={optimizeAndApply}
                    disabled={optimizing || !selectedResumeId || jobText.trim().length < 40 || pointsBalance < 50}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI apply changes
                  </button>
                  {pointsBalance < 50 && (
                    <p className="text-xs text-rose-600">Add points from Profile to run another AI edit.</p>
                  )}
                </div>
              </section>
            </aside>

            {/* Center: editor */}
            <main className="min-h-[calc(100vh-160px)]">
              <section className="min-h-[640px] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-4 py-2">
                  <h2 className="text-sm font-semibold">Basic ATS template</h2>
                  <div className="flex items-center gap-1">
                    {[
                      { cmd: "bold", icon: Bold, title: "Bold" },
                      { cmd: "italic", icon: Italic, title: "Italic" },
                      { cmd: "underline", icon: Underline, title: "Underline" },
                      { cmd: "strikeThrough", icon: Strikethrough, title: "Strikethrough" },
                      { cmd: "insertUnorderedList", icon: List, title: "Bullet list" },
                    ].map(({ cmd, icon: Icon, title }) => (
                      <button key={cmd} title={title} onMouseDown={execCmd(cmd)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                    <span className="mx-1 h-5 w-px bg-slate-200" />
                    <button title="Undo" onMouseDown={execCmd("undo")} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button title="Redo" onMouseDown={execCmd("redo")} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                      <Redo2 className="h-4 w-4" />
                    </button>

                  </div>
                </div>
                {/* Editor */}
                <div id="resume-print-area" className="h-[calc(100%-49px)] overflow-auto p-4">
                  <div
                    ref={templateRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={() => syncTemplateText()}
                    className="mx-auto max-w-[816px] outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <BasicResumeTemplate parsedText={resumeText} />
                  </div>
                </div>
              </section>
            </main>

            {/* Right sidebar: applied changes */}
            <aside>
              <section className="sticky top-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Applied changes</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {appliedCount}/{suggestions.length}
                  </span>
                </div>
                <div className="max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-500">Run AI optimize to see the ATS suggestions.</p>
                  ) : (
                    suggestions.map((s, i) => (
                      <div key={`${s.type}-${i}`} className="rounded-md border border-slate-200 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                          <Check className={`h-3.5 w-3.5 ${s.applied ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className={s.priority === "high" ? "text-rose-600" : s.priority === "medium" ? "text-amber-600" : "text-teal-700"}>
                            {s.priority}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{s.type.replace(/_/g, " ")}</span>
                        </div>
                        {s.originalText && (
                          <p className="mt-1 text-[11px] leading-4 text-rose-600 line-through">{s.originalText.length > 120 ? s.originalText.slice(0, 120) + "…" : s.originalText}</p>
                        )}
                        {s.suggestedText && (
                          <p className="mt-0.5 text-[11px] leading-4 font-medium text-emerald-700">{s.suggestedText.length > 120 ? s.suggestedText.slice(0, 120) + "…" : s.suggestedText}</p>
                        )}
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{s.explanation}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
