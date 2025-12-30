"use client";

import { useState, FormEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white/80 backdrop-blur-sm border-t border-amber-200">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-white border border-amber-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-gray-50 placeholder:text-amber-400"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-5 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 disabled:bg-amber-200 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        Send
      </button>
    </form>
  );
}
