"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionStore } from "@/stores/store";
import CodeEditor from "@/components/editor/CodeEditor";

interface Props {
  sessionId: string;
  onSubmit: (code: string) => void;
}

export default function SaboteurView({ onSubmit }: Props) {
  const { mutatedCode } = useSessionStore();
  const [fixCode, setFixCode] = useState(mutatedCode);
  const [timeLeft, setTimeLeft] = useState(60);
  const submitted = useRef(false);

  useEffect(() => {
    setFixCode(mutatedCode);
  }, [mutatedCode]);

  useEffect(() => {
    // Cinematic Hackathon Alarm Sound using Web Audio API
    if (typeof window !== "undefined") {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        // Siren effect
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1.0);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
      } catch (e) {}
    }
  }, []);

  // 60-second countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          if (!submitted.current) {
            submitted.current = true;
            onSubmit(fixCode);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fixCode, onSubmit]);

  const handleSubmit = () => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(fixCode);
  };

  const urgency =
    timeLeft <= 10 ? "text-red-500" : timeLeft <= 30 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="relative">
      {/* Full screen red pulsing vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-red-900/10 mix-blend-color-burn animate-pulse shadow-[inset_0_0_100px_rgba(255,0,0,0.5)]"></div>
      
      <div className="max-w-5xl mx-auto relative z-10 p-6 rounded-xl border border-red-600 shadow-[0_0_40px_rgba(255,0,0,0.3)] bg-black/90">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-red-500 tracking-widest uppercase animate-pulse">
              ⚠ SYSTEM COMPROMISED: SABOTEUR PROTOCOL
            </h2>
            <p className="text-red-300 font-mono text-sm mt-1">
              MALICIOUS PAYLOAD DETECTED. FIX THE BUG BEFORE THE TIMER EXPIRES.
            </p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-mono font-black ${urgency} drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]`}>
              {timeLeft}s
            </div>
            <p className="text-red-400 font-mono text-xs tracking-widest">CRITICAL COUNTDOWN</p>
          </div>
        </div>

        <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 mb-4 font-mono text-sm text-red-400">
          [ROOT@PROCTOR]~$ FATAL EXCEPTION: Incorrect output generated. System integrity failing...
        </div>

        <div className="border border-red-900/50 rounded-lg overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-repeating-linear-gradient(transparent, transparent 2px, rgba(255,0,0,0.05) 3px, rgba(255,0,0,0.05) 3px) z-10"></div>
          <CodeEditor onChange={setFixCode} value={fixCode} />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={timeLeft === 0}
            className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,0,0.5)] disabled:opacity-50 rounded-lg font-black tracking-widest uppercase transition-all"
          >
            Deploy Patch
          </button>
        </div>
      </div>
    </div>
  );
}
