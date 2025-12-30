"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";
import { MessageType } from "@/components/Message";

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
          content: data.error || "Sorry, something went wrong.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the server.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-center p-4 border-b bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Family HQ</h1>
      </header>
      <MessageList messages={messages} isLoading={isLoading} />
      <div ref={messagesEndRef} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
