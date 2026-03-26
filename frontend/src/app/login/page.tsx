"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      setAuth(data.user, data.token);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative overflow-hidden bg-black">
      {/* Ambient background */}
      <div className="ambient-blob blob-orange opacity-20"></div>
      <div className="ambient-blob blob-cyan opacity-20" style={{ left: '60%', top: '60%' }}></div>

      <div className="w-full max-w-md glass-card p-10 rounded-2xl z-10 relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 tracking-tight">
              Jatayu <span className="text-white">Proctor</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Sign In</h1>
          <p className="text-gray-400 mt-2">Access your assessment dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 premium-btn text-white rounded-xl font-bold text-lg transition-all"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
