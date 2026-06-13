"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface AdminTransaction {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  pack: string;
  points: number;
  rupees: number;
  status: "created" | "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  createdAt: string;
  creditedAt?: string | null;
}

interface ListResponse {
  transactions: AdminTransaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  refunded: "bg-amber-100 text-amber-700",
  created: "bg-slate-100 text-slate-700",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0, limit: 25 });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "25" });
        if (statusFilter) params.set("status", statusFilter);
        const data = await api.get<ListResponse>(`/api/admin/transactions?${params}`);
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          Payments
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every Razorpay order and its status. Failed/created rows indicate users who started a payment but never completed.
        </p>
      </header>

      <div className="mb-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Created (incomplete)</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Razorpay IDs</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No transactions match this filter.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {t.userId ? (
                        <>
                          <div className="font-medium">{t.userId.name}</div>
                          <div className="text-xs text-slate-500">{t.userId.email}</div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">deleted user</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{t.pack}</td>
                    <td className="px-4 py-3 font-mono">₹{t.rupees}</td>
                    <td className="px-4 py-3 font-mono">{t.points}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusStyles[t.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                      {t.failureReason && (
                        <div className="mt-1 text-[10px] text-rose-600">{t.failureReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-slate-500">
                        order: {t.razorpayOrderId || "-"}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        pay: {t.razorpayPaymentId || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <div className="text-xs text-slate-500">
            {transactions.length} of {pagination.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => load(pagination.page + 1)}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold disabled:opacity-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
