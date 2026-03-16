"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";

interface Message {
  role: "CANDIDATE" | "AI";
  content: string;
}

interface SocraticChatProps {
  assessmentId: number;
}

export default function SocraticChat({ assessmentId }: SocraticChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "AI",
      content:
        "Welcome to the Socratic Micro-Assessment. I'll ask you technical questions and probe deeper based on your answers. Let's begin:\n\nExplain the time complexity of your solution and why you chose that approach.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Add candidate message
    const candidateMsg: Message = { role: "CANDIDATE", content: text };
    setMessages((prev) => [...prev, candidateMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(assessmentId, text);
      setMessages((prev) => [
        ...prev,
        { role: "AI", content: result.aiReply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "AI", content: "⚠️ AI service unavailable. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[640px] flex-col rounded-xl border border-jatayu-border bg-jatayu-panel">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-jatayu-border px-4 py-3">
        <span className="text-sm">🧠</span>
        <h3 className="text-sm font-semibold">Socratic AI Interviewer</h3>
        <span className="ml-auto rounded-full bg-jatayu-accent/20 px-2 py-0.5 text-xs text-jatayu-accent">
          Live
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "CANDIDATE" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "CANDIDATE"
                  ? "bg-jatayu-accent/20 text-white"
                  : "bg-jatayu-dark text-gray-300 border border-jatayu-border"
              }`}
            >
              {msg.role === "AI" && (
                <span className="mb-1 block text-xs font-semibold text-jatayu-accent">
                  AI Interviewer
                </span>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-jatayu-border bg-jatayu-dark px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-jatayu-border p-3">
        <div className="flex gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 resize-none rounded-lg border border-jatayu-border bg-jatayu-dark px-3 py-2.5 text-sm outline-none focus:border-jatayu-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-jatayu-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
