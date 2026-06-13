"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const requirements = [
    { pass: password.length >= 8, label: "At least 8 characters" },
    { pass: /[A-Z]/.test(password), label: "One uppercase letter" },
    { pass: /[0-9]/.test(password), label: "One number" },
    { pass: /[^A-Za-z0-9]/.test(password), label: "One symbol" },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }
    if (requirements.some((r) => !r.pass)) {
      toast.error("Password does not meet all requirements.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/users/reset-password", { token, password }, { auth: false });
      toast.success("Password reset. Please log in.");
      router.push("/auth/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Password reset failed");
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

        <h1 className="text-2xl font-semibold tracking-normal">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">Set a new password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm outline-none focus:border-teal-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 rounded-md p-1.5 text-slate-500 -translate-y-1/2 hover:bg-slate-100"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {requirements.map(({ pass, label }) => (
                <li key={label} className={`flex items-center gap-1.5 text-xs ${pass ? "text-emerald-600" : "text-slate-400"}`}>
                  {pass ? <Check className="h-3.5 w-3.5" /> : <span className="inline-block h-3.5 w-3.5 rounded-full border border-current" />}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-xs text-rose-600">Passwords don't match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Reset password
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
