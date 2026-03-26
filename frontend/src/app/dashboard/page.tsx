"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/store";
import { examAPI, sessionAPI } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  description: string;
  language: string;
  time_limit_sec: number;
  available_from?: string;
  available_until?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, hydrate, logout } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      router.push("/admin");
      return;
    }
    examAPI.list().then(({ data }) => {
      const now = new Date();
      const visibleExams = data.filter((exam: Exam) => {
        if (exam.available_from && new Date(exam.available_from) > now) return false;
        if (exam.available_until && new Date(exam.available_until) < now) return false;
        return true;
      });
      setExams(visibleExams);
      setLoading(false);
    });
  }, [user, router]);

  const startExam = async (examId: string) => {
    try {
      const { data } = await sessionAPI.start(examId);
      router.push(`/exam/${data.id}`);
    } catch (error: any) {
      alert("Failed to start exam session. ERROR: " + (error.response?.data?.error || error.message || String(error)));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto relative">
      {/* Ambient background */}
      <div className="ambient-blob blob-orange opacity-10"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 glass-panel p-6 rounded-2xl relative z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-1">Candidate Dashboard</h1>
          <p className="text-gray-400 text-lg">Welcome back, <span className="text-orange-400 font-semibold">{user.name}</span></p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/demo")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-black tracking-widest uppercase hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all border border-cyan-400/30"
          >
            ★ Demo Hub
          </button>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-6 py-3 glass-panel text-gray-300 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-2 h-8 bg-orange-500 rounded-full inline-block"></span>
          Available Assessments
        </h2>

        {loading ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Loading assessments...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border-dashed border-2 border-gray-700">
            <p className="text-gray-400 text-lg">No assessments are currently available for you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="glass-card p-8 rounded-2xl flex flex-col h-full relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-orange-500/20"></div>

                <h3 className="font-bold text-2xl text-white mb-2">{exam.title}</h3>
                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{exam.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mb-6 font-medium">
                  <span className="px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {exam.language.toUpperCase()}
                  </span>
                  <span className="px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    {Math.floor(exam.time_limit_sec / 60)} Minutes
                  </span>
                </div>

                <button
                  onClick={() => startExam(exam.id)}
                  className="w-full py-3 premium-btn rounded-xl text-white font-bold text-sm uppercase tracking-wider"
                >
                  Start Assessment →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
