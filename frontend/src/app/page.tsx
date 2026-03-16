"use client";

import { useState } from "react";
import { registerCandidate, createAssessment } from "@/lib/api";

export default function HomePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState<{
    id: number;
    sessionToken: string;
    assessmentId?: number;
  } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const candidate = await registerCandidate(name.trim(), email.trim());
      const assessment = await createAssessment(
        candidate.id,
        "Coding Challenge",
        "Write a function that solves the given problem. You will be tested on your debugging ability."
      );
      setRegistered({
        id: candidate.id,
        sessionToken: candidate.sessionToken,
        assessmentId: assessment.id,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-jatayu-accent">Jatayu</span> Proctor
          </h1>
          <p className="mt-2 text-gray-400">
            Agentic AI Assessment Platform
          </p>
        </div>

        {!registered ? (
          <form
            onSubmit={handleRegister}
            className="space-y-4 rounded-xl border border-jatayu-border bg-jatayu-panel p-6"
          >
            <h2 className="text-lg font-semibold">Candidate Registration</h2>

            <div>
              <label className="mb-1 block text-sm text-gray-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-jatayu-border bg-jatayu-dark px-4 py-2.5 text-sm outline-none focus:border-jatayu-accent transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-jatayu-border bg-jatayu-dark px-4 py-2.5 text-sm outline-none focus:border-jatayu-accent transition-colors"
                placeholder="john@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-jatayu-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-jatayu-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Start Assessment →"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 rounded-xl border border-jatayu-border bg-jatayu-panel p-6 text-center">
            <div className="text-3xl">✅</div>
            <h2 className="text-lg font-semibold">Registration Successful</h2>
            <p className="text-sm text-gray-400">
              Candidate ID: <span className="font-mono text-white">{registered.id}</span>
            </p>
            <p className="text-sm text-gray-400">
              Session: <span className="font-mono text-xs text-white">{registered.sessionToken}</span>
            </p>
            <a
              href={`/assessment?candidateId=${registered.id}&assessmentId=${registered.assessmentId}`}
              className="mt-4 inline-block rounded-lg bg-jatayu-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Enter Assessment →
            </a>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
          <div className="rounded-lg border border-jatayu-border bg-jatayu-panel p-3">
            <div className="text-lg">🛡️</div>
            <p className="mt-1">Guardian Watchdog</p>
          </div>
          <div className="rounded-lg border border-jatayu-border bg-jatayu-panel p-3">
            <div className="text-lg">💀</div>
            <p className="mt-1">Saboteur Protocol</p>
          </div>
          <div className="rounded-lg border border-jatayu-border bg-jatayu-panel p-3">
            <div className="text-lg">🧠</div>
            <p className="mt-1">Socratic AI Chat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
