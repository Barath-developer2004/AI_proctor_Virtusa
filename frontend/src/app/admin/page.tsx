"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/store";
import { examAPI, adminAPI } from "@/lib/api";

interface SessionRow {
  id: string;
  exam_id: string;
  candidate_id: string;
  phase: string;
  started_at: string;
  integrity_score: number;
  cadence_verdict: string;
  socratic_score: number;
  saboteur_passed: boolean;
  tab_violations: number;
  mcq_score: number;
  candidate_name: string;
  candidate_email: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, hydrate, logout } = useAuthStore();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [tab, setTab] = useState<"monitor" | "create">("monitor");
  const loading = sessions === null;
  const [printSession, setPrintSession] = useState<SessionRow | null>(null);

  // Exam creation form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [prompt, setPrompt] = useState("");
  const [timeLimit, setTimeLimit] = useState(1800);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [mcqs, setMcqs] = useState<{ question: string; options: string[]; answer: number }[]>([]);
  const [createMsg, setCreateMsg] = useState("");

  const addMcq = () => {
    setMcqs([...mcqs, { question: "", options: ["", "", "", ""], answer: 0 }]);
  };

  const updateMcq = (index: number, field: string, value: any) => {
    const newMcqs = [...mcqs];
    if (field === "question") newMcqs[index].question = value;
    if (field === "answer") newMcqs[index].answer = value;
    setMcqs(newMcqs);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const newMcqs = [...mcqs];
    newMcqs[qIdx].options[oIdx] = value;
    setMcqs(newMcqs);
  };

  const removeMcq = (index: number) => {
    setMcqs(mcqs.filter((_, i) => i !== index));
  };

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await adminAPI.listSessions();
      setSessions(data);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessions();
  }, [user, router, loadSessions]);

  useEffect(() => {
    if (printSession) {
      setTimeout(() => {
        window.print();
        setPrintSession(null);
      }, 500);
    }
  }, [printSession]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg("");
    try {
      const payload: any = { title, description, language, prompt, time_limit_sec: timeLimit, mcqs };
      if (availableFrom) payload.available_from = new Date(availableFrom).toISOString();
      if (availableUntil) payload.available_until = new Date(availableUntil).toISOString();
      await examAPI.create(payload);
      setCreateMsg("Exam created successfully!");
      setTitle(""); setDescription(""); setPrompt(""); setMcqs([]); setAvailableFrom(""); setAvailableUntil("");
    } catch {
      setCreateMsg("Failed to create exam.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this session?")) return;
    try {
      await adminAPI.deleteSession(id);
      void loadSessions();
    } catch (err) {
      alert("Failed to delete session.");
    }
  };

  const getCadenceBadge = (verdict: string) => {
    const colors: Record<string, string> = {
      ORGANIC: "bg-green-900 text-green-300",
      SUSPICIOUS: "bg-yellow-900 text-yellow-300",
      SYNTHETIC: "bg-red-900 text-red-300",
      PENDING: "bg-gray-800 text-gray-400",
    };
    return colors[verdict] || colors.PENDING;
  };

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Ambient backgrounds */}
      <div className="ambient-blob blob-cyan opacity-10"></div>

      {/* ─── NORMAL SCREEN ─── */}
      <div className="p-8 max-w-7xl mx-auto print:hidden relative z-10">
        <div className="flex items-center justify-between mb-8 glass-panel p-6 rounded-2xl">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            <p className="text-cyan-400 font-medium">Jatayu Proctor — Assessment Management</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-6 py-2 border border-gray-700 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors bg-black/50"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab("monitor")}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === "monitor" ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]" : "glass-panel text-gray-400 hover:text-white"}`}
          >
            <span className="mr-2">📊</span> Live Monitor
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === "create" ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]" : "glass-panel text-gray-400 hover:text-white"}`}
          >
            <span className="mr-2">✍️</span> Create Exam
          </button>
        </div>

        {tab === "monitor" && (
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Candidate Sessions</h2>
              <button
                onClick={() => {
                  setSessions(null);
                  void loadSessions();
                }}
                className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-cyan-400 transition-colors flex items-center gap-2"
              >
                <span>↻</span> Refresh
              </button>
            </div>
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400 font-medium">Loading sessions...</p>
              </div>
            ) : (sessions ?? []).length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-500">No candidate sessions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 bg-gray-900/80 border-b border-gray-800 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Candidate</th>
                      <th className="px-6 py-4 font-semibold">Phase</th>
                      <th className="px-6 py-4 font-semibold">MCQ</th>
                      <th className="px-6 py-4 font-semibold">Cadence</th>
                      <th className="px-6 py-4 font-semibold">Socratic</th>
                      <th className="px-6 py-4 font-semibold">Saboteur</th>
                      <th className="px-6 py-4 font-semibold">Violations</th>
                      <th className="px-6 py-4 font-semibold">Integrity</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(sessions ?? []).map((s) => (
                      <tr key={s.id} className="bg-black/20 hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-200">{s.candidate_name}</div>
                          <div className="text-xs text-gray-500">{s.candidate_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.phase === "COMPLETE" ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-blue-900/50 text-blue-400 border border-blue-800"}`}>
                            {s.phase}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-300">{s.mcq_score ? Math.round(s.mcq_score) : "--"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border border-transparent ${getCadenceBadge(s.cadence_verdict)}`}>
                            {s.cadence_verdict}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-300">{s.socratic_score ? Math.round(s.socratic_score) : "--"}</td>
                        <td className="px-6 py-4 font-bold">
                          {s.phase === "COMPLETE" ? (
                            <span className={s.saboteur_passed ? "text-green-500" : "text-red-500"}>
                              {s.saboteur_passed ? "✓ PASS" : "✗ FAIL"}
                            </span>
                          ) : <span className="text-gray-600">--</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold px-3 py-1 rounded-md ${s.tab_violations > 0 ? "bg-red-900/30 text-red-400 border border-red-800/50" : "text-gray-500"}`}>
                            {s.tab_violations}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-lg text-white">
                          {s.phase === "COMPLETE" ? Math.round(s.integrity_score) : "--"}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => setPrintSession(s)}
                            disabled={s.phase !== "COMPLETE"}
                            className="text-sm font-semibold text-cyan-500 hover:text-cyan-400 disabled:opacity-30 transition-colors"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "create" && (
          <div className="glass-card p-8 rounded-2xl max-w-3xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-800 pb-4">Create New Assessment</h2>
            {createMsg && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${createMsg.includes("success") ? "bg-green-950/40 border-green-500/30 text-green-400" : "bg-red-950/40 border-red-500/30 text-red-400"}`}>
                {createMsg}
              </div>
            )}
            <form onSubmit={handleCreateExam} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Assessment Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-600" placeholder="e.g. Senior Frontend Engineer Test" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Short Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-600" placeholder="Brief overview of what this tests..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Target Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 premium-input rounded-xl text-white">
                    <option value="python" className="bg-gray-900">Python</option>
                    <option value="javascript" className="bg-gray-900">JavaScript</option>
                    <option value="java" className="bg-gray-900">Java</option>
                    <option value="cpp" className="bg-gray-900">C++</option>
                    <option value="go" className="bg-gray-900">Go</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Time Limit (seconds)</label>
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min={300}
                    className="w-full px-4 py-3 premium-input rounded-xl text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Available From (Optional)</label>
                  <input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-4 py-3 premium-input rounded-xl text-white [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Available Until (Optional)</label>
                  <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)}
                    className="w-full px-4 py-3 premium-input rounded-xl text-white [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Main Coding Prompt</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required rows={8}
                  className="w-full px-4 py-3 premium-input rounded-xl text-white font-mono text-sm leading-relaxed"
                  placeholder="Write a function that takes a list of integers and returns..." />
              </div>

              {/* MCQ Builder Section */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Multiple Choice Questions</h3>
                    <p className="text-sm text-gray-400">Add MCQs to test foundational knowledge.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addMcq}
                    className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600 hover:text-white text-sm font-bold rounded-xl transition-all"
                  >
                    + Add Question
                  </button>
                </div>

                {mcqs.map((mcq, qIdx) => (
                  <div key={qIdx} className="bg-black/40 p-5 rounded-xl border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-cyan-400">Question {qIdx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMcq(qIdx)}
                        className="text-red-500 hover:text-red-400 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={mcq.question}
                        onChange={(e) => updateMcq(qIdx, "question", e.target.value)}
                        placeholder="Enter the question here..."
                        className="w-full px-4 py-3 premium-input rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mcq.options.map((option, oIdx) => (
                        <div key={oIdx} className={`flex items-center gap-3 p-2 rounded-lg border ${mcq.answer === oIdx ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-gray-900/50'}`}>
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={mcq.answer === oIdx}
                            onChange={() => updateMcq(qIdx, "answer", oIdx)}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-gray-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button type="submit"
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white text-lg transition-colors shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)]">
                  Launch Assessment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ─── PRINT OVERLAY ─── */}
      {printSession && (
        <div className="hidden print:block p-8 bg-white text-black min-h-screen">
          <div className="border-b-2 border-slate-800 pb-4 mb-8">
            <h1 className="text-3xl font-black mb-1">Jatayu Proctor — Official Report</h1>
            <p className="text-gray-500 text-sm">Session ID: {printSession.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-1">Candidate Details</h3>
              <p className="text-xl font-bold">{printSession.candidate_name}</p>
              <p className="text-gray-600">{printSession.candidate_email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-1">Final Verdict</h3>
              <p className="text-4xl font-black">{Math.round(printSession.integrity_score)} / 100</p>
              <p className="text-gray-600 font-medium">Integrity Score</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Multiple Choice Questions</h4>
                <p className="text-sm text-gray-500">Knowledge assessment score.</p>
              </div>
              <span className="font-black text-lg">{Math.round(printSession.mcq_score)}/100</span>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Keystroke Cadence Analysis</h4>
                <p className="text-sm text-gray-500">Detects copy/paste and AI Ghost-Typing.</p>
              </div>
              <span className="font-black text-lg">{printSession.cadence_verdict}</span>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Socratic AI Examiner</h4>
                <p className="text-sm text-gray-500">Automated technical code-level interview score.</p>
              </div>
              <span className="font-black text-lg">{Math.round(printSession.socratic_score)}/100</span>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Saboteur Protocol</h4>
                <p className="text-sm text-gray-500">Did the candidate survive the live debugging challenge?</p>
              </div>
              <span className="font-black text-lg">{printSession.saboteur_passed ? "PASSED" : "FAILED"}</span>
            </div>

            <div className="p-4 border border-red-100 rounded-lg bg-red-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-red-900">Total Behavioral Violations</h4>
                <p className="text-sm text-red-700">Combined count of tab-switches, head-movements, and loud noises.</p>
              </div>
              <span className="font-black text-2xl text-red-600">{printSession.tab_violations}</span>
            </div>
          </div>
          
          <div className="mt-16 text-center text-xs text-gray-400">
            <p>Generated by Jatayu Proctoring System • Fully Automated AI Assessment</p>
          </div>
        </div>
      )}
    </div>
  );
}
