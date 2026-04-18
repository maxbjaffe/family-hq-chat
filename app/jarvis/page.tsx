"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Loader2, SkipForward, X, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useKioskJarvis } from "@/hooks/useKioskJarvis";

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

export default function JarvisPage() {
  const [kids, setKids] = useState<KidMember[]>([]);
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const jarvis = useKioskJarvis(selectedKid);

  const selectedName = selectedKid
    ? kids.find((k) => k.id === selectedKid)?.name || "kiddo"
    : "";

  // Load kid members
  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((data) => {
        const members = (data.members || []).filter(
          (m: KidMember) => m.role === "kid"
        );
        setKids(members);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Refresh checklist after voice command completes
  const prevState = useRef(jarvis.state);
  useEffect(() => {
    if (prevState.current === "speaking" && jarvis.state === "idle") {
      // Could trigger a kiosk refresh here if needed
    }
    prevState.current = jarvis.state;
  }, [jarvis.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <a
          href="/kiosk"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </a>
        <h1 className="text-xl font-bold tracking-wide text-blue-300">
          JARVIS
        </h1>
        <div className="w-16" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Profile picker */}
        {!selectedKid ? (
          <>
            <p className="text-2xl font-semibold text-white/80">
              Who&apos;s talking?
            </p>
            <div className="flex gap-6">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => setSelectedKid(kid.id)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  <Avatar
                    member={{
                      name: kid.name,
                      role: kid.role,
                      avatar_url: kid.avatar_url,
                    }}
                    size="2xl"
                    className="shadow-xl ring-4 ring-white/20"
                  />
                  <span className="text-lg font-medium">{kid.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Selected kid + change button */}
            <div className="flex items-center gap-3">
              <Avatar
                member={kids.find((k) => k.id === selectedKid)!}
                size="xl"
                className="shadow-lg ring-2 ring-blue-400"
              />
              <div>
                <p className="text-lg font-semibold">{selectedName}</p>
                <button
                  onClick={() => {
                    jarvis.cancel();
                    setSelectedKid(null);
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Switch
                </button>
              </div>
            </div>

            {/* Mic button — skip during speaking, cancel during listening/processing */}
            <button
              onClick={
                jarvis.state === "speaking"
                  ? jarvis.skip
                  : jarvis.state !== "idle"
                    ? jarvis.cancel
                    : jarvis.startListening
              }
              className={`
                w-24 h-24 rounded-full shadow-2xl flex items-center justify-center
                transition-all active:scale-95
                ${
                  jarvis.state === "listening"
                    ? "bg-red-500 animate-pulse shadow-red-500/50"
                    : jarvis.state === "processing"
                      ? "bg-amber-500 shadow-amber-500/50"
                      : jarvis.state === "speaking"
                        ? "bg-blue-500 shadow-blue-500/50"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-blue-500/30 hover:scale-105"
                }
              `}
            >
              {jarvis.state === "listening" && (
                <Mic className="h-10 w-10" />
              )}
              {jarvis.state === "processing" && (
                <Loader2 className="h-10 w-10 animate-spin" />
              )}
              {jarvis.state === "speaking" && (
                <SkipForward className="h-10 w-10" />
              )}
              {jarvis.state === "idle" && <Mic className="h-10 w-10" />}
            </button>

            {/* State label */}
            <p className="text-sm text-white/50">
              {jarvis.state === "idle" && "Tap the mic and say something"}
              {jarvis.state === "listening" && "Listening..."}
              {jarvis.state === "processing" && "Thinking..."}
              {jarvis.state === "speaking" && "Speaking... tap to skip"}
            </p>

            {/* Transcript + Response */}
            {(jarvis.transcript || jarvis.responseText || jarvis.error) && (
              <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-2xl p-5 space-y-3">
                {jarvis.transcript && (
                  <p className="text-white/80 text-sm">
                    <span className="font-semibold text-white">
                      {selectedName}:
                    </span>{" "}
                    {jarvis.transcript}
                  </p>
                )}
                {jarvis.responseText && (
                  <p className="text-blue-300 text-sm">
                    <span className="font-semibold text-blue-200">
                      Jarvis:
                    </span>{" "}
                    {jarvis.responseText}
                  </p>
                )}
                {jarvis.error && (
                  <p className="text-red-400 text-sm">{jarvis.error}</p>
                )}
              </div>
            )}

            {/* Cancel button when active */}
            {jarvis.state !== "idle" && (
              <button
                onClick={jarvis.cancel}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">Cancel</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-white/30">
          Powered by Jarvis &middot; Jaffe Family Hub
        </p>
      </div>
    </div>
  );
}
