"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  History,
  Inbox,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { getUser, setUser, type User } from "@/lib/auth";
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

interface JobDescription {
  _id: string;
  parsedText: string;
  roleTitle: string;
  companyName: string;
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
  suggestion: { _id?: string; suggestions: Suggestion[] };
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

const MAX_RESUMES = 5;
const COST_PER_EDIT = 50;

type JdMode = "saved" | "paste";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJdId, setSelectedJdId] = useState("");
  const [jdMode, setJdMode] = useState<JdMode>("paste");
  const [draft, setDraft] = useState<ResumeDraft>(parseResumeDraft(sampleResume));
  const [jobText, setJobText] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewJd, setPreviewJd] = useState<JobDescription | null>(null);
  const [showMobileJd, setShowMobileJd] = useState(false);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<SuggestionHistory[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [pointsBalance, setPointsBalance] = useState<number>(getUser()?.pointsBalance ?? 0);
  const [capacityPct, setCapacityPct] = useState(0);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume._id === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );

  const selectedJd = useMemo(
    () => jds.find((j) => j._id === selectedJdId) ?? null,
    [jds, selectedJdId]
  );

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedResume) return;
    setDraft(parseResumeDraft(selectedResume.parsedText || sampleResume));
    void fetchHistory(selectedResume._id);
  }, [selectedResume]);

  useEffect(() => {
    if (jdMode !== "saved" || !selectedJd) return;
    setRoleTitle(selectedJd.roleTitle || "");
    setCompanyName(selectedJd.companyName || "");
    setJobText(selectedJd.parsedText || "");
  }, [jdMode, selectedJd]);

  // Live-measure resume content vs. one letter page (1056px at 96dpi).
  // Counts actual rendered child block heights to avoid the article's min-height filler.
  useEffect(() => {
    if (!printAreaRef.current) return;
    const PAGE_HEIGHT = 1056;
    const root = printAreaRef.current;

    const measure = () => {
      const article = root.querySelector("article");
      if (!article) {
        setCapacityPct(0);
        return;
      }
      const cs = getComputedStyle(article);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      let contentHeight = padTop + padBottom;
      Array.from(article.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          contentHeight += child.offsetHeight;
          const m = getComputedStyle(child);
          contentHeight += (parseFloat(m.marginTop) || 0) + (parseFloat(m.marginBottom) || 0);
        }
      });
      setCapacityPct(Math.round((contentHeight / PAGE_HEIGHT) * 100));
    };

    measure();
    const observer = new ResizeObserver(measure);
    const article = root.querySelector("article");
    if (article) observer.observe(article);
    Array.from(article?.children || []).forEach((child) => {
      if (child instanceof HTMLElement) observer.observe(child);
    });
    return () => observer.disconnect();
  }, [draft, selectedResumeId]);

  const persistUserPoints = (nextPoints: number) => {
    setPointsBalance(nextPoints);
    const user = getUser();
    if (user) setUser({ ...user, pointsBalance: nextPoints });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resumeData, jdData] = await Promise.all([
        api.get<Resume[]>("/api/resumes"),
        api.get<JobDescription[]>("/api/job-descriptions"),
      ]);
      setResumes(resumeData);
      setJds(jdData);
      if (resumeData.length > 0 && !selectedResumeId) setSelectedResumeId(resumeData[0]._id);
      if (jdData.length > 0) setJdMode("saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (resumeId: string) => {
    try {
      const data = await api.get<SuggestionHistory[]>(`/api/suggestions/resume/${resumeId}`);
      setHistory(data);
      // Auto-load the most recent run into the AI changes panel
      if (data.length > 0) {
        setSuggestions(data[0].suggestions ?? []);
        setAppliedCount(data[0].appliedCount ?? 0);
      } else {
        setSuggestions([]);
        setAppliedCount(0);
      }
    } catch {
      setHistory([]);
      setSuggestions([]);
      setAppliedCount(0);
    }
  };

  const currentText = serializeResumeDraft(draft);

  const uploadResume = async () => {
    if (!selectedFile) {
      toast.error("Choose a PDF or Word resume first.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      const data = await api.post<{ resume: Resume }>("/api/resumes/upload", formData);
      setSelectedFile(null);
      const fileInput = document.getElementById("resume-file-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      toast.success("Resume uploaded");
      await fetchAll();
      setSelectedResumeId(data.resume._id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveResume = async () => {
    if (!selectedResumeId) {
      toast.error("Upload or select a resume first.");
      return;
    }
    setSaving(true);
    try {
      const data = await api.patch<{ resume: Resume }>(`/api/resumes/${selectedResumeId}`, {
        parsedText: currentText,
        isEdited: true,
      });
      setResumes((current) =>
        current.map((resume) => (resume._id === data.resume._id ? data.resume : resume))
      );
      toast.success("Edits saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const optimizeAndApply = async () => {
    if (!selectedResumeId) {
      toast.error("Select a resume first");
      return;
    }
    const finalJobText = jdMode === "saved" ? selectedJd?.parsedText || "" : jobText;
    if (finalJobText.trim().length < 40) {
      toast.error(
        jdMode === "saved"
          ? "Pick a saved job description first"
          : "Paste a job description (40+ characters)"
      );
      return;
    }
    if (pointsBalance < COST_PER_EDIT) {
      toast.error("Not enough points", {
        action: {
          label: "Buy points",
          onClick: () => (window.location.href = "/dashboard/profile"),
        },
      });
      return;
    }

    setOptimizing(true);
    try {
      await api.patch(`/api/resumes/${selectedResumeId}`, {
        parsedText: currentText,
        isEdited: true,
      });

      const data = await api.post<OptimizeResult>("/api/suggestions/optimize", {
        resumeId: selectedResumeId,
        jobDescriptionText: finalJobText,
        roleTitle: jdMode === "saved" ? selectedJd?.roleTitle || "" : roleTitle,
        companyName: jdMode === "saved" ? selectedJd?.companyName || "" : companyName,
      });

      setDraft(parseResumeDraft(data.resume.parsedText));
      setSuggestions(data.suggestion.suggestions ?? []);
      setAppliedCount(data.appliedCount);
      if (typeof data.pointsBalance === "number") persistUserPoints(data.pointsBalance);
      setResumes((current) =>
        current.map((resume) => (resume._id === data.resume._id ? data.resume : resume))
      );
      void fetchHistory(data.resume._id);

      if (data.appliedCount > 0) {
        toast.success(
          `Applied ${data.appliedCount} AI change${data.appliedCount === 1 ? "" : "s"}`
        );
      } else {
        toast.info("AI analysis finished. No safe exact-text changes were applied.");
      }
      setShowMobileJd(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        toast.error(err.message, {
          action: {
            label: "Add points",
            onClick: () => (window.location.href = "/dashboard/profile"),
          },
        });
      } else {
        toast.error(err instanceof ApiError ? err.message : "AI optimize failed");
      }
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const resumesUsed = resumes.length;
  const resumeLimitReached = resumesUsed >= MAX_RESUMES;
  const finalJobTextLen =
    (jdMode === "saved" ? selectedJd?.parsedText || "" : jobText).trim().length;
  const canOptimize =
    Boolean(selectedResumeId) && finalJobTextLen >= 40 && pointsBalance >= COST_PER_EDIT && !optimizing;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                min-height: 0 !important;
                background: #fff !important;
                overflow: visible !important;
              }
              /* Collapse every container so body height is dominated only by the print area */
              body * {
                min-height: 0 !important;
                max-height: none !important;
                box-shadow: none !important;
              }
              body * { visibility: hidden !important; }
              #resume-print-area,
              #resume-print-area * {
                visibility: visible !important;
              }
              #resume-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                right: 0 !important;
                width: 100% !important;
                max-width: none !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                overflow: visible !important;
              }
              #resume-print-area article {
                margin: 0 auto !important;
                width: 100% !important;
                max-width: none !important;
                min-height: 0 !important;
                height: auto !important;
                background: #fff !important;
                page-break-inside: auto;
              }
              /* Avoid orphan/widow breaks inside list items */
              #resume-print-area section,
              #resume-print-area li,
              #resume-print-area p {
                page-break-inside: avoid;
              }
              .editor-only { display: none !important; }
              @page {
                size: letter portrait;
                margin: 0;
              }
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
          {/* HEADER */}
          <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Resume optimizer
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {selectedResume ? selectedResume.fileName : "Optimize your resume"}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Edit the resume template, pick a job description, then apply AI changes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/profile"
                  className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    pointsBalance >= COST_PER_EDIT
                      ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span className="font-mono">{pointsBalance}</span>
                  <span className="hidden sm:inline">pts</span>
                </Link>
                <button
                  type="button"
                  onClick={saveResume}
                  disabled={saving || !selectedResumeId}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!selectedResumeId}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
            </div>

            {/* Mobile: open AI panel button */}
            <button
              type="button"
              onClick={() => setShowMobileJd(true)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 lg:hidden"
            >
              <Sparkles className="h-4 w-4" />
              Open AI optimizer
            </button>
          </header>

          {/* MAIN GRID */}
          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)_320px]">
            {/* LEFT RAIL */}
            <aside className="hidden flex-col gap-4 lg:flex">
              <ResumePicker
                resumes={resumes}
                selectedResumeId={selectedResumeId}
                onSelect={setSelectedResumeId}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                onUpload={uploadResume}
                uploading={uploading}
                resumeLimitReached={resumeLimitReached}
              />

              <JdPicker
                jds={jds}
                jdMode={jdMode}
                setJdMode={setJdMode}
                selectedJdId={selectedJdId}
                setSelectedJdId={setSelectedJdId}
                jobText={jobText}
                setJobText={setJobText}
                roleTitle={roleTitle}
                setRoleTitle={setRoleTitle}
                companyName={companyName}
                setCompanyName={setCompanyName}
                onPreview={setPreviewJd}
                selectedJd={selectedJd}
              />

              <OptimizeButton
                onClick={optimizeAndApply}
                canOptimize={canOptimize}
                optimizing={optimizing}
                pointsBalance={pointsBalance}
                missing={!selectedResumeId ? "resume" : finalJobTextLen < 40 ? "jd" : null}
              />

              <HistoryCard
                history={history}
                onSelect={(item) => {
                  setSuggestions(item.suggestions ?? []);
                  setAppliedCount(item.appliedCount ?? 0);
                }}
              />
            </aside>

            {/* CENTER: editor */}
            <main className="min-w-0">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold">Live preview</h2>
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      · Click any field to edit
                    </span>
                  </div>
                  {selectedResume && <PageCapacity pct={capacityPct} />}
                </div>
                <div
                  id="resume-print-area"
                  ref={printAreaRef}
                  className="max-h-[calc(100vh-200px)] overflow-auto bg-slate-200 p-4"
                >
                  {selectedResume ? (
                    <BasicResumeTemplate draft={draft} editable onChange={setDraft} />
                  ) : (
                    <EmptyResumeState />
                  )}
                </div>
              </section>
            </main>

            {/* RIGHT RAIL: suggestions */}
            <aside className="hidden lg:block">
              <SuggestionsPanel
                suggestions={suggestions}
                appliedCount={appliedCount}
                optimizing={optimizing}
              />
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile AI panel */}
      {showMobileJd && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 lg:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <h3 className="text-base font-semibold">AI optimizer</h3>
            <button
              type="button"
              onClick={() => setShowMobileJd(false)}
              aria-label="Close"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-4">
            <ResumePicker
              resumes={resumes}
              selectedResumeId={selectedResumeId}
              onSelect={setSelectedResumeId}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              onUpload={uploadResume}
              uploading={uploading}
              resumeLimitReached={resumeLimitReached}
            />
            <JdPicker
              jds={jds}
              jdMode={jdMode}
              setJdMode={setJdMode}
              selectedJdId={selectedJdId}
              setSelectedJdId={setSelectedJdId}
              jobText={jobText}
              setJobText={setJobText}
              roleTitle={roleTitle}
              setRoleTitle={setRoleTitle}
              companyName={companyName}
              setCompanyName={setCompanyName}
              onPreview={setPreviewJd}
              selectedJd={selectedJd}
            />
            <OptimizeButton
              onClick={optimizeAndApply}
              canOptimize={canOptimize}
              optimizing={optimizing}
              pointsBalance={pointsBalance}
              missing={!selectedResumeId ? "resume" : finalJobTextLen < 40 ? "jd" : null}
            />
          </div>
        </div>
      )}

      {/* JD preview modal */}
      {previewJd && <JdPreviewModal jd={previewJd} onClose={() => setPreviewJd(null)} />}
    </>
  );
}

