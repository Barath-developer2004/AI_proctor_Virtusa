"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore, useSessionStore } from "@/stores/store";
import { sessionAPI, examAPI, createTelemetrySocket } from "@/lib/api";
import CodeEditor from "@/components/editor/CodeEditor";
import SocraticChat from "@/components/socratic/SocraticChat";
import SaboteurView from "@/components/saboteur/SaboteurView";
import ResultsView from "@/components/ui/ResultsView";
import CameraProctor from "@/components/ui/CameraProctor";
import MCQView from "@/components/mcq/MCQView";

type GuardMessage =
  | { source: "jatayu-proctor-guard"; type: "KEYSTROKE"; payload: { key: string; event_type: string; timestamp: number; delta: number } }
  | { source: "jatayu-proctor-guard"; type: "CLIPBOARD_EVENT"; payload: { action: "copy" | "paste"; timestamp: number } }
  | { source: "jatayu-proctor-guard"; type: "DEVTOOLS_OPEN"; payload: { timestamp: number } };

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { hydrate } = useAuthStore();
  const { phase, setSession, setPhase, setCode, setMutatedCode, setResults, code } = useSessionStore();
  const wsRef = useRef<WebSocket | null>(null);
  const lastKeyTime = useRef<number>(0);
  const extensionTelemetrySeen = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [examMCQs, setExamMCQs] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load session info
  useEffect(() => {
    sessionAPI.get(sessionId).then(async ({ data }) => {
      setSession(data.id, data.exam_id);
      setPhase(data.phase);
      if (data.code) setCode(data.code);
      if (data.mutated_code) setMutatedCode(data.mutated_code);
      
      try {
        const examRes = await examAPI.get(data.exam_id);
        setPrompt(examRes.data.prompt);
        setExamMCQs(examRes.data.mcqs || []);
        setSelectedLanguage(examRes.data.language || "python");
      } catch (err) {
        console.error("Failed to fetch prompt", err);
      }
      
      setLoaded(true);
    }).catch(() => router.push("/dashboard"));
  }, [sessionId, setSession, setPhase, setCode, setMutatedCode, router]);

  // WebSocket for telemetry
  useEffect(() => {
    if (!loaded || phase !== "CODING") return;
    const ws = createTelemetrySocket(sessionId);
    wsRef.current = ws;
    return () => { ws?.close(); };
  }, [loaded, phase, sessionId]);

  // Tell the extension to start/stop monitoring for this session
  useEffect(() => {
    if (!loaded) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    if (phase === "CODING" && token) {
      window.postMessage(
        { source: "jatayu-proctor-app", type: "START_MONITORING", sessionId, token, apiBase },
        "*"
      );
    }
    return () => {
      if (token) {
        window.postMessage({ source: "jatayu-proctor-app", type: "STOP_MONITORING" }, "*");
      }
    };
  }, [loaded, phase, sessionId]);

  // Listen for proctor-guard events from the extension (keystrokes, clipboard, devtools)
  useEffect(() => {
    if (!loaded) return;
    const onMessage = (event: MessageEvent<unknown>) => {
      const data = event.data as GuardMessage | undefined;
      if (!data || data.source !== "jatayu-proctor-guard") return;

      if (data.type === "KEYSTROKE") {
        extensionTelemetrySeen.current = true;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify(data.payload));
        return;
      }

      if (data.type === "CLIPBOARD_EVENT") {
        sessionAPI.reportViolation(sessionId, data.payload.action);
        return;
      }

      if (data.type === "DEVTOOLS_OPEN") {
        sessionAPI.reportViolation(sessionId, "devtools_open");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loaded, sessionId]);

  // Keystroke handler - sends telemetry via WebSocket
  const handleKeyEvent = useCallback(
    (e: KeyboardEvent) => {
      if (extensionTelemetrySeen.current) return; // avoid double-streaming when extension is installed
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const now = performance.now();
      const delta = lastKeyTime.current ? now - lastKeyTime.current : 0;
      lastKeyTime.current = now;
      wsRef.current.send(
        JSON.stringify({
          key: e.key,
          event_type: e.type,
          timestamp: now,
          delta,
        })
      );
    },
    []
  );

  useEffect(() => {
    if (phase !== "CODING") return;
    window.addEventListener("keydown", handleKeyEvent);
    window.addEventListener("keyup", handleKeyEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyEvent);
      window.removeEventListener("keyup", handleKeyEvent);
    };
  }, [phase, handleKeyEvent]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phase !== "COMPLETE") {
        sessionAPI.reportViolation(sessionId, "visibility_hidden");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [sessionId, phase]);

  // Prevent accidental tab close/refresh
  useEffect(() => {
    if (phase === "COMPLETE") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave the exam?"; // Chrome requires this
      return;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  // Submit MCQs → transition to Coding
  const handleSubmitMCQs = async (answers: number[]) => {
    try {
      const { data } = await sessionAPI.submitMCQs(sessionId, answers);
      setPhase(data.phase);
    } catch {
      alert("MCQ submission failed");
    }
  };
  const handleSubmitCode = async () => {
    try {
      const { data } = await sessionAPI.submitCode(sessionId, code, selectedLanguage);
      setPhase(data.phase);
    } catch {
      alert("Submission failed");
    }
  };

  // End socratic → transition to Saboteur
  const handleEndSocratic = async () => {
    try {
      const { data } = await sessionAPI.endSocratic(sessionId);
      setPhase(data.phase);
      setMutatedCode(data.mutated_code);
      setResults({ socraticScore: data.socratic_score });
    } catch {
      alert("Failed to end Socratic phase");
    }
  };

  // Submit saboteur fix → Complete
  const handleSaboteurSubmit = async (fixCode: string) => {
    try {
      const { data } = await sessionAPI.saboteurFix(sessionId, fixCode);
      setPhase("COMPLETE");
      setResults({
        saboteurPassed: data.saboteur_passed,
        integrityScore: data.integrity_score,
        cadenceVerdict: data.cadence_verdict,
        socraticScore: data.socratic_score,
      });
    } catch {
      alert("Submission failed");
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading exam session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Sleek sticky header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-800/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 font-black tracking-tight text-lg">
              Jatayu <span className="text-white">Proctor</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center bg-gray-900/80 rounded-full p-1 border border-gray-800">
            {(["MCQ", "CODING", "SOCRATIC", "SABOTEUR", "COMPLETE"] as const).map((p) => (
              <div
                key={p}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  phase === p
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                    : "text-gray-500"
                }`}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Session ID</span>
            <span className="text-cyan-400 text-sm font-mono font-bold">{sessionId.slice(0, 8)}</span>
          </div>
          {phase !== "COMPLETE" && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to finish and quit the exam? Your progress may not be saved.")) {
                  router.push("/dashboard");
                }
              }}
              className="px-4 py-2 bg-red-950/40 text-red-500 hover:bg-red-600 hover:text-white rounded-lg border border-red-900/50 text-xs font-bold transition-all uppercase tracking-wider"
            >
              Quit Exam
            </button>
          )}
        </div>
      </header>

      {/* Phase content area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
        {/* Mobile phase indicator */}
        <div className="sm:hidden mb-6 flex justify-center">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]">
            PHASE: {phase}
          </span>
        </div>

        {phase === "MCQ" && (
          <MCQView mcqs={examMCQs} onSubmit={handleSubmitMCQs} />
        )}

        {phase === "CODING" && (
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {prompt && (
              <div className="glass-card p-6 md:p-8 rounded-2xl">
                <h3 className="flex items-center gap-3 text-cyan-400 font-black text-xl mb-4 uppercase tracking-widest">
                  <span className="w-2 h-8 bg-cyan-500 rounded-full inline-block shadow-[0_0_10px_rgba(6,182,212,0.6)]"></span>
                  Problem Statement
                </h3>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed font-medium bg-black/30 p-4 rounded-xl border border-gray-800">
                  {prompt}
                </div>
              </div>
            )}

            <div className="glass-panel p-2 rounded-2xl overflow-hidden shadow-2xl">
              <CodeEditor onChange={setCode} language={selectedLanguage} onLanguageChange={setSelectedLanguage} />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitCode}
                disabled={!code.trim()}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 rounded-xl font-black text-white text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3"
              >
                Submit Solution
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )}

        {phase === "SOCRATIC" && (
          <SocraticChat sessionId={sessionId} onComplete={handleEndSocratic} />
        )}

        {phase === "SABOTEUR" && (
          <SaboteurView sessionId={sessionId} onSubmit={handleSaboteurSubmit} />
        )}

        {phase === "COMPLETE" && <ResultsView />}
      </main>

      {/* Floating Proctor Widget */}
      {phase !== "COMPLETE" && <CameraProctor sessionId={sessionId} />}
    </div>
  );
}
