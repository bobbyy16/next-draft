"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CreditCard, Loader2, Save, Trash2, User, Wallet } from "lucide-react";
import Link from "next/link";
import { getAuthToken, getUser, logout } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  pointsBalance?: number;
  pointsLedger?: Array<{
    type: "credit" | "debit";
    points: number;
    rupees?: number;
    reason?: string;
    createdAt?: string;
  }>;
  profileImage?: {
    url: string;
    public_id: string;
  };
}

const packs = [
  { id: "starter", label: "50 points", rupees: 50, detail: "Edit 1 resume" },
  { id: "plus", label: "150 points", rupees: 150, detail: "Edit 3 resumes" },
  { id: "pro", label: "500 points", rupees: 500, detail: "Edit 10 resumes" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile(user);
      setName(user.name);
    }
    setLoading(false);
  }, []);

  const persistUser = (user: UserProfile) => {
    const token = getAuthToken();
    const stored = { ...user, token };
    localStorage.setItem("user", JSON.stringify(stored));
    setProfile(user);
    setName(user.name);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setError("");
    setMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) { setError("Name is required."); return; }
    if (trimmedName.length < 2) { setError("Name must be at least 2 characters."); return; }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", trimmedName);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${profile._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");
      persistUser(data);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const addPoints = async (pack: string) => {
    setBuying(pack);
    setError("");
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pack }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add points");
      persistUser(data);
      setMessage("Points added to your wallet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add points");
    } finally {
      setBuying("");
    }
  };

  const deleteAccount = async () => {
    if (!profile) return;
    setDeleting(true);
    setError("");
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${profile._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) logout();
      else {
        const data = await response.json();
        setError(data.message || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white p-6">Unable to load profile.</div>
      </div>
    );
  }

  const fullLedger = [...(profile.pointsLedger ?? [])].reverse();
  const ledger = fullLedger.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <User className="h-4 w-4" />
            Account
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Profile and points</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account and buy edit points. One AI resume edit costs 50 points.
          </p>
        </header>

        {(message || error) && (
          <div className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">{profile.name}</div>
                  <div className="truncate text-sm text-slate-500">{profile.email}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-teal-700" />
                <h2 className="text-sm font-semibold">Points wallet</h2>
              </div>
              <div className="text-4xl font-semibold">{profile.pointsBalance ?? 0}</div>
              <p className="mt-1 text-sm text-slate-600">50 points = 1 AI resume edit</p>
            </div>
          </div>

          <div className="space-y-5">
            <form onSubmit={saveProfile} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold">Edit profile</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    value={profile.email}
                    disabled
                    className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                </div>
              </div>
              <button
                disabled={saving}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </button>
            </form>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-700" />
                <h2 className="text-sm font-semibold">Buy points</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {packs.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => addPoints(pack.id)}
                    disabled={!!buying}
                    className="rounded-lg border border-slate-200 p-4 text-left hover:border-teal-700 hover:bg-teal-50 disabled:opacity-60"
                  >
                    <div className="text-sm font-semibold">{pack.label}</div>
                    <div className="mt-1 text-2xl font-semibold">Rs {pack.rupees}</div>
                    <div className="mt-1 text-xs text-slate-500">{pack.detail}</div>
                    {buying === pack.id && <Loader2 className="mt-3 h-4 w-4 animate-spin" />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                This adds points directly for development. Payment gateway wiring can be added later.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold">Points history</h2>
              <div className="divide-y divide-slate-200">
                {ledger.length === 0 ? (
                  <p className="py-3 text-sm text-slate-500">No point activity yet.</p>
                ) : (
                  <>
                    {ledger.map((item, index) => (
                      <div key={`${item.createdAt}-${index}`} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <div className="text-sm font-medium">{item.reason || "Point activity"}</div>
                          <div className="text-xs text-slate-500">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${item.type === "credit" ? "text-emerald-700" : "text-rose-700"}`}>
                          {item.type === "credit" ? "+" : "-"}{item.points}
                        </div>
                      </div>
                    ))}
                    {fullLedger.length > 5 && (
                      <Link href="/dashboard/activity" className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-teal-700 hover:text-teal-900">
                        See all history
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-rose-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-rose-700">Danger zone</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Delete your account and all associated points and resumes.</p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        </section>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-950">Delete your account?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This action is permanent and cannot be undone. All your resumes, optimization history, and remaining points will be permanently deleted.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Yes, delete my account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
