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
    <div className="min-h-screen">
      {/* Phase indicator */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold">Jatayu Proctor</span>
          <div className="flex gap-2">
            {(["MCQ", "CODING", "SOCRATIC", "SABOTEUR", "COMPLETE"] as const).map((p) => (
              <span
                key={p}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  phase === p
                    ? "bg-orange-600 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">Session: {sessionId.slice(0, 8)}</span>
          {phase !== "COMPLETE" && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to finish and quit the exam? Your progress may not be saved.")) {
                  router.push("/dashboard");
                }
              }}
              className="px-3 py-1 bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white rounded border border-red-700/50 text-xs font-bold transition-colors uppercase tracking-wider"
            >
              Quit Exam
            </button>
          )}
        </div>
      </div>

      {/* Phase content */}
      <div className="p-4">
        {phase === "MCQ" && (
          <MCQView mcqs={examMCQs} onSubmit={handleSubmitMCQs} />
        )}

        {phase === "CODING" && (
          <div className="flex flex-col gap-4">
            {prompt && (
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
                <h3 className="text-orange-500 font-bold text-lg mb-3">Problem Statement</h3>
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{prompt}</p>
              </div>
            )}
            <CodeEditor onChange={setCode} language={selectedLanguage} onLanguageChange={setSelectedLanguage} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitCode}
                disabled={!code.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-semibold transition-colors shadow-lg"
              >
                Submit Code →
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
      </div>

      {/* Floating Proctor Widget */}
      {phase !== "COMPLETE" && <CameraProctor sessionId={sessionId} />}
    </div>
  );
}
