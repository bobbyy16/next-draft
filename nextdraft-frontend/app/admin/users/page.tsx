"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Undo2,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "banned";
  pointsBalance: number;
  createdAt: string;
  bannedAt?: string | null;
  bannedReason?: string;
  lastLoginAt?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ListResponse {
  users: AdminUser[];
  pagination: Pagination;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "banned">("");
  const [loading, setLoading] = useState(true);
  const [pointsTarget, setPointsTarget] = useState<AdminUser | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) setCurrentUserId(JSON.parse(raw)._id || "");
      } catch {
        /* skip */
      }
    }
  }, []);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        const data = await api.get<ListResponse>(`/api/admin/users?${params}`);
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load users");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          User management
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Search by name/email, adjust points manually, or ban accounts.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
            placeholder="Search name or email..."
            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-purple-600 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "banned")}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <button
          type="button"
          onClick={() => load(1)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white hover:bg-purple-800"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.status === "banned"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{u.pointsBalance ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPointsTarget(u)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold hover:bg-slate-50"
                          title="Adjust points"
                        >
                          <Wallet className="h-3.5 w-3.5" /> Points
                        </button>
                        {u._id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => setRoleTarget(u)}
                            disabled={u.status === "banned" && u.role !== "admin"}
                            title={
                              u.status === "banned" && u.role !== "admin"
                                ? "Reactivate user first"
                                : u.role === "admin"
                                ? "Demote to user"
                                : "Promote to admin"
                            }
                            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold disabled:opacity-50 ${
                              u.role === "admin"
                                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                            }`}
                          >
                            {u.role === "admin" ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" /> Demote
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5" /> Make admin
                              </>
                            )}
                          </button>
                        )}
                        {u.role !== "admin" && u._id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => setBanTarget(u)}
                            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold ${
                              u.status === "banned"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            {u.status === "banned" ? (
                              <>
                                <Undo2 className="h-3.5 w-3.5" /> Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5" /> Ban
                              </>
                            )}
                          </button>
                        )}
                        {u.role !== "admin" && u._id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user and all their data"
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-300 bg-rose-600 px-2.5 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <div className="text-xs text-slate-500">
            Showing {users.length} of {pagination.total} users
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

      {pointsTarget && (
        <AdjustPointsModal
          user={pointsTarget}
          onClose={() => setPointsTarget(null)}
          onSuccess={(updated) => {
            setPointsTarget(null);
            setUsers((current) =>
              current.map((u) =>
                u._id === updated._id ? { ...u, pointsBalance: updated.pointsBalance } : u
              )
            );
          }}
        />
      )}

      {banTarget && (
        <BanModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onSuccess={(updated) => {
            setBanTarget(null);
            setUsers((current) =>
              current.map((u) =>
                u._id === updated._id ? { ...u, status: updated.status } : u
              )
            );
          }}
        />
      )}

      {roleTarget && (
        <RoleModal
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSuccess={(updated) => {
            setRoleTarget(null);
            setUsers((current) =>
              current.map((u) => (u._id === updated._id ? { ...u, role: updated.role } : u))
            );
          }}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={(deletedId) => {
            setDeleteTarget(null);
            setUsers((current) => current.filter((u) => u._id !== deletedId));
          }}
        />
      )}
    </div>
  );
}

function RoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}) {
  const isDemote = user.role === "admin";
  const nextRole: AdminUser["role"] = isDemote ? "user" : "admin";
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const submit = async () => {
    if (confirmText.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast.error("Type the user's email to confirm");
      return;
    }
    setSaving(true);
    try {
      const result = await api.post<{ user: AdminUser }>(`/api/admin/users/${user._id}/role`, {
        role: nextRole,
      });
      toast.success(isDemote ? `${user.email} demoted to user` : `${user.email} promoted to admin`);
      onSuccess(result.user);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isDemote ? "bg-slate-100 text-slate-600" : "bg-purple-100 text-purple-700"
              }`}
            >
              {isDemote ? <ShieldOff className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <h3 className="text-lg font-semibold">
              {isDemote ? "Demote admin to user" : "Promote user to admin"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>

          {isDemote ? (
            <p className="text-sm text-slate-600">
              They will lose access to the admin panel. Their data, points, and resumes are unaffected.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Admins can see every user, every transaction, can manually add/remove points from any account, and can ban users.
              </p>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                ⚠️ Only promote people you trust. Admin actions are logged but can't be auto-reversed.
              </div>
            </div>
          )}

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-slate-600">
              Type <span className="font-mono font-semibold">{user.email}</span> to confirm
            </label>
            <input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              placeholder={user.email}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || confirmText.trim().toLowerCase() !== user.email.toLowerCase()}
            className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:opacity-50 ${
              isDemote ? "bg-slate-700 hover:bg-slate-800" : "bg-purple-700 hover:bg-purple-800"
            }`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isDemote ? "Demote to user" : "Promote to admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdjustPointsModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}) {
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (points <= 0) {
      toast.error("Points must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const result = await api.post<{ user: AdminUser }>(`/api/admin/users/${user._id}/points`, {
        type,
        points,
        reason: reason.trim() || `Manual ${type} by admin`,
      });
      toast.success(
        `${type === "credit" ? "Added" : "Removed"} ${points} points ${
          type === "credit" ? "to" : "from"
        } ${user.email}`
      );
      onSuccess(result.user);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to adjust points");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Adjust points</h3>
            <p className="text-xs text-slate-500">
              {user.name} · {user.email} · current balance:{" "}
              <span className="font-semibold">{user.pointsBalance}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("credit")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                type === "credit"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <Plus className="h-4 w-4" /> Credit (add)
            </button>
            <button
              type="button"
              onClick={() => setType("debit")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                type === "debit"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <Minus className="h-4 w-4" /> Debit (remove)
            </button>
          </div>

          <div>
            <label htmlFor="points" className="mb-1.5 block text-sm font-medium text-slate-700">
              Points
            </label>
            <input
              id="points"
              type="number"
              min={1}
              max={100000}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
            <div className="mt-1 text-xs text-slate-500">
              50 = 1 AI edit · 150 = Plus pack · 500 = Pro pack
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700">
              Reason (logged in ledger)
            </label>
            <input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. payment reconciliation - order #12345"
              maxLength={200}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Apply adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BanModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}) {
  const isUnban = user.status === "banned";
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const result = await api.post<{ user: AdminUser }>(`/api/admin/users/${user._id}/status`, {
        status: isUnban ? "active" : "banned",
        reason,
      });
      toast.success(`User ${isUnban ? "reactivated" : "banned"}`);
      onSuccess(result.user);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isUnban ? "Reactivate user" : "Ban user"}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600">
          {isUnban ? (
            <>
              Restore access for <strong>{user.email}</strong>?
            </>
          ) : (
            <>
              Ban <strong>{user.email}</strong>? They will be signed out and unable to log in.
            </>
          )}
        </p>
        {!isUnban && (
          <div className="mt-4">
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700">
              Internal reason (optional)
            </label>
            <input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:opacity-60 ${
              isUnban ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isUnban ? "Reactivate" : "Ban user"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);
  const requiredText = user.email.toLowerCase();

  const submit = async () => {
    if (confirmText.trim().toLowerCase() !== requiredText) {
      toast.error("Type the user's email to confirm");
      return;
    }
    setSaving(true);
    try {
      await api.delete(`/api/users/${user._id}`);
      toast.success(`${user.email} deleted`);
      onSuccess(user._id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="text-lg font-semibold">Delete user account</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>

          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800">
            <p className="font-semibold">This permanently deletes:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px]">
              <li>The user account</li>
              <li>All uploaded resumes (and Cloudinary files)</li>
              <li>All saved job descriptions</li>
              <li>All AI optimization history</li>
              <li>All transactions (paid orders are kept for accounting via Razorpay)</li>
              <li>All support tickets they submitted</li>
              <li>Remaining points ({user.pointsBalance ?? 0})</li>
            </ul>
            <p className="mt-2 text-[12px]">This cannot be undone.</p>
          </div>

          <p className="text-xs text-slate-600">
            Use this only when the user has requested account deletion via email or support.
          </p>

          <div>
            <label htmlFor="delete-confirm" className="mb-1.5 block text-xs font-medium text-slate-600">
              Type <span className="font-mono font-semibold">{user.email}</span> to confirm
            </label>
            <input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              placeholder={user.email}
              disabled={saving}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || confirmText.trim().toLowerCase() !== requiredText}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
