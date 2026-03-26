"use client";

import { useState, useRef, useEffect } from "react";
import { sessionAPI } from "@/lib/api";
import { useSessionStore } from "@/stores/store";

interface Props {
  sessionId: string;
  onComplete: () => void;
}

export default function SocraticChat({ sessionId, onComplete }: Props) {
  const { chatMessages, addChatMessage } = useSessionStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const maxRounds = 5;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      // Because continuous=true, e.results contains all results. We take the latest one.
      const transcript = e.results[e.results.length - 1][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.start();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Start the first question automatically
  useEffect(() => {
    if (!initialized.current && chatMessages.length === 0) {
      initialized.current = true;
      sendMessage("I have submitted my code. Ready for questions.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (message: string) => {
    setLoading(true);
    addChatMessage({ role: "candidate", content: message });

    try {
      const { data } = await sessionAPI.socraticChat(sessionId, message);
      addChatMessage({ role: "gemini", content: data.response });
      
      // Voice Synthesis for Hackathon WOW factor
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(data.response);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Female"))) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.95; // Slightly slower for clarity
        
        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        utterance.onerror = () => setIsAiSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }

      setRound((r) => r + 1);
    } catch (error: any) {
      console.error("Socratic API Error:", error);
      addChatMessage({ role: "gemini", content: `Error: ${error.message || "Unknown error occurred"}. Try again.` });
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Socratic Assessment</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Round {round}/{maxRounds}
          </span>
          {round >= maxRounds && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Continue to Saboteur →
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4 text-center">
        The AI will question your understanding of the code. Answer concisely and accurately.
      </p>

      {/* Socratic AI Entity Orb */}
      <div className="flex justify-center items-center py-8 mb-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Core */}
          <div className={`absolute w-full h-full rounded-full transition-all duration-300 ${isAiSpeaking ? 'bg-gradient-to-br from-orange-400 to-rose-600 shadow-[0_0_60px_rgba(249,115,22,0.6)] scale-110 animate-pulse' : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100'}`}></div>
          
          {/* Inner rotating rings */}
          <div className={`absolute inset-[-10%] border-2 border-transparent rounded-full transition-all duration-500 pointer-events-none ${isAiSpeaking ? 'border-t-orange-400/80 animate-[spin_2s_linear_infinite] opacity-100 scale-105' : 'border-t-gray-700 opacity-50 scale-100'}`}></div>
          <div className={`absolute inset-[5%] border-2 border-transparent rounded-full transition-all duration-500 pointer-events-none ${isAiSpeaking ? 'border-b-rose-400/80 animate-[spin_3s_linear_reverse_infinite] opacity-100 scale-105' : 'border-b-gray-700 opacity-50 scale-100'}`}></div>
          
          {/* Center waveform/dot */}
          <div className={`absolute w-6 h-6 rounded-full transition-all duration-300 ${isAiSpeaking ? 'bg-white shadow-[0_0_20px_white] scale-[1.2]' : 'bg-gray-600'}`}></div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 h-[50vh] overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                msg.role === "candidate"
                  ? "bg-orange-600/20 border border-orange-600/30 text-gray-100"
                  : "bg-gray-800 border border-gray-700 text-gray-200"
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {msg.role === "candidate" ? "You" : "AI Examiner"}
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl text-sm text-gray-400">
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {round < maxRounds && (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer... (or use microphone)"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
          <button 
            type="button" 
            onClick={toggleListening}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${isListening ? 'bg-red-600 animate-pulse text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'}`}
            title="Speak into Microphone"
            disabled={loading}
          >
            {isListening ? "🎤 Listening..." : "🎤 Dictate"}
          </button>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
