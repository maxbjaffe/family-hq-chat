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
        <div className="flex flex-col items-center text-center mt-16">
          <Image
            src="/IMG_3028.JPG"
            alt="Family HQ"
            width={88}
            height={88}
            className="rounded-full ring-4 ring-white shadow-lg mb-5"
          />
          <p className="text-lg font-medium text-slate-700">What can I help you find?</p>
          <p className="text-slate-400 mt-1 text-sm">
            Doctors, teachers, contacts &amp; more
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-sm">
            <span className="px-3 py-2 bg-white rounded-xl text-sm text-slate-600 shadow-sm border border-slate-100">
              Pediatrician&apos;s number?
            </span>
            <span className="px-3 py-2 bg-white rounded-xl text-sm text-slate-600 shadow-sm border border-slate-100">
              Riley&apos;s teachers
            </span>
            <span className="px-3 py-2 bg-white rounded-xl text-sm text-slate-600 shadow-sm border border-slate-100">
              Dentist info
            </span>
          </div>
        </div>
      )}
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start items-end gap-2.5">
          <Image
            src="/IMG_3028.JPG"
            alt="Assistant"
            width={32}
            height={32}
            className="rounded-full ring-2 ring-white shadow-sm"
          />
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
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
