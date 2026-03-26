"use client";

import { useSessionStore } from "@/stores/store";
import Link from "next/link";

export default function ResultsView() {
  const { integrityScore, cadenceVerdict, socraticScore, saboteurPassed } = useSessionStore();

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getCadenceColor = (verdict: string | null) => {
    switch (verdict) {
      case "ORGANIC": return "text-green-400";
      case "SUSPICIOUS": return "text-yellow-400";
      case "SYNTHETIC": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const handleDownloadReport = () => {
    const reportText = `Jatayu Proctor — Official Assessment Report
-------------------------------------------
Final Integrity Score: ${integrityScore !== null ? Math.round(integrityScore) : "--"}/100

Detailed Breakdown:
- Ghost-Typing Verdict: ${cadenceVerdict || "--"}
- Socratic AI Evaluation: ${socraticScore !== null ? Math.round(socraticScore) : "--"}/100
- Saboteur Protocol: ${saboteurPassed === null ? "--" : saboteurPassed ? "PASSED" : "FAILED"}

Generated automatically by Jatayu Proctor.`;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Jatayu_Assessment_Report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <h2 className="text-3xl font-bold mb-2">Assessment Complete</h2>
      <p className="text-gray-400 mb-8">Here are your integrity results</p>

      {/* Overall score */}
      <div className="mb-10">
        <div className={`text-7xl font-bold font-mono ${getScoreColor(integrityScore)}`}>
          {integrityScore !== null ? Math.round(integrityScore) : "--"}
        </div>
        <p className="text-gray-500 mt-2">Integrity Score / 100</p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Ghost-Typing Verdict</div>
          <div className={`text-2xl font-bold ${getCadenceColor(cadenceVerdict)}`}>
            {cadenceVerdict || "--"}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Keystroke cadence analysis (35% weight)
          </p>
        </div>

        <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Socratic Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(socraticScore)}`}>
            {socraticScore !== null ? Math.round(socraticScore) : "--"}/100
          </div>
          <p className="text-xs text-gray-500 mt-2">
            AI interview evaluation (40% weight)
          </p>
        </div>

        <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Saboteur Protocol</div>
          <div className={`text-2xl font-bold ${saboteurPassed ? "text-green-400" : "text-red-400"}`}>
            {saboteurPassed === null ? "--" : saboteurPassed ? "PASSED" : "FAILED"}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Live debugging challenge (25% weight)
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-4 print:hidden">
        <button
          onClick={handleDownloadReport}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors"
        >
          Download Text Report 📄
        </button>
        <Link
          href="/dashboard"
          className="px-6 py-2 border border-gray-700 rounded-lg hover:border-orange-500 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
