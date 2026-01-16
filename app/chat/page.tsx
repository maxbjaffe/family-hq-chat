"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";
import { MessageType } from "@/components/Message";
import { useUser } from "@/components/UserProvider";
import { PinModal } from "@/components/PinModal";

const STORAGE_KEY = "family-hq-chat-history";

export default function Home() {
  const { userId, userName, userRole, isAuthenticated, logout, login } = useUser();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

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
        body: JSON.stringify({
          message: content,
          history,
          user: userId ? { id: userId, name: userName, role: userRole } : null,
        }),
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

      // Handle SSE streaming response with tool use
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let streamedContent = "";
      let buffer = "";

      // Add empty assistant message that we'll update as we stream
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);
      setIsLoading(false); // Hide loading indicator once streaming starts

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete message in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6); // Remove "data: " prefix

          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);

            if (event.type === "text") {
              streamedContent += event.content;
            } else if (event.type === "tool_call") {
              // Optionally show tool call indicator
              streamedContent += `\n_Checking ${event.tool}..._\n`;
            } else if (event.type === "tool_result") {
              // Remove tool call indicator and continue
              streamedContent = streamedContent.replace(/\n_Checking [^_]+\.\.\._\n$/, "");
            } else if (event.type === "error") {
              streamedContent += `\n\nError: ${event.message}`;
            }

            // Update the assistant message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          } catch {
            // Ignore parse errors for malformed JSON
          }
        }
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

        {/* User status and actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-600">
                <span className="text-slate-400">Logged in as</span>{" "}
                <span className="font-medium">{userName}</span>
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPinModal(true)}
              className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium"
            >
              Login
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              New Chat
            </button>
          )}
        </div>
      </header>

      {/* PIN Modal for login */}
      {showPinModal && (
        <PinModal
          onSuccess={(user) => {
            login(user.id, user.name, user.role);
            setShowPinModal(false);
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      <MessageList messages={messages} isLoading={isLoading} onQuickAction={handleSend} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
