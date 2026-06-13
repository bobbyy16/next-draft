"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  getUser,
  isAdmin,
  isAuthenticated,
  logout,
  setUser as persistUser,
  User as AuthUser,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resume Optimizer", href: "/dashboard/resumes", icon: FileText },
  { name: "Resume & JDs", href: "/dashboard/library", icon: FolderOpen },
  { name: "Activity", href: "/dashboard/activity", icon: Clock },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Support", href: "/dashboard/support", icon: LifeBuoy },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authed = isAuthenticated();
    const storedUser = getUser();
    if (!authed || !storedUser) {
      setCheckedAuth(true);
      router.replace("/auth/login");
      return;
    }
    setUser(storedUser);
    setCheckedAuth(true);

    // Refresh from server (handles bans, point changes, role changes)
    api
      .get<AuthUser>("/api/users/me")
      .then((fresh) => {
        setUser(fresh);
        persistUser(fresh);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // logout already triggered by api helper for 401; 403 means banned
          router.replace("/auth/login");
        }
      });
  }, [router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!checkedAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <div className="text-sm">Loading workspace...</div>
      </div>
    );
  }

  const adminUser = isAdmin(user);

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-normal text-slate-950">NextDraft</div>
            <div className="text-xs text-slate-500">Resume editor</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
        {navigation.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </div>
            </Link>
          );
        })}

        {adminUser && (
          <Link href="/admin">
            <div className="mt-4 flex items-center gap-3 rounded-md border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100">
              <ShieldCheck className="h-4 w-4" />
              Admin panel
            </div>
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-md bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-950">{user.name}</div>
            {adminUser && (
              <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">
                admin
              </span>
            )}
          </div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
          <div className="mt-1 text-xs font-semibold text-teal-700">
            {user.pointsBalance ?? 0} pts
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-40 rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>

      <main className="min-h-screen pt-14 lg:pl-72 lg:pt-0">{children}</main>
    </div>
  );
}
