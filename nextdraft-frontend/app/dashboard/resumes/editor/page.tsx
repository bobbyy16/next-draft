"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ResumeEditorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/resumes");
  }, [router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-100 text-slate-600">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening the resume optimizer...
      </div>
    </div>
  );
}
