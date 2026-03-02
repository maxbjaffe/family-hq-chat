"use client";

import { RechargeMenu } from "@/components/recharge";

export default function RechargePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Recharge Menu
          </h1>
          <p className="text-slate-500 mt-1">Pick your time. Pick your vibe. Recharge and get back to it.</p>
        </div>
        <RechargeMenu />
      </div>
    </div>
  );
}
