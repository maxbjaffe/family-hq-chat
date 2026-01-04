"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";
import { MessageType } from "@/components/Message";

const STORAGE_KEY = "family-hq-chat-history";

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
    setIsHydrated(true);
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build history for API (exclude IDs, just role and content)
      const history = messages.map(({ role, content }) => ({ role, content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage: MessageType = {
          id: assistantMessageId,
          role: "assistant",
          content: data.error || "Oops, something went wrong!",
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let streamedContent = "";

      // Add empty assistant message that we'll update as we stream
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);
      setIsLoading(false); // Hide loading indicator once streaming starts

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamedContent += decoder.decode(value, { stream: true });

        // Update the assistant message with streamed content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: streamedContent }
              : msg
          )
        );
      }
    } catch {
      const errorMessage: MessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: "Hmm, couldn't connect. Try again in a sec!",
      };
      setMessages((prev) => {
        // If we already added an empty assistant message, update it
        const existing = prev.find((m) => m.id === assistantMessageId);
        if (existing) {
          return prev.map((msg) =>
            msg.id === assistantMessageId ? errorMessage : msg
          );
        }
        return [...prev, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-teal-50/30">
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <Image
          src="/IMG_3028.JPG"
          alt="Family HQ"
          width={36}
          height={36}
          className="rounded-full ring-2 ring-purple-100"
        />
        <div className="flex-1">
          <h1 className="text-base font-semibold bg-gradient-to-r from-slate-800 to-purple-900 bg-clip-text text-transparent">Family HQ</h1>
          <p className="text-xs text-slate-400">Always here to help</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            New Chat
          </button>
        )}
      </header>
      <MessageList messages={messages} isLoading={isLoading} onQuickAction={handleSend} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
