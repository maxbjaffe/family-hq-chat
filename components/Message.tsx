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
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Image
          src="/IMG_3028.JPG"
          alt="Assistant"
          width={28}
          height={28}
          className="rounded-full flex-shrink-0"
        />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser
            ? "bg-amber-500 text-white rounded-br-md"
            : "bg-white text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
