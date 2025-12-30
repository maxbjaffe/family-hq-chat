"use client";

import { useState } from "react";
import Image from "next/image";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";
import { MessageType } from "@/components/Message";

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Oops, something went wrong!",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Hmm, couldn't connect. Try again in a sec!",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <Image
          src="/IMG_3028.JPG"
          alt="Family HQ"
          width={36}
          height={36}
          className="rounded-full ring-2 ring-slate-100"
        />
        <div>
          <h1 className="text-base font-semibold text-slate-800">Family HQ</h1>
          <p className="text-xs text-slate-400">Always here to help</p>
        </div>
      </header>
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
