import Link from "next/link";
import { ArrowLeft, FileQuestion, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-950">
      <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-base font-semibold">NextDraft</div>
            <div className="text-xs text-slate-500">Resume editor</div>
          </div>
        </Link>

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <FileQuestion className="h-8 w-8 text-slate-500" />
        </div>

        <p className="text-sm font-semibold text-teal-700">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          This page does not exist or was moved while NextDraft was simplified into the one-click resume optimizer.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/resumes">
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto">
              Open optimizer
            </button>
          </Link>
          <Link href="/">
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
