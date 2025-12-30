"use client";

import Image from "next/image";

export interface MessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Image
          src="/IMG_3028.JPG"
          alt="Assistant"
          width={32}
          height={32}
          className="rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
        />
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-sm shadow-md"
            : "bg-white/90 backdrop-blur-sm text-slate-700 rounded-bl-sm shadow-sm border border-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
