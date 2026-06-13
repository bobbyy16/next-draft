"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface FeedbackItem {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  type: "bug" | "feature" | "support" | "other";
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  createdAt: string;
}

interface ListResponse {
  feedback: FeedbackItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const statusOrder: FeedbackItem["status"][] = ["open", "in_progress", "resolved", "closed"];

const statusStyles: Record<FeedbackItem["status"], string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-700",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0, limit: 25 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "25" });
        if (statusFilter) params.set("status", statusFilter);
        const data = await api.get<ListResponse>(`/api/admin/feedback?${params}`);
        setItems(data.feedback);
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

  const updateItem = async (id: string, updates: Partial<FeedbackItem>) => {
    try {
      const updated = await api.patch<FeedbackItem>(`/api/admin/feedback/${id}`, updates);
      setItems((current) => current.map((item) => (item._id === id ? updated : item)));
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          Support inbox
        </div>
        <h1 className="mt-1 text-2xl font-semibold">User feedback & tickets</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bug reports, feature requests, and support messages from users.
        </p>
      </header>

      <div className="mb-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statusOrder.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            No feedback in this filter. Inbox is clear.
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{item.type}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{item.subject}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.message}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    {item.userId ? (
                      <>
                        From <strong>{item.userId.name}</strong> ({item.userId.email}) ·{" "}
                      </>
                    ) : (
                      <>(deleted user) · </>
                    )}
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => updateItem(item._id, { status: e.target.value as FeedbackItem["status"] })}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    {statusOrder.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {items.length} of {pagination.total} items
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
  );
}
