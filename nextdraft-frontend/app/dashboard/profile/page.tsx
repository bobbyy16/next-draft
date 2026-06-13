"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  Save,
  ShieldAlert,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { getUser, setUser, type User } from "@/lib/auth";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface Pack {
  id: "starter" | "plus" | "pro";
  points: number;
  rupees: number;
  label: string;
}

interface PacksResponse {
  enabled: boolean;
  keyId: string;
  packs: Pack[];
}

interface OrderResponse {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  pack: Pack;
  user: { name: string; email: string };
}

interface VerifyResponse {
  message: string;
  pointsBalance: number;
}

interface MyTransaction {
  _id: string;
  pack: string;
  points: number;
  rupees: number;
  status: "created" | "paid" | "failed" | "refunded";
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState<string>("");
  const [packsResp, setPacksResp] = useState<PacksResponse | null>(null);
  const [transactions, setTransactions] = useState<MyTransaction[]>([]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<User>("/api/users/me");
      setProfile(me);
      setName(me.name);
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const stored = getUser();
    if (stored) {
      setProfile(stored);
      setName(stored.name);
    }
    Promise.all([
      api.get<PacksResponse>("/api/payments/packs", { auth: false }).then(setPacksResp).catch(() => null),
      api.get<MyTransaction[]>("/api/payments/me").then(setTransactions).catch(() => null),
      refreshUser(),
    ]).finally(() => setLoading(false));
  }, [refreshUser]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", trimmed);
      const updated = await api.put<User>(`/api/users/${profile._id}`, form);
      setProfile(updated);
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const buyPack = async (pack: Pack) => {
    if (!profile) return;
    if (!packsResp?.enabled) {
      toast.error("Payments are not configured yet. Please contact support.");
      return;
    }
    setBuying(pack.id);
    try {
      const order = await api.post<OrderResponse>("/api/payments/create-order", { pack: pack.id });
      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amount,
        currency: order.currency,
        packLabel: `${order.pack.label}`,
        user: order.user,
        onSuccess: async (resp) => {
          try {
            const verified = await api.post<VerifyResponse>("/api/payments/verify", resp);
            const updatedUser: User = { ...profile, pointsBalance: verified.pointsBalance };
            setProfile(updatedUser);
            setUser(updatedUser);
            toast.success(`${order.pack.points} points added to your wallet`);
            // Refresh ledger & transactions
            void refreshUser();
            void api.get<MyTransaction[]>("/api/payments/me").then(setTransactions).catch(() => null);
          } catch (verifyErr) {
            toast.error(
              verifyErr instanceof ApiError
                ? verifyErr.message
                : "Payment verification failed. Contact support."
            );
          } finally {
            setBuying("");
          }
        },
        onDismiss: () => {
          setBuying("");
        },
        onFailure: (description) => {
          toast.error(description || "Payment failed");
          setBuying("");
        },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start payment");
      setBuying("");
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const fullLedger = [...(profile.pointsLedger ?? [])].reverse();
  const ledger = fullLedger.slice(0, 5);
  const packsToShow = packsResp?.packs ?? [];
  const paymentsDisabled = packsResp ? !packsResp.enabled : false;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <UserIcon className="h-4 w-4" />
            Account
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Profile and points</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account and buy edit points. One AI resume edit costs 50 points.
          </p>
        </header>

        {paymentsDisabled && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Payments are temporarily unavailable. New point packs can be bought once the payment provider is reconnected.
            </div>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white">
                  {profile.profileImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profileImage.url}
                      alt={profile.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">{profile.name}</div>
                  <div className="truncate text-sm text-slate-500">{profile.email}</div>
                  {profile.role === "admin" && (
                    <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      ADMIN
                    </span>
                  )}
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
                    maxLength={80}
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
                {packsToShow.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => buyPack(pack)}
                    disabled={Boolean(buying) || paymentsDisabled}
                    className="group rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="text-sm font-semibold">{pack.points} points</div>
                    <div className="mt-1 text-2xl font-semibold">₹{pack.rupees}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Edit {Math.floor(pack.points / 50)} resume
                      {Math.floor(pack.points / 50) === 1 ? "" : "s"}
                    </div>
                    {buying === pack.id && <Loader2 className="mt-3 h-4 w-4 animate-spin" />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Secure payments via Razorpay. UPI, cards, and netbanking supported.
              </p>
            </div>

            {transactions.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold">Payment history</h2>
                <div className="divide-y divide-slate-200">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t._id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium capitalize">{t.pack} pack</div>
                        <div className="text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleString()} · ₹{t.rupees}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          t.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "failed"
                            ? "bg-rose-100 text-rose-700"
                            : t.status === "refunded"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Missing a payment? <Link href="/dashboard/support" className="font-semibold text-teal-700 hover:text-teal-800">Contact support</Link>.
                </p>
              </div>
            )}

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
                            {item.adminAction ? " · admin" : ""}
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

      </div>
    </main>
  );
}
