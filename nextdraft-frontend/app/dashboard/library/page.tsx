"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

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

const emptyJobForm = {
  id: "",
  roleTitle: "",
  companyName: "",
  text: "",
};

export default function LibraryPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState("");
  const [deletingJobId, setDeletingJobId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resumeLimitReached = resumes.length >= 5;
  const isEditingJob = Boolean(jobForm.id);

  const headers = useMemo(() => {
    const token = getAuthToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    void fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    setError("");

    try {
      const [resumeResponse, jobResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/resumes`, { headers }),
        fetch(`${API_BASE_URL}/api/job-descriptions`, { headers }),
      ]);

      if (!resumeResponse.ok) throw new Error("Failed to load resumes");
      if (!jobResponse.ok) throw new Error("Failed to load job descriptions");

      const [resumeData, jobData] = await Promise.all([
        resumeResponse.json(),
        jobResponse.json(),
      ]);

      setResumes(resumeData);
      setJobs(jobData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async () => {
    if (!selectedFile) {
      setError("Choose a PDF or Word resume first.");
      return;
    }
    if (resumeLimitReached) {
      setError("You can upload up to 5 resumes. Delete one before uploading another.");
      return;
    }

    setUploadingResume(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Resume upload failed");

      setSelectedFile(null);
      setMessage("Resume uploaded.");
      await fetchLibraryData();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Resume upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const deleteResume = async (resumeId: string) => {
    setDeletingResumeId(resumeId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Resume delete failed");

      setMessage("Resume deleted.");
      await fetchLibraryData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Resume delete failed");
    } finally {
      setDeletingResumeId("");
    }
  };

  const saveJob = async (event: React.FormEvent) => {
    event.preventDefault();

    if (jobForm.text.trim().length === 0) {
      setError("Job description text is required.");
      return;
    }

    setSavingJob(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        text: jobForm.text.trim(),
        roleTitle: jobForm.roleTitle.trim(),
        companyName: jobForm.companyName.trim(),
      };

      const url = jobForm.id
        ? `${API_BASE_URL}/api/job-descriptions/${jobForm.id}`
        : `${API_BASE_URL}/api/job-descriptions/upload`;
      const method = jobForm.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Job description save failed");

      setJobForm(emptyJobForm);
      setMessage(jobForm.id ? "Job description updated." : "Job description created.");
      await fetchLibraryData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Job description save failed");
    } finally {
      setSavingJob(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    setDeletingJobId(jobId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/job-descriptions/${jobId}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Job description delete failed");

      if (jobForm.id === jobId) setJobForm(emptyJobForm);
      setMessage("Job description deleted.");
      await fetchLibraryData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Job description delete failed");
    } finally {
      setDeletingJobId("");
    }
  };

  const startEditJob = (job: JobDescription) => {
    setJobForm({
      id: job._id,
      roleTitle: job.roleTitle || "",
      companyName: job.companyName || "",
      text: job.parsedText || "",
    });
    setMessage("");
    setError("");
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-teal-700">Resume and JD library</div>
            <h1 className="text-2xl font-semibold">Manage uploaded resumes and saved job descriptions</h1>
            <p className="text-sm text-slate-600">
              Resumes are capped at 5 per account. Delete a resume here before uploading another one. Job descriptions support create, edit, and delete.
            </p>
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

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Resumes</h2>
                <p className="mt-1 text-xs text-slate-500">{resumes.length}/5 uploaded</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                disabled={resumeLimitReached}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 disabled:opacity-60"
              />
              <button
                onClick={uploadResume}
                disabled={uploadingResume || !selectedFile || resumeLimitReached}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {uploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload resume
              </button>
              {resumeLimitReached && (
                <p className="text-xs text-rose-600">
                  Resume limit reached. Delete one of your existing resumes below to upload another.
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {resumes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No resumes uploaded yet.
                </div>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{resume.fileName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Version {resume.version} · {resume.isEdited ? "edited" : "original"} ·{" "}
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteResume(resume._id)}
                      disabled={deletingResumeId === resume._id}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingResumeId === resume._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Job descriptions</h2>
                <p className="mt-1 text-xs text-slate-500">Create, edit, and delete saved JDs</p>
              </div>
              {isEditingJob && (
                <button
                  type="button"
                  onClick={() => setJobForm(emptyJobForm)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Clear editor
                </button>
              )}
            </div>

            <form onSubmit={saveJob} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                value={jobForm.roleTitle}
                onChange={(event) => setJobForm((current) => ({ ...current, roleTitle: event.target.value }))}
                placeholder="Role title"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              />
              <input
                value={jobForm.companyName}
                onChange={(event) => setJobForm((current) => ({ ...current, companyName: event.target.value }))}
                placeholder="Company name"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              />
              <textarea
                value={jobForm.text}
                onChange={(event) => setJobForm((current) => ({ ...current, text: event.target.value }))}
                rows={10}
                placeholder="Paste the full job description..."
                className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5"
              />
              <button
                type="submit"
                disabled={savingJob}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {savingJob ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditingJob ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEditingJob ? "Update job description" : "Save job description"}
              </button>
            </form>

            <div className="mt-4 space-y-3">
              {jobs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No job descriptions saved yet.
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job._id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {job.roleTitle || "Untitled role"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {job.companyName || "No company"} · {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{job.parsedText}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditJob(job)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteJob(job._id)}
                          disabled={deletingJobId === job._id}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {deletingJobId === job._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
