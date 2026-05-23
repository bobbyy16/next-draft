"use client";

import type React from "react";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/utils";

const promises = [
  "Upload PDF or Word resumes",
  "Run one-click AI optimization",
  "Edit the basic resume template",
  "Export the final resume as PDF",
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const validateField = (field: string, value: string): string => {
    const v = value.trim();
    switch (field) {
      case "name":
        if (!v) return "Full name is required.";
        if (v.length < 2) return "Name must be at least 2 characters.";
        return "";
      case "email":
        if (!v) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Must include an uppercase letter.";
        if (!/[0-9]/.test(value)) return "Must include a number.";
        if (!/[^A-Za-z0-9]/.test(value)) return "Must include a symbol (e.g. @#$!).";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData]) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Validate all fields
    const errors: Record<string, string> = {};
    (["name", "email", "password"] as const).forEach((field) => {
      errors[field] = validateField(field, formData[field]);
    });
    setFieldErrors(errors);
    setTouched({ name: true, email: true, password: true });

    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("email", formData.email.trim());
      payload.append("password", formData.password);
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/dashboard/resumes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `h-11 w-full rounded-md border bg-white px-3 text-sm outline-none ${
      fieldErrors[field]
        ? "border-rose-400 focus:border-rose-500"
        : "border-slate-300 focus:border-teal-700"
    }`;

  return (
    <main className="grid min-h-screen bg-slate-100 text-slate-950 lg:grid-cols-[520px_minmax(0,1fr)]">
      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link href="/" className="mb-8 flex w-fit items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">NextDraft</div>
              <div className="text-xs text-slate-500">Resume editor</div>
            </div>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-normal">Create your account</h1>
            <p className="mt-1 text-sm text-slate-600">
              Start with the focused one-click resume optimizer.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Alex Morgan"
                className={inputClass("name")}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={inputClass("email")}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => { handleBlur("password"); setPasswordFocused(false); }}
                  placeholder="Minimum 8 characters"
                  className={`${inputClass("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 rounded-md p-1.5 text-slate-500 -translate-y-1/2 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {(passwordFocused || formData.password.length > 0) && (
                <ul className="mt-2 space-y-1">
                {[
                  { pass: formData.password.length >= 8, label: "At least 8 characters" },
                  { pass: /[A-Z]/.test(formData.password), label: "One uppercase letter" },
                  { pass: /[0-9]/.test(formData.password), label: "One number" },
                  { pass: /[^A-Za-z0-9]/.test(formData.password), label: "One symbol (@#$! etc.)" },
                ].map(({ pass, label }) => (
                  <li key={label} className={`flex items-center gap-1.5 text-xs ${pass ? "text-emerald-600" : "text-slate-400"}`}>
                    {pass ? <Check className="h-3.5 w-3.5" /> : <span className="inline-block h-3.5 w-3.5 rounded-full border border-current" />}
                    {label}
                  </li>
                ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden bg-white p-10 lg:flex lg:flex-col lg:justify-between">
        <div />
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Sparkles className="h-3.5 w-3.5" />
            Built around one job application
          </div>
          <h2 className="text-5xl font-semibold tracking-normal">
            Get from raw resume to a cleaner version in minutes.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            The app keeps the workflow simple: one resume, one job description, one AI apply button, one basic resume template.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {promises.map((promise) => (
              <div key={promise} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Check className="h-4 w-4 shrink-0 text-teal-700" />
                <span className="text-sm font-semibold text-slate-700">{promise}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-500">No prompt writing. No template marketplace. Just the resume workflow.</p>
      </section>
    </main>
  );
}
