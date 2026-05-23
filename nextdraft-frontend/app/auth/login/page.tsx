"use client";

import type React from "react";
import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, FileText, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const trimmedEmail = email.trim();
    const nextFieldErrors: { email?: string; password?: string } = {};

    if (!trimmedEmail) nextFieldErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextFieldErrors.email = "Enter a valid email address.";

    if (!password) nextFieldErrors.password = "Password is required.";
    else if (password.length < 6) nextFieldErrors.password = "Password must be at least 6 characters.";

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setError("Fix the highlighted fields and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/dashboard/resumes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors ${
      hasError
        ? "border-rose-400 bg-rose-50/60 text-rose-950 focus:border-rose-500"
        : "border-slate-300 focus:border-teal-700"
    }`;

  return (
    <main className="grid min-h-screen bg-slate-100 text-slate-950 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="hidden border-r border-slate-200 bg-white p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex w-fit items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold">NextDraft</div>
            <div className="text-xs text-slate-500">Resume editor</div>
          </div>
        </Link>

        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Back to your optimizer
          </div>
          <h1 className="text-5xl font-semibold tracking-normal">
            Continue improving your resume.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Sign in to upload resumes, apply one-click AI changes, edit the basic resume template, and export your updated PDF.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["One template", "PDF export", "AI apply"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link href="/" className="mb-8 flex w-fit items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold">NextDraft</div>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-normal">Log in</h1>
            <p className="mt-1 text-sm text-slate-600">
              Open your resume optimizer workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                {fieldErrors.email && <span className="text-xs font-medium text-rose-600">{fieldErrors.email}</span>}
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                placeholder="you@example.com"
                required
                className={inputClass(Boolean(fieldErrors.email))}
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                {fieldErrors.password && <span className="text-xs font-medium text-rose-600">{fieldErrors.password}</span>}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                    }
                  }}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className={`${inputClass(Boolean(fieldErrors.password))} pr-10`}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 rounded-md p-1.5 text-slate-500 -translate-y-1/2 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link href="/auth/forgot-password" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Log in
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            New to NextDraft?{" "}
            <Link href="/auth/register" className="font-semibold text-teal-700 hover:text-teal-800">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
