"use client";

import { useState } from "react";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface ForgotResponse {
  message: string;
  resetUrl?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");

    try {
      const data = await api.post<ForgotResponse>(
        "/api/users/forgot-password",
        { email: email.trim() },
        { auth: false }
      );
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
      toast.success("Check your inbox");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reset request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-950">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="mb-8 flex w-fit items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">NextDraft</div>
        </Link>

        <h1 className="text-2xl font-semibold tracking-normal">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your account email and we will send a password reset link.
        </p>

        {message && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {resetUrl && (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Development reset link:{" "}
            <a className="font-medium text-teal-700 underline" href={resetUrl}>{resetUrl}</a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Send reset link
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
