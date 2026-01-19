"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Dashboard is deprecated - redirects to unified home page.
 * The dashboard functionality has been merged into:
 * - Home page (/) for family overview
 * - Parent Dashboard (/parents) for personal command center
 */
export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      <p className="text-slate-600">Redirecting to Family Home...</p>
    </div>
  );
}
