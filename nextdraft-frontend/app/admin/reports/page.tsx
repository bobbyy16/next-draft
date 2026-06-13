"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CreditCard,
  IndianRupee,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface DailySignup {
  date: string;
  signups: number;
}
interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}
interface DailyOptimization {
  date: string;
  runs: number;
  applied: number;
}
interface PackBreakdown {
  pack: string;
  count: number;
  rupees: number;
  points: number;
}
interface StatusBreakdown {
  status: string;
  count: number;
}
interface TopSpender {
  userId: string;
  name: string;
  email: string;
  spent: number;
  transactions: number;
  points: number;
}
interface Summary {
  newUsers: number;
  revenue: number;
  paidTransactions: number;
  totalTransactions: number;
  optimizations: number;
  conversionPct: number;
}
interface ReportsResponse {
  days: number;
  since: string;
  now: string;
  summary: Summary;
  userGrowth: DailySignup[];
  revenue: DailyRevenue[];
  optimizations: DailyOptimization[];
  packBreakdown: PackBreakdown[];
  statusBreakdown: StatusBreakdown[];
  topSpenders: TopSpender[];
}

const STATUS_COLORS: Record<string, string> = {
  paid: "#059669",
  created: "#64748b",
  failed: "#e11d48",
  refunded: "#d97706",
};

const PACK_COLORS = ["#7c3aed", "#0d9488", "#0891b2"];

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
];

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export default function AdminReportsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    try {
      const result = await api.get<ReportsResponse>(`/api/admin/reports?days=${range}`);
      setData(result);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const packPieData = useMemo(
    () =>
      data?.packBreakdown.map((p, idx) => ({
        name: p.pack,
        value: p.rupees,
        color: PACK_COLORS[idx % PACK_COLORS.length],
      })) ?? [],
    [data]
  );

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            Analytics
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <BarChart3 className="h-6 w-6 text-purple-700" />
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Growth, revenue, and AI usage trends over time.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === r.days
                  ? "bg-purple-700 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {loading && !data ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !data ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No data
        </div>
      ) : (
        <div className="space-y-5">
          {/* Period summary */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              icon={Users}
              label="New users"
              value={data.summary.newUsers.toLocaleString("en-IN")}
              tone="blue"
            />
            <SummaryCard
              icon={IndianRupee}
              label="Revenue"
              value={`₹${formatINR(data.summary.revenue)}`}
              tone="emerald"
            />
            <SummaryCard
              icon={CreditCard}
              label="Paid transactions"
              value={data.summary.paidTransactions.toLocaleString("en-IN")}
              tone="purple"
            />
            <SummaryCard
              icon={Sparkles}
              label="AI runs"
              value={data.summary.optimizations.toLocaleString("en-IN")}
              tone="amber"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Conversion"
              value={`${data.summary.conversionPct}%`}
              sub={`${data.summary.paidTransactions}/${data.summary.totalTransactions}`}
              tone="teal"
            />
          </section>

          {/* Time-series charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="User signups" subtitle={`Daily new users · last ${days} days`}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.userGrowth}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#signupGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue" subtitle={`Daily revenue (₹) · last ${days} days`}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.revenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) => `₹${formatINR(v)}`}
                  />
                  <Tooltip content={<ChartTooltip moneyKey="revenue" />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="AI optimizations"
              subtitle={`Runs vs. changes applied · last ${days} days`}
            >
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.optimizations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="runs"
                    name="Runs"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="applied"
                    name="Changes applied"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Transactions" subtitle={`Daily count · last ${days} days`}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="transactions" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Breakdowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Revenue by pack"
              subtitle="Lifetime revenue share across packs"
            >
              {packPieData.length === 0 ? (
                <EmptyChart message="No paid orders yet" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={packPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {packPieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${formatINR(value)}`, "Revenue"]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {data.packBreakdown.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {data.packBreakdown.map((p, idx) => (
                    <div key={p.pack} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: PACK_COLORS[idx % PACK_COLORS.length] }}
                        />
                        <span className="capitalize">{p.pack}</span>
                      </div>
                      <span className="font-mono text-slate-600">
                        {p.count} orders · ₹{formatINR(p.rupees)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Transaction status"
              subtitle="Lifetime breakdown across all orders"
            >
              {data.statusBreakdown.length === 0 ? (
                <EmptyChart message="No orders yet" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.statusBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="status"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      width={70}
                    />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.statusBreakdown.map((s, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[s.status] || "#64748b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Top spenders */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-700" />
                <h2 className="text-sm font-semibold">Top spenders</h2>
              </div>
              <p className="text-xs text-slate-500">
                Lifetime revenue per user · top 10 by ₹
              </p>
            </div>
            {data.topSpenders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No paid transactions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">#</th>
                      <th className="px-5 py-2.5 font-semibold">User</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Spent</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Orders</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Points bought</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSpenders.map((s, idx) => (
                      <tr key={s.userId} className="border-t border-slate-100">
                        <td className="px-5 py-3 text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.email}</div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-700">
                          ₹{formatINR(s.spent)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono">{s.transactions}</td>
                        <td className="px-5 py-3 text-right font-mono">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  tone: "blue" | "emerald" | "purple" | "amber" | "teal";
}) {
  const tones = {
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
    teal: "text-teal-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <Icon className={`h-4 w-4 ${tones[tone]}`} />
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
      {message}
    </div>
  );
}

interface ChartTooltipPayload {
  name?: string | number;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  moneyKey,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
  moneyKey?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-slate-700">{label}</div>
      {payload.map((entry, idx) => {
        const isMoney = entry.dataKey === moneyKey;
        return (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-mono font-semibold">
              {isMoney ? `₹${formatINR(Number(entry.value) || 0)}` : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
