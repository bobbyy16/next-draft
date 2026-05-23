"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock, FileText, FolderOpen, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { getUser, isAuthenticated, logout, User as AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resume Optimizer", href: "/dashboard/resumes", icon: FileText },
  { name: "Resume & JDs", href: "/dashboard/library", icon: FolderOpen },
  { name: "Activity", href: "/dashboard/activity", icon: Clock },
  { name: "Profile", href: "/dashboard/profile", icon: User },
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
      setUser(null);
      setCheckedAuth(true);
      router.replace("/auth/login");
      return;
    }
    setUser(storedUser);
    setCheckedAuth(true);
  }, [router]);

  if (!checkedAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <div className="text-sm">Loading workspace...</div>
      </div>
    );
  }

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
          onClick={() => setSidebarOpen(false)}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
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
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-md bg-slate-50 p-3">
          <div className="truncate text-sm font-semibold text-slate-950">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
        </div>
        <button
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
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen && (
        <button
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
