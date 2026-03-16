"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitCode, submitDebuggedCode } from "@/lib/api";
import CodeEditor from "@/components/CodeEditor";
import SaboteurOverlay from "@/components/SaboteurOverlay";
import SocraticChat from "@/components/SocraticChat";

type Phase = "coding" | "submitting" | "saboteur" | "debugging" | "completed";

function AssessmentContent() {
  const searchParams = useSearchParams();
  const candidateId = Number(searchParams.get("candidateId") || 1);
  const assessmentId = Number(searchParams.get("assessmentId") || 1);

  const [code, setCode] = useState<string>(STARTER_CODE);
  const [phase, setPhase] = useState<Phase>("coding");
  const [mutatedCode, setMutatedCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [error, setError] = useState<string>("");

  // ─── Submit Solution → Saboteur Protocol ───
  const handleSubmit = useCallback(async () => {
    if (phase !== "coding") return;
    setPhase("submitting");
    setError("");

    try {
      const result = await submitCode(assessmentId, code);
      setMutatedCode(result.mutatedCode);
      setTimeLeft(result.debugTimeLimitSeconds);
      setPhase("saboteur");

      // Flash animation, then switch to debugging
      setTimeout(() => {
        setCode(result.mutatedCode);
        setPhase("debugging");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Submission failed");
      setPhase("coding");
    }
  }, [assessmentId, code, phase]);

  // ─── 60-Second Debug Countdown ───
  useEffect(() => {
    if (phase !== "debugging") return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleDebugSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // ─── Submit Debugged Code ───
  const handleDebugSubmit = async () => {
    try {
      await submitDebuggedCode(assessmentId, code);
      setPhase("completed");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Left: Code Editor (2 cols) ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between rounded-lg border border-jatayu-border bg-jatayu-panel px-4 py-3">
          <div className="flex items-center gap-3">
            <PhaseIndicator phase={phase} />
            <span className="text-sm text-gray-400">
              Assessment #{assessmentId}
            </span>
          </div>

          {phase === "debugging" && (
            <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
              timeLeft <= 10
                ? "animate-pulse-danger bg-jatayu-danger/20 text-jatayu-danger"
                : "bg-jatayu-warn/20 text-jatayu-warn"
            }`}>
              ⏱ {timeLeft}s remaining
            </div>
          )}
        </div>

        {/* Monaco Editor */}
        <div className="relative overflow-hidden rounded-xl border border-jatayu-border">
          {/* Saboteur flash overlay */}
          {phase === "saboteur" && <SaboteurOverlay />}

          <CodeEditor
            value={code}
            onChange={(val) => setCode(val || "")}
            readOnly={phase === "saboteur" || phase === "submitting" || phase === "completed"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {phase === "coding" && (
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-jatayu-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              🚀 Submit Solution
            </button>
          )}

          {phase === "debugging" && (
            <button
              onClick={handleDebugSubmit}
              className="rounded-lg bg-jatayu-success px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              ✅ Submit Debug Fix
            </button>
          )}

          {phase === "submitting" && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-jatayu-accent border-t-transparent" />
              Submitting to Saboteur Protocol...
            </div>
          )}

          {phase === "completed" && (
            <div className="flex items-center gap-2 rounded-lg bg-jatayu-success/20 px-4 py-2.5 text-sm text-jatayu-success">
              ✅ Assessment Complete — All phases finished
            </div>
          )}

          {error && (
            <p className="text-sm text-jatayu-danger">{error}</p>
          )}
        </div>

        {/* Problem Statement */}
        <div className="rounded-xl border border-jatayu-border bg-jatayu-panel p-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">📋 Problem Statement</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            Write a function that takes an array of integers and returns the two numbers 
            that add up to a specific target. You may assume there is exactly one solution. 
            Demonstrate clean logic and handle edge cases properly.
          </p>
        </div>
      </div>

      {/* ── Right: Socratic Chat (1 col) ── */}
      <div className="lg:col-span-1">
        <SocraticChat assessmentId={assessmentId} />
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const labels: Record<Phase, { icon: string; label: string; color: string }> = {
    coding:     { icon: "💻", label: "Coding",     color: "text-jatayu-accent" },
    submitting: { icon: "⏳", label: "Submitting", color: "text-jatayu-warn" },
    saboteur:   { icon: "💀", label: "SABOTEUR",   color: "text-jatayu-danger" },
    debugging:  { icon: "🔧", label: "Debug Mode", color: "text-jatayu-warn" },
    completed:  { icon: "✅", label: "Completed",  color: "text-jatayu-success" },
  };
  const { icon, label, color } = labels[phase];
  return (
    <span className={`text-sm font-bold ${color}`}>
      {icon} {label}
    </span>
  );
}

const STARTER_CODE = `// Jatayu Proctor — Coding Assessment
// Write your solution below

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
`;

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading assessment...</div>}>
      <AssessmentContent />
    </Suspense>
  );
}
