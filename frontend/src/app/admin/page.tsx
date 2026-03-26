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
    <div className="min-h-screen">
      {/* ─── NORMAL SCREEN ─── */}
      <div className="p-8 max-w-7xl mx-auto print:hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-400">Jatayu Proctor — Assessment Management</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("monitor")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "monitor" ? "bg-orange-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "create" ? "bg-orange-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Create Exam
          </button>
        </div>

        {tab === "monitor" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Candidate Sessions</h2>
              <button
                onClick={() => {
                  setSessions(null);
                  void loadSessions();
                }}
                className="text-sm text-orange-500 hover:underline"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : (sessions ?? []).length === 0 ? (
              <p className="text-gray-500">No sessions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Phase</th>
                      <th className="px-4 py-3">MCQ</th>
                      <th className="px-4 py-3">Cadence</th>
                      <th className="px-4 py-3">Socratic</th>
                      <th className="px-4 py-3">Saboteur</th>
                      <th className="px-4 py-3">Total Violations</th>
                      <th className="px-4 py-3">Integrity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sessions ?? []).map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.candidate_name}</div>
                          <div className="text-xs text-gray-500">{s.candidate_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${s.phase === "COMPLETE" ? "bg-green-900 text-green-300" : "bg-blue-900 text-blue-300"}`}>
                            {s.phase}
                          </span>
                        </td>
                        <td className="px-4 py-3">{s.mcq_score ? Math.round(s.mcq_score) : "--"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCadenceBadge(s.cadence_verdict)}`}>
                            {s.cadence_verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3">{s.socratic_score ? Math.round(s.socratic_score) : "--"}</td>
                        <td className="px-4 py-3">
                          {s.phase === "COMPLETE" ? (
                            <span className={s.saboteur_passed ? "text-green-400" : "text-red-400"}>
                              {s.saboteur_passed ? "✓ PASS" : "✗ FAIL"}
                            </span>
                          ) : "--"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={s.tab_violations > 0 ? "text-red-400" : "text-gray-500"}>
                            {s.tab_violations}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {s.phase === "COMPLETE" ? Math.round(s.integrity_score) : "--"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setPrintSession(s)}
                            disabled={s.phase !== "COMPLETE"}
                            className="px-2 py-1 text-xs font-semibold bg-gray-800 text-gray-300 rounded hover:bg-blue-600 hover:text-white disabled:opacity-50 transition-colors"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="px-2 py-1 text-xs font-semibold bg-gray-800 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
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
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Create New Exam</h2>
            {createMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${createMsg.includes("success") ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                {createMsg}
              </div>
            )}
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500">
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time Limit (seconds)</label>
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min={300}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Available From (Optional)</label>
                  <input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 text-sm xl:text-base [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available Until (Optional)</label>
                  <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 text-sm xl:text-base [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Problem Prompt</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required rows={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Write a function that takes a list of integers and returns..." />
              </div>

              {/* MCQ Builder Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Multiple Choice Questions</label>
                  <button
                    type="button"
                    onClick={addMcq}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    + Add MCQ
                  </button>
                </div>

                {mcqs.map((mcq, qIdx) => (
                  <div key={qIdx} className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-300">MCQ Question {qIdx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMcq(qIdx)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={mcq.question}
                        onChange={(e) => updateMcq(qIdx, "question", e.target.value)}
                        placeholder="Enter question..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {mcq.options.map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={mcq.answer === oIdx}
                            onChange={() => updateMcq(qIdx, "answer", oIdx)}
                            className="text-orange-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded focus:outline-none focus:border-orange-500 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit"
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors">
                Create Exam
              </button>
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
