"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Eye,
  FileText,
  FolderOpen,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface Resume {
  _id: string;
  fileName: string;
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

const emptyJobForm = { id: "", roleTitle: "", companyName: "", text: "" };
const MAX_RESUMES = 5;

type Tab = "resumes" | "jds";
type ConfirmTarget =
  | { kind: "resume"; id: string; name: string }
  | { kind: "job"; id: string; name: string }
  | null;

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("resumes");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);

  // Resume state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // JD state
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [savingJob, setSavingJob] = useState(false);
  const [showJobEditor, setShowJobEditor] = useState(false);
  const [previewJob, setPreviewJob] = useState<JobDescription | null>(null);
  const [jdSearch, setJdSearch] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmTarget>(null);

  const resumeLimitReached = resumes.length >= MAX_RESUMES;

  const filteredJobs = useMemo(() => {
    const q = jdSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.roleTitle.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.parsedText.toLowerCase().includes(q)
    );
  }, [jobs, jdSearch]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [resumeData, jobData] = await Promise.all([
        api.get<Resume[]>("/api/resumes"),
        api.get<JobDescription[]>("/api/job-descriptions"),
      ]);
      setResumes(resumeData);
      setJobs(jobData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async () => {
    if (!selectedFile) {
      toast.error("Choose a PDF or DOCX resume first.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5 MB.");
      return;
    }
    setUploadingResume(true);
    try {
      const form = new FormData();
      form.append("resume", selectedFile);
      await api.post("/api/resumes/upload", form);
      setSelectedFile(null);
      const fileInput = document.getElementById("library-file-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      toast.success("Resume uploaded");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const performDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === "resume") {
        await api.delete(`/api/resumes/${confirm.id}`);
        toast.success("Resume deleted");
      } else {
        await api.delete(`/api/job-descriptions/${confirm.id}`);
        toast.success("Job description deleted");
      }
      if (confirm.kind === "job" && jobForm.id === confirm.id) {
        setJobForm(emptyJobForm);
        setShowJobEditor(false);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  const saveJob = async (event: React.FormEvent) => {
    event.preventDefault();
    if (jobForm.text.trim().length < 40) {
      toast.error("Job description must be at least 40 characters.");
      return;
    }

    setSavingJob(true);
    try {
      const payload = {
        text: jobForm.text.trim(),
        roleTitle: jobForm.roleTitle.trim(),
        companyName: jobForm.companyName.trim(),
      };
      if (jobForm.id) {
        await api.patch(`/api/job-descriptions/${jobForm.id}`, payload);
        toast.success("Job description updated");
      } else {
        await api.post("/api/job-descriptions/upload", payload);
        toast.success("Job description saved");
      }
      setJobForm(emptyJobForm);
      setShowJobEditor(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSavingJob(false);
    }
  };

  const startEditJob = (job: JobDescription) => {
    setJobForm({
      id: job._id,
      roleTitle: job.roleTitle || "",
      companyName: job.companyName || "",
      text: job.parsedText || "",
    });
    setShowJobEditor(true);
    setPreviewJob(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* HEADER */}
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <FolderOpen className="h-3.5 w-3.5" />
            Library
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Resumes & Job descriptions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Manage your uploaded resumes and saved job descriptions. Reuse them from the optimizer.
          </p>
        </header>

        {/* STATS STRIP */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Resumes
              </div>
              <span className="text-xs font-medium text-slate-500">
                {resumes.length}/{MAX_RESUMES}
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold">{resumes.length}</div>
            <ProgressBar
              value={resumes.length}
              max={MAX_RESUMES}
              tone={resumeLimitReached ? "rose" : "teal"}
            />
            <p className="mt-2 text-[11px] text-slate-500">
              {resumeLimitReached
                ? `All ${MAX_RESUMES} slots used. Delete one to upload another.`
                : `${MAX_RESUMES - resumes.length} ${MAX_RESUMES - resumes.length === 1 ? "slot" : "slots"} remaining.`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Briefcase className="h-3.5 w-3.5" />
                Job descriptions
              </div>
              <span className="text-xs font-medium text-slate-500">unlimited</span>
            </div>
            <div className="mt-2 text-2xl font-semibold">{jobs.length}</div>
            <p className="mt-2 text-[11px] text-slate-500">
              Saved JDs can be reused from the optimizer with one click.
            </p>
          </div>
        </section>

        {/* TABS */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("resumes")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "resumes"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            Resumes
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === "resumes" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {resumes.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("jds")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "jds"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Job descriptions
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === "jds" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {jobs.length}
            </span>
          </button>
        </div>

        {/* RESUMES TAB */}
        {tab === "resumes" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <Upload className="h-4 w-4 text-slate-500" />
                <div>
                  <h2 className="text-sm font-semibold">Upload a new resume</h2>
                  <p className="text-[11px] text-slate-500">PDF or DOCX document · max 5 MB</p>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center">
                <input
                  id="library-file-input"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  disabled={resumeLimitReached}
                  className="flex-1 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={uploadResume}
                  disabled={uploadingResume || !selectedFile || resumeLimitReached}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {uploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                </button>
              </div>
              {resumeLimitReached && (
                <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                  All {MAX_RESUMES} slots used. Delete a resume below to upload another.
                </div>
              )}
            </section>

            <section>
              {resumes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No resumes yet"
                  description="Upload your first resume above to start optimizing."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50">
                          <FileText className="h-5 w-5 text-teal-700" />
                        </div>
                        {resume.isEdited && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            Edited
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {resume.fileName}
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Version {resume.version} · Added{" "}
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                        <Link
                          href="/dashboard/resumes"
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ kind: "resume", id: resume._id, name: resume.fileName })
                          }
                          aria-label="Delete resume"
                          className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* JDs TAB */}
        {tab === "jds" && (
          <div className="space-y-4">
            {/* Action bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={jdSearch}
                  onChange={(e) => setJdSearch(e.target.value)}
                  placeholder="Search role, company, or text..."
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none"
                />
                {jdSearch && (
                  <button
                    type="button"
                    onClick={() => setJdSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setJobForm(emptyJobForm);
                  setShowJobEditor(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New JD
              </button>
            </div>

            {/* List */}
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No job descriptions saved"
                description="Save reusable JDs here so you can apply them to the optimizer with one click."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setJobForm(emptyJobForm);
                      setShowJobEditor(true);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first JD
                  </button>
                }
              />
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matches"
                description={`No JDs match "${jdSearch}". Try a different keyword.`}
              />
            ) : (
              <div className="space-y-2">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {job.roleTitle || "Untitled role"}
                          </h3>
                          {job.companyName && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {job.companyName}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">
                          {job.parsedText}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-400">
                          Saved {new Date(job.createdAt).toLocaleDateString()}
                          {" · "}
                          {job.parsedText.length.toLocaleString()} characters
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewJob(job)}
                          aria-label="Preview job description"
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditJob(job)}
                          aria-label="Edit job description"
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({
                              kind: "job",
                              id: job._id,
                              name: job.roleTitle || "Untitled role",
                            })
                          }
                          aria-label="Delete job description"
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* JD EDITOR DRAWER */}
      {showJobEditor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowJobEditor(false)}
        >
          <div
            className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">
                  {jobForm.id ? "Edit job description" : "New job description"}
                </h3>
                <p className="text-xs text-slate-500">Save it to reuse from the optimizer later.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowJobEditor(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveJob} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-auto p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Role title
                    </label>
                    <input
                      value={jobForm.roleTitle}
                      onChange={(event) =>
                        setJobForm((current) => ({ ...current, roleTitle: event.target.value }))
                      }
                      placeholder="e.g. Senior Software Engineer"
                      maxLength={120}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Company
                    </label>
                    <input
                      value={jobForm.companyName}
                      onChange={(event) =>
                        setJobForm((current) => ({ ...current, companyName: event.target.value }))
                      }
                      placeholder="e.g. Acme Corp"
                      maxLength={120}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Job description text
                  </label>
                  <textarea
                    value={jobForm.text}
                    onChange={(event) =>
                      setJobForm((current) => ({ ...current, text: event.target.value }))
                    }
                    rows={14}
                    maxLength={20000}
                    placeholder="Paste the full job description here. Include responsibilities, qualifications, tools, and any keywords from the original posting..."
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 focus:border-teal-600 focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{jobForm.text.length}/20,000</span>
                    <span
                      className={
                        jobForm.text.trim().length >= 40 ? "text-emerald-600" : "text-slate-400"
                      }
                    >
                      {jobForm.text.trim().length >= 40
                        ? "✓ Ready to save"
                        : `${40 - jobForm.text.trim().length} more chars needed`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowJobEditor(false)}
                  disabled={savingJob}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob || jobForm.text.trim().length < 40}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingJob ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : jobForm.id ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {jobForm.id ? "Save changes" : "Create JD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JD PREVIEW */}
      {previewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewJob(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">
                  {previewJob.roleTitle || "Untitled role"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {previewJob.companyName || "No company"} ·{" "}
                  {new Date(previewJob.createdAt).toLocaleDateString()} ·{" "}
                  {previewJob.parsedText.length.toLocaleString()} chars
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditJob(previewJob)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewJob(null)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                {previewJob.parsedText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold">
                Delete {confirm.kind === "resume" ? "resume" : "job description"}?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{confirm.name}</strong> will be permanently removed.
              {confirm.kind === "resume" && (
                <> All AI optimization history linked to it will also be deleted.</>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={deleting}
                className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ProgressBar({
  value,
  max,
  tone = "teal",
}: {
  value: number;
  max: number;
  tone?: "teal" | "rose";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = tone === "rose" ? "bg-rose-500" : "bg-teal-600";
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