/* ============================================================
 * Subcomponents
 * ============================================================ */

function ResumePicker({
  resumes,
  selectedResumeId,
  onSelect,
  selectedFile,
  setSelectedFile,
  onUpload,
  uploading,
  resumeLimitReached,
}: {
  resumes: Resume[];
  selectedResumeId: string;
  onSelect: (id: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
  resumeLimitReached: boolean;
}) {
  const slots = resumes.length;
  const remaining = MAX_RESUMES - slots;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">Resume</h2>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {slots}/{MAX_RESUMES}
        </span>
      </div>

      {resumes.length > 0 ? (
        <div className="space-y-1.5">
          {resumes.map((resume) => {
            const active = resume._id === selectedResumeId;
            return (
              <button
                key={resume._id}
                type="button"
                onClick={() => onSelect(resume._id)}
                className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-medium ${active ? "text-teal-900" : "text-slate-900"}`}>
                    {resume.fileName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    v{resume.version}
                    {resume.isEdited && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                        edited
                      </span>
                    )}
                  </div>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-teal-600" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
          <Inbox className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-xs text-slate-500">No resumes yet</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Upload your first one below</p>
        </div>
      )}

      <div className="mt-3 space-y-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
        <input
          id="resume-file-input"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          disabled={resumeLimitReached}
          className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading || !selectedFile || resumeLimitReached}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload PDF or Word
        </button>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        {resumeLimitReached ? (
          <span className="text-rose-600">All {MAX_RESUMES} slots used.</span>
        ) : (
          <>
            {remaining} {remaining === 1 ? "slot" : "slots"} left.
          </>
        )}{" "}
        <Link
          href="/dashboard/library"
          className="font-semibold text-teal-700 hover:text-teal-800"
        >
          Manage library →
        </Link>
      </p>
    </section>
  );
}

function JdPicker({
  jds,
  jdMode,
  setJdMode,
  selectedJdId,
  setSelectedJdId,
  jobText,
  setJobText,
  roleTitle,
  setRoleTitle,
  companyName,
  setCompanyName,
  onPreview,
  selectedJd,
}: {
  jds: JobDescription[];
  jdMode: JdMode;
  setJdMode: (m: JdMode) => void;
  selectedJdId: string;
  setSelectedJdId: (id: string) => void;
  jobText: string;
  setJobText: (s: string) => void;
  roleTitle: string;
  setRoleTitle: (s: string) => void;
  companyName: string;
  setCompanyName: (s: string) => void;
  onPreview: (jd: JobDescription) => void;
  selectedJd: JobDescription | null;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold">Job description</h2>
      </div>

      <div className="mb-3 flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setJdMode("saved")}
          disabled={jds.length === 0}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            jdMode === "saved"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Saved ({jds.length})
        </button>
        <button
          type="button"
          onClick={() => setJdMode("paste")}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
            jdMode === "paste"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Paste new
        </button>
      </div>

      {jdMode === "saved" ? (
        jds.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <Briefcase className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-500">No saved job descriptions</p>
            <Link
              href="/dashboard/library"
              className="mt-1 inline-block text-[11px] font-semibold text-teal-700 hover:text-teal-800"
            >
              Add one in the library →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <select
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white pl-3 pr-9 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="">Choose a saved JD...</option>
                {jds.map((jd) => (
                  <option key={jd._id} value={jd._id}>
                    {jd.roleTitle || "Untitled"}
                    {jd.companyName ? ` · ${jd.companyName}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {selectedJd ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {selectedJd.roleTitle || "Untitled role"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedJd.companyName || "No company"} ·{" "}
                      {new Date(selectedJd.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPreview(selectedJd)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                  {selectedJd.parsedText}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Pick a saved JD above to use it for the next AI run.
              </p>
            )}
          </div>
        )
      ) : (
        <div className="space-y-2">
          <input
            value={roleTitle}
            onChange={(event) => setRoleTitle(event.target.value)}
            placeholder="Target role (optional)"
            maxLength={120}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
          />
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company (optional)"
            maxLength={120}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
          />
          <textarea
            value={jobText}
            onChange={(event) => setJobText(event.target.value)}
            rows={8}
            maxLength={20000}
            placeholder="Paste the full job description here..."
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5 focus:border-teal-600 focus:outline-none"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{jobText.length}/20,000</span>
            <span className={jobText.trim().length >= 40 ? "text-emerald-600" : "text-slate-400"}>
              {jobText.trim().length >= 40
                ? "✓ Ready"
                : `${40 - jobText.trim().length} more chars needed`}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function OptimizeButton({
  onClick,
  canOptimize,
  optimizing,
  pointsBalance,
  missing,
}: {
  onClick: () => void;
  canOptimize: boolean;
  optimizing: boolean;
  pointsBalance: number;
  missing: "resume" | "jd" | null;
}) {
  const lowPoints = pointsBalance < COST_PER_EDIT;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={onClick}
        disabled={!canOptimize}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {optimizing ? "AI is working..." : "Run AI optimize"}
      </button>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Costs {COST_PER_EDIT} pts per run</span>
        {lowPoints ? (
          <Link
            href="/dashboard/profile"
            className="font-semibold text-amber-700 hover:text-amber-800"
          >
            Buy points →
          </Link>
        ) : (
          <span className="text-emerald-700">
            {Math.floor(pointsBalance / COST_PER_EDIT)} runs available
          </span>
        )}
      </div>
      {missing && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
          {missing === "resume" ? "Pick a resume first." : "Pick or paste a job description first."}
        </p>
      )}
    </div>
  );
}

function HistoryCard({
  history,
  onSelect,
}: {
  history: SuggestionHistory[];
  onSelect: (item: SuggestionHistory) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold">Past runs</h2>
      </div>
      <div className="max-h-60 space-y-1.5 overflow-y-auto">
        {history.length === 0 ? (
          <p className="py-2 text-xs text-slate-500">No runs yet for this resume.</p>
        ) : (
          history.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onSelect(item)}
              className="block w-full rounded-md border border-slate-200 bg-white p-2.5 text-left hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">
                  {item.jobTitle || "Target role"}
                </span>
                <span className="shrink-0 rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                  {item.appliedCount ?? 0}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="h-2.5 w-2.5" />
                {new Date(item.createdAt).toLocaleDateString()} · {item.pointsSpent ?? 0} pts
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function SuggestionsPanel({
  suggestions,
  appliedCount,
  optimizing,
}: {
  suggestions: Suggestion[];
  appliedCount: number;
  optimizing: boolean;
}) {
  return (
    <section className="sticky top-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">AI changes</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {appliedCount}/{suggestions.length}
        </span>
      </div>

      <div className="max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto">
        {optimizing ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="mt-2 h-2 w-full rounded bg-slate-200" />
                <div className="mt-1.5 h-2 w-2/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-slate-300" />
            <p className="text-xs text-slate-500">Run AI optimize to see suggestions here.</p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => {
            const priorityClass =
              suggestion.priority === "high"
                ? "border-l-rose-500 bg-rose-50/50"
                : suggestion.priority === "medium"
                  ? "border-l-amber-500 bg-amber-50/50"
                  : "border-l-teal-500 bg-teal-50/50";
            return (
              <div
                key={`${suggestion.type}-${index}`}
                className={`rounded-md border border-slate-200 border-l-2 ${priorityClass} p-3`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                  <Check
                    className={`h-3 w-3 ${suggestion.applied ? "text-emerald-600" : "text-slate-300"}`}
                  />
                  <span className="text-slate-500">{suggestion.type.replace(/_/g, " ")}</span>
                  <span className="ml-auto text-slate-400">{suggestion.priority}</span>
                </div>
                {suggestion.originalText && (
                  <p className="text-[11px] leading-4 text-slate-500 line-through">
                    {suggestion.originalText.length > 100
                      ? `${suggestion.originalText.slice(0, 100)}...`
                      : suggestion.originalText}
                  </p>
                )}
                {suggestion.suggestedText && (
                  <p className="mt-1 text-[11px] font-medium leading-4 text-emerald-700">
                    {suggestion.suggestedText.length > 100
                      ? `${suggestion.suggestedText.slice(0, 100)}...`
                      : suggestion.suggestedText}
                  </p>
                )}
                {suggestion.explanation && (
                  <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                    {suggestion.explanation}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function PageCapacity({ pct }: { pct: number }) {
  // Tone bands matching user expectation: <50 great, 50-79 good, 80-99 close, 100+ overflow
  const band =
    pct >= 100
      ? { color: "rose", label: "Overflows to page 2", icon: AlertCircle }
      : pct >= 80
        ? { color: "amber", label: "Close to page limit", icon: AlertCircle }
        : pct >= 50
          ? { color: "teal", label: "Good fit", icon: CheckCircle2 }
          : { color: "emerald", label: "Room to spare", icon: CheckCircle2 };

  const palettes: Record<string, { text: string; bar: string; bg: string; ring: string }> = {
    emerald: {
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    teal: {
      text: "text-teal-700",
      bar: "bg-teal-600",
      bg: "bg-teal-50",
      ring: "ring-teal-200",
    },
    amber: {
      text: "text-amber-700",
      bar: "bg-amber-500",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
    rose: {
      text: "text-rose-700",
      bar: "bg-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
    },
  };
  const p = palettes[band.color];
  const Icon = band.icon;
  const displayPct = Math.min(999, pct);

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ring-1 ${p.bg} ${p.ring}`}
      title={`Resume content fills ${displayPct}% of one page (US Letter)`}
    >
      <Icon className={`h-3.5 w-3.5 ${p.text}`} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${p.text}`}>Page fill</span>
          <span className={`font-mono text-[11px] font-bold ${p.text}`}>{displayPct}%</span>
        </div>
        <div className="mt-0.5 h-1 w-32 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full transition-all ${p.bar}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
      <span className={`hidden text-[10px] font-medium sm:inline ${p.text}`}>{band.label}</span>
    </div>
  );
}

function EmptyResumeState() {
  return (
    <div className="mx-auto flex min-h-[600px] max-w-[816px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      <FileText className="mb-3 h-12 w-12 text-slate-300" />
      <h3 className="text-base font-semibold text-slate-900">No resume selected</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Upload a PDF or Word file using the panel on the left to get started.
      </p>
    </div>
  );
}

function JdPreviewModal({ jd, onClose }: { jd: JobDescription; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{jd.roleTitle || "Untitled role"}</h3>
            <p className="text-xs text-slate-500">
              {jd.companyName || "No company"} · {new Date(jd.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
            {jd.parsedText}
          </pre>
        </div>
      </div>
    </div>
  );
}
