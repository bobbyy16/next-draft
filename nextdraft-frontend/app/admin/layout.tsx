"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getUser, isAdmin, logout, type User } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Support", href: "/admin/feedback", icon: LifeBuoy },
  { name: "Documentation", href: "/admin/docs", icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = getUser();
    if (!stored) {
      router.replace("/auth/login");
      return;
    }
    if (!isAdmin(stored)) {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-4">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-700 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold tracking-normal">Admin</div>
                <div className="text-xs text-slate-500">NextDraft</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-purple-700 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <Link href="/dashboard">
              <div className="mt-4 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Back to app
              </div>
            </Link>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 rounded-md bg-slate-50 p-3">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
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
      </aside>
      <main className="min-h-screen pl-64">{children}</main>
    </div>
  );
}
