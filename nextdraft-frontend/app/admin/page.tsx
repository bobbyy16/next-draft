"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  FileText,
  IndianRupee,
  Loader2,
  ShoppingCart,
  UserMinus,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";

interface AdminStats {
  users: { total: number; banned: number; newLast30: number; newLast7: number };
  content: { resumes: number; jds: number; optimizations: number };
  revenue: { totalRupees: number; totalTransactions: number; last30DaysRupees: number };
  support: { openFeedback: number };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err?.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error || "No data"}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total users",
      value: stats.users.total,
      sub: `${stats.users.newLast7} new this week · ${stats.users.newLast30} new this month`,
      icon: Users,
      tone: "text-blue-700",
    },
    {
      label: "Banned users",
      value: stats.users.banned,
      sub: "Currently restricted",
      icon: UserMinus,
      tone: "text-rose-700",
    },
    {
      label: "Total revenue",
      value: `₹${stats.revenue.totalRupees.toLocaleString("en-IN")}`,
      sub: `₹${stats.revenue.last30DaysRupees.toLocaleString("en-IN")} in last 30 days`,
      icon: IndianRupee,
      tone: "text-emerald-700",
    },
    {
      label: "Paid transactions",
      value: stats.revenue.totalTransactions,
      sub: "Lifetime",
      icon: ShoppingCart,
      tone: "text-purple-700",
    },
    {
      label: "Resumes",
      value: stats.content.resumes,
      sub: `${stats.content.jds} job descriptions saved`,
      icon: FileText,
      tone: "text-slate-700",
    },
    {
      label: "AI optimizations run",
      value: stats.content.optimizations,
      sub: "Lifetime",
      icon: Activity,
      tone: "text-amber-700",
    },
    {
      label: "Open support tickets",
      value: stats.support.openFeedback,
      sub: stats.support.openFeedback ? "Needs attention" : "Inbox clear",
      icon: AlertCircle,
      tone: stats.support.openFeedback ? "text-rose-700" : "text-emerald-700",
    },
    {
      label: "System status",
      value: "Healthy",
      sub: "All services responding",
      icon: BadgeCheck,
      tone: "text-emerald-700",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          Control center
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Real-time stats on users, revenue, and support load.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </div>
              <card.icon className={`h-4 w-4 ${card.tone}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
            <div className="mt-1 text-xs text-slate-500">{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
