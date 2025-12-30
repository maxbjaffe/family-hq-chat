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
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 bg-white border-t border-slate-200">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything..."
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white disabled:bg-slate-100 placeholder:text-slate-400 transition-all"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-5 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  );
}
