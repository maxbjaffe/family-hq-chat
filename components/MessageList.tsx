"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Message, { MessageType } from "./Message";

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
  onQuickAction?: (message: string) => void;
}

const QUICK_ACTIONS = [
  "Pediatrician's number?",
  "Riley's teachers",
  "Dentist info",
  "What's missing?",
];

const GREETINGS = [
  "Hey! Ready when you are.",
  "What's up? I've got all the family info ready!",
  "Hey there! Need a phone number, doctor info, or something else?",
  "Hi! Ask me anything about the fam.",
  "Ready to help! What do you need?",
];

function getGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export default function MessageList({ messages, isLoading, onQuickAction }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<string>(getGreeting());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <>
          {/* Greeting message bubble */}
          <div className="flex justify-start items-end gap-2.5">
            <Image
              src="/IMG_3028.JPG"
              alt="Assistant"
              width={32}
              height={32}
              className="rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
            />
            <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm border border-slate-100">
              <p className="text-[15px] leading-relaxed">{greetingRef.current}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 ml-10 mt-2">
            {QUICK_ACTIONS.map((action, index) => (
              <button
                key={action}
                onClick={() => onQuickAction?.(action)}
                className={`px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-sm text-slate-600 shadow-sm border transition-all hover:shadow-md active:scale-95 ${
                  index % 2 === 0
                    ? "border-purple-100/50 hover:border-purple-300 hover:bg-purple-50/50"
                    : "border-teal-100/50 hover:border-teal-300 hover:bg-teal-50/50"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </>
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gradient-to-r from-teal-400 to-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-2 h-2 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full animate-bounce"
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
