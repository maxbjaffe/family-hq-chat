"use client";

import { RechargeMenu } from "@/components/recharge";
import { useKiosk } from "@/components/KioskProvider";

export default function RechargePage() {
  const { isKioskMode, isEmbedded } = useKiosk();
  const isWideMode = isKioskMode || isEmbedded;

  if (isWideMode) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50/30 to-blue-50/30 flex flex-col">
        <div className="px-6 pt-4 pb-2 text-center flex-shrink-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Recharge Menu
          </h1>
          <p className="text-slate-500 text-sm">
            Pick your time. Pick your vibe. Recharge and get back to it.
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-auto px-6 pb-4">
          <RechargeMenu />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/30 to-blue-50/30">
      <div className="mx-auto px-4 py-6 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Recharge Menu
          </h1>
          <p className="text-slate-500 mt-1">
            Pick your time. Pick your vibe. Recharge and get back to it.
          </p>
        </div>
        <RechargeMenu />
      </div>
    </div>
  );
}
