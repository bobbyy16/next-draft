"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, Download, History, Loader2, Save, Sparkles, Upload, Wallet } from "lucide-react";
import Link from "next/link";
import { getAuthToken, getUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";
import {
  BasicResumeTemplate,
  parseResumeDraft,
  serializeResumeDraft,
  type ResumeDraft,
} from "@/components/templates/ResumeTemplates";

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

interface SuggestionHistory {
  _id: string;
  appliedCount?: number;
  pointsSpent?: number;
  jobTitle?: string;
  suggestions: Suggestion[];
  createdAt: string;
}

interface OptimizeResult {
  suggestion: {
    _id?: string;
    suggestions: Suggestion[];
  };
  resume: Resume;
  appliedCount: number;
  totalSuggestions: number;
  pointsBalance?: number;
}

const sampleResume = `JANE CARTER
jane.carter@email.com
(555) 123-4567 | Austin, TX | linkedin.com/in/janecarter

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
- Customer support
- CRM
- Reporting
- Process improvement

EDUCATION
B.A. Business Administration | State University | 2019`;



export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [draft, setDraft] = useState<ResumeDraft>(parseResumeDraft(sampleResume));
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

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<SuggestionHistory[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [pointsBalance, setPointsBalance] = useState<number>(getUser()?.pointsBalance ?? 0);

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume._id === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (!selectedResume) return;
    setDraft(parseResumeDraft(selectedResume.parsedText || sampleResume));

    setSuggestions([]);
    setAppliedCount(0);
    setMessage("");
    setError("");
    fetchHistory(selectedResume._id);
  }, [selectedResume]);

  const persistUserPoints = (nextPoints: number) => {
    setPointsBalance(nextPoints);
    const user = getUser();
    if (user) {
      localStorage.setItem("user", JSON.stringify({ ...user, pointsBalance: nextPoints }));
    }
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load resumes");
      const data: Resume[] = await response.json();
      setResumes(data);
      if (data.length > 0) setSelectedResumeId(data[0]._id);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (resumeId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/suggestions/resume/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return setHistory([]);
      setHistory(await response.json());
    } catch {
      setHistory([]);
    }
  };

  const currentText = serializeResumeDraft(draft);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
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
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("resume", selectedFile);
      const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");
      setSelectedFile(null);
      setMessage("Resume uploaded. You can optimize it now.");
      await fetchResumes();
      setSelectedResumeId(data.resume._id);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveResume = async () => {
    if (!selectedResumeId) {
      setError("Upload or select a resume first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/resumes/${selectedResumeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parsedText: currentText, isEdited: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Save failed");
      setResumes((current) =>
        current.map((resume) => (resume._id === data.resume._id ? data.resume : resume))
      );
      setMessage("Resume edits saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const optimizeAndApply = async () => {
    if (!selectedResumeId) {
      setError("Upload or select a resume first.");
      return;
    }
    if (jobText.trim().length < 40) {
      setError("Paste the target job description before optimizing.");
      return;
    }

    setOptimizing(true);
    setError("");
    setMessage("");

    try {
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/api/resumes/${selectedResumeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parsedText: currentText, isEdited: true }),
      });

      const response = await fetch(`${API_BASE_URL}/api/suggestions/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescriptionText: jobText,
          roleTitle,
          companyName,
        }),
      });
      const data: OptimizeResult & { message?: string } = await response.json();
      if (!response.ok) throw new Error(data.message || "AI optimize failed");

      setDraft(parseResumeDraft(data.resume.parsedText));

      setSuggestions(data.suggestion.suggestions ?? []);
      setAppliedCount(data.appliedCount);
      if (typeof data.pointsBalance === "number") persistUserPoints(data.pointsBalance);
      setResumes((current) =>
        current.map((resume) => (resume._id === data.resume._id ? data.resume : resume))
      );
      fetchHistory(data.resume._id);
      setMessage(
        data.appliedCount > 0
          ? `Applied ${data.appliedCount} AI change${data.appliedCount === 1 ? "" : "s"} to your resume.`
          : "AI analysis finished. No safe exact-text changes were applied."
      );
    } catch (optimizeError) {
      setError(optimizeError instanceof Error ? optimizeError.message : "AI optimize failed");
    } finally {
      setOptimizing(false);
    }
  };

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
              .editor-only { display: none !important; }
              @page { size: letter portrait; margin: 0; }
            }
            [contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: #94a3b8;
            }
          `,
        }}
      />

      <div className="min-h-screen bg-slate-100 text-slate-950">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-4 lg:p-6">
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
                  Edit directly inside the basic resume template, save the draft, then run AI optimization when needed.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/profile"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                >
                  <Wallet className="h-4 w-4" />
                  {pointsBalance} pts
                </Link>
                <button
                  onClick={saveResume}
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

          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
            <aside className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold">Resume</h2>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Select resume</label>
                    <select
                      value={selectedResumeId}
                      onChange={(event) => setSelectedResumeId(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      {resumes.length === 0 ? (
                        <option value="">No resumes found</option>
                      ) : (
                        resumes.map((resume) => (
                          <option key={resume._id} value={resume._id}>
                            {resume.fileName}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-slate-500">
                      {resumes.length}/5 resumes used. Manage uploads and deletes in{" "}
                      <Link href="/dashboard/library" className="font-semibold text-teal-700 hover:text-teal-800">
                        Resume & JDs
                      </Link>
                      .
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={resumes.length >= 5}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    onClick={uploadResume}
                    disabled={uploading || !selectedFile || resumes.length >= 5}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload resume
                  </button>
                  {resumes.length >= 5 && (
                    <p className="text-xs text-rose-600">
                      Resume limit reached. Delete a resume from Resume & JDs before uploading another.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold">AI improve</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Reviews your resume against the job description and applies safe wording changes. Costs 50 points per run.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    value={roleTitle}
                    onChange={(event) => setRoleTitle(event.target.value)}
                    placeholder="Target role, optional"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  />
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Company, optional"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  />
                  <textarea
                    value={jobText}
                    onChange={(event) => setJobText(event.target.value)}
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
                    <p className="text-xs text-rose-600">Add points in Profile before running another AI edit.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold">History</h2>
                </div>
                <div className="max-h-72 divide-y divide-slate-200 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="py-3 text-sm text-slate-500">No AI edit history for this resume yet.</p>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => {
                          setSuggestions(item.suggestions ?? []);
                          setAppliedCount(item.appliedCount ?? 0);
                        }}
                        className="block w-full py-3 text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium">{item.jobTitle || "Target role"}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()} · {item.pointsSpent ?? 0} points
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </aside>

            <main className="min-h-[calc(100vh-160px)]">
              <section className="min-h-[640px] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <div className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
                  <h2 className="text-sm font-semibold">Edit directly in the basic resume template</h2>
                  <span className="text-xs text-slate-500">Click any field and edit in place</span>
                </div>
                <div id="resume-print-area" className="h-[calc(100%-45px)] overflow-auto p-4">
                  <BasicResumeTemplate draft={draft} editable onChange={setDraft} />
                </div>
              </section>
            </main>

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
                    <p className="text-sm text-slate-500">Run AI improve to see suggestions.</p>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <div key={`${suggestion.type}-${index}`} className="rounded-md border border-slate-200 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                          <Check className={`h-3.5 w-3.5 ${suggestion.applied ? "text-emerald-600" : "text-slate-400"}`} />
                          <span
                            className={
                              suggestion.priority === "high"
                                ? "text-rose-600"
                                : suggestion.priority === "medium"
                                  ? "text-amber-600"
                                  : "text-teal-700"
                            }
                          >
                            {suggestion.priority}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{suggestion.type.replace(/_/g, " ")}</span>
                        </div>
                        {suggestion.originalText && (
                          <p className="mt-1 text-[11px] leading-4 text-rose-600 line-through">
                            {suggestion.originalText.length > 120
                              ? `${suggestion.originalText.slice(0, 120)}...`
                              : suggestion.originalText}
                          </p>
                        )}
                        {suggestion.suggestedText && (
                          <p className="mt-0.5 text-[11px] font-medium leading-4 text-emerald-700">
                            {suggestion.suggestedText.length > 120
                              ? `${suggestion.suggestedText.slice(0, 120)}...`
                              : suggestion.suggestedText}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{suggestion.explanation}</p>
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
