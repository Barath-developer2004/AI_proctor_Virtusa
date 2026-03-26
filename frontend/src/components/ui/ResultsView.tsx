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
    <div className="max-w-4xl mx-auto text-center py-16 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-cyan-500/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      <div className="relative z-10 glass-card p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-700/50">
        <div className="mb-4 inline-block p-4 rounded-full bg-green-500/10 border border-green-500/30">
          <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Assessment Complete</h2>
        <p className="text-gray-400 text-lg mb-12">Your final AI-verified integrity results</p>

        {/* Overall score */}
        <div className="mb-14 relative">
          <div className={`absolute inset-0 bg-current opacity-5 blur-3xl rounded-full ${getScoreColor(integrityScore)}`} style={{ transform: 'scale(1.5)' }}></div>
          <div className={`text-[8rem] leading-none font-black font-mono tracking-tighter drop-shadow-lg ${getScoreColor(integrityScore)}`}>
            {integrityScore !== null ? Math.round(integrityScore) : "--"}
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest mt-4">Integrity Score / 100</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
          <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Ghost-Typing</div>
            <div className={`text-3xl font-black mb-2 ${getCadenceColor(cadenceVerdict)}`}>
              {cadenceVerdict || "--"}
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Keystroke cadence analysis
            </p>
          </div>

          <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Socratic Score</div>
            <div className={`text-3xl font-black mb-2 ${getScoreColor(socraticScore)}`}>
              {socraticScore !== null ? Math.round(socraticScore) : "--"}<span className="text-lg text-gray-500">/100</span>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              AI technical interview
            </p>
          </div>

          <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Saboteur</div>
            <div className={`text-3xl font-black mb-2 ${saboteurPassed ? "text-green-400" : "text-red-400"}`}>
              {saboteurPassed === null ? "--" : saboteurPassed ? "PASSED" : "FAILED"}
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Live debugging challenge
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
          <button
            onClick={handleDownloadReport}
            className="w-full sm:w-auto px-8 py-4 premium-btn text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Report
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 glass-panel text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
