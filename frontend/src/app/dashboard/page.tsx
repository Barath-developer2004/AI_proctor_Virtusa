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
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400">Welcome, {user.name}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/demo")}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-black tracking-widest uppercase hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
          >
            ★ Demo Hub
          </button>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Available Exams</h2>
      {loading ? (
        <p className="text-gray-400">Loading exams...</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500">No exams available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-orange-500/50 transition-colors"
            >
              <h3 className="font-semibold text-lg mb-1">{exam.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{exam.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="px-2 py-1 bg-gray-800 rounded">{exam.language}</span>
                <span>{Math.floor(exam.time_limit_sec / 60)} min</span>
              </div>
              <button
                onClick={() => startExam(exam.id)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
