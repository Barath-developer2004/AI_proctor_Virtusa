"use client";

import { useState, useEffect, useRef } from "react";
import SaboteurView from "@/components/saboteur/SaboteurView";
import Link from "next/link";
// We won't use SocraticChat directly since it requires a real sessionId and store, 
// so we'll build a standalone mock version for the demo that just talks.

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState<"menu" | "socratic" | "saboteur">("menu");

  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([
    { role: "gemini", content: "Hello! I am the Socratic AI Examiner. I noticed you used a loop to sort the array. Can you explain the time complexity of your approach?" }
  ]);
  const [chatIn, setChatIn] = useState("");
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
      const transcript = e.results[e.results.length - 1][0].transcript;
      setChatIn((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.start();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (activeDemo === "socratic" && chatLog.length === 1 && "speechSynthesis" in window) {
      setTimeout(() => {
         window.speechSynthesis.cancel();
         const u = new SpeechSynthesisUtterance(chatLog[0].content);
         const voices = window.speechSynthesis.getVoices();
         const v = voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) || voices[0];
         if (v) u.voice = v;
         u.rate = 0.95;
         
         u.onstart = () => setIsAiSpeaking(true);
         u.onend = () => setIsAiSpeaking(false);
         u.onerror = () => setIsAiSpeaking(false);

         window.speechSynthesis.speak(u);
      }, 500);
    }
  }, [activeDemo, chatLog]);

  const handleSocraticDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatIn.trim()) return;
    const newLog = [...chatLog, { role: "candidate", content: chatIn }];
    setChatLog(newLog);
    setChatIn("");

    setTimeout(() => {
      const resp = `Excellent explanation. O(n log n) is indeed optimal for comparison-based sorting. Let's move on to the next section.`;
      setChatLog([...newLog, { role: "gemini", content: resp }]);
      
      if ("speechSynthesis" in window) {
         window.speechSynthesis.cancel();
         const u = new SpeechSynthesisUtterance(resp);
         const voices = window.speechSynthesis.getVoices();
         const v = voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) || voices[0];
         if (v) u.voice = v;
         u.rate = 0.95;
         
         u.onstart = () => setIsAiSpeaking(true);
         u.onend = () => setIsAiSpeaking(false);
         u.onerror = () => setIsAiSpeaking(false);

         window.speechSynthesis.speak(u);
      }
    }, 1000);
  };

  if (activeDemo === "saboteur") {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <button onClick={() => setActiveDemo("menu")} className="mb-4 text-cyan-500 hover:text-cyan-400 font-mono tracking-widest uppercase text-sm">
          ← Back to Demo Menu
        </button>
        <SaboteurView sessionId="demo-session-123" onSubmit={(code) => alert("Fix submitted! Demo complete.")} />
      </div>
    );
  }

  if (activeDemo === "socratic") {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <button 
          onClick={() => {
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
            setActiveDemo("menu");
          }} 
          className="mb-8 text-cyan-500 hover:text-cyan-400 font-mono tracking-widest uppercase text-sm"
        >
          ← Back to Demo Menu
        </button>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">Voice-Enabled Socratic AI</h1>
            <p className="text-gray-400 mt-2">Turn your volume up! The AI assesses you verbally.</p>
          </div>

          {/* Socratic AI Entity Orb */}
          <div className="flex justify-center items-center py-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Core */}
              <div className={`absolute w-full h-full rounded-full transition-all duration-300 ${isAiSpeaking ? 'bg-gradient-to-br from-orange-400 to-rose-600 shadow-[0_0_60px_rgba(249,115,22,0.6)] scale-110 animate-pulse' : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100'}`}></div>
              
              {/* Inner rotating rings */}
              <div className={`absolute inset-[-10%] border-2 border-transparent rounded-full transition-all duration-500 pointer-events-none ${isAiSpeaking ? 'border-t-orange-400/80 animate-[spin_2s_linear_infinite] opacity-100 scale-105' : 'border-t-gray-700 opacity-50 scale-100'}`}></div>
              <div className={`absolute inset-[5%] border-2 border-transparent rounded-full transition-all duration-500 pointer-events-none ${isAiSpeaking ? 'border-b-rose-400/80 animate-[spin_3s_linear_reverse_infinite] opacity-100 scale-105' : 'border-b-gray-700 opacity-50 scale-100'}`}></div>
              
              {/* Center waveform/dot */}
              <div className={`absolute w-5 h-5 rounded-full transition-all duration-300 ${isAiSpeaking ? 'bg-white shadow-[0_0_20px_white] scale-[1.2]' : 'bg-gray-600'}`}></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-[350px] overflow-auto space-y-4">
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-xl max-w-[80%] ${msg.role === 'candidate' ? 'bg-orange-600/20 text-orange-100 border border-orange-500/30' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                  <div className="text-xs opacity-50 mb-1">{msg.role === 'candidate' ? 'You' : 'AI Examiner'}</div>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSocraticDemo} className="flex gap-2">
            <input 
              value={chatIn} onChange={e => setChatIn(e.target.value)} 
              placeholder="Reply to the AI... (or use microphone)" 
              className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-orange-500" 
            />
            <button 
              type="button" 
              onClick={toggleListening}
              className={`px-4 rounded-lg font-bold transition-colors ${isListening ? 'bg-red-600 animate-pulse text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'}`}
              title="Speak into Microphone"
            >
              {isListening ? "🎤 Listening..." : "🎤 Dictate"}
            </button>
            <button type="submit" className="bg-orange-600 px-6 font-bold rounded-lg hover:bg-orange-500 transition-colors">Send</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-8 flex flex-col items-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0f1c] to-black">
      <div className="max-w-4xl w-full my-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 tracking-tight drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] text-white">
            Hackathon Demo Hub 🚀
          </h1>
          <p className="text-xl text-cyan-400 font-mono tracking-widest">Wow the judges instantly.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <button onClick={() => setActiveDemo("socratic")} className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-left transition-all hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-2xl font-bold text-white mb-2">🗣️ Socratic Voice AI</h2>
            <p className="text-gray-400">Instantly launch the interactive voice examiner model. Make sure your speakers are on!</p>
          </button>
          
          <button onClick={() => setActiveDemo("saboteur")} className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-left transition-all hover:border-red-500/50 hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">⚠ Saboteur Attack</h2>
            <p className="text-gray-400">Trigger the cinematic "System Compromised" hacker event immediately.</p>
          </button>
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/dashboard" className="text-gray-500 hover:text-white underline underline-offset-4">
            Return to Normal Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
