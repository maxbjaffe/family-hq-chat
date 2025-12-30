"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Message, { MessageType } from "./Message";

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center text-center mt-12">
          <Image
            src="/IMG_3028.JPG"
            alt="Family HQ"
            width={100}
            height={100}
            className="rounded-full mb-4 shadow-lg"
          />
          <p className="text-xl font-semibold text-amber-900">Hey there!</p>
          <p className="text-amber-700 mt-2 max-w-xs">
            Ask me about doctors, teachers, contacts, or anything family-related
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="px-3 py-1.5 bg-white/60 rounded-full text-sm text-amber-800 shadow-sm">
              Who&apos;s the pediatrician?
            </span>
            <span className="px-3 py-1.5 bg-white/60 rounded-full text-sm text-amber-800 shadow-sm">
              Riley&apos;s teachers?
            </span>
            <span className="px-3 py-1.5 bg-white/60 rounded-full text-sm text-amber-800 shadow-sm">
              Dentist number?
            </span>
          </div>
        </div>
      )}
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start items-end gap-2">
          <Image
            src="/IMG_3028.JPG"
            alt="Assistant"
            width={28}
            height={28}
            className="rounded-full"
          />
          <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
