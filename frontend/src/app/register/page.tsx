"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/store";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "admin">("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.register({ email, password, name, role });
      setAuth(data.user, data.token);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative overflow-hidden bg-black">
      {/* Ambient background */}
      <div className="ambient-blob blob-purple opacity-20"></div>
      <div className="ambient-blob blob-cyan opacity-20" style={{ left: '10%', top: '20%' }}></div>

      <div className="w-full max-w-md glass-card p-10 rounded-2xl z-10 relative my-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 tracking-tight">
              Jatayu <span className="text-white">Proctor</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Join the assessment platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-500"
              placeholder="John Doe"
            />
          </div>
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
              minLength={8}
              className="w-full px-4 py-3 premium-input rounded-xl text-white placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "candidate" | "admin")}
                className="w-full px-4 py-3 premium-input rounded-xl text-white appearance-none pr-10"
              >
                <option value="candidate" className="bg-gray-900">Candidate</option>
                <option value="admin" className="bg-gray-900">Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 premium-btn text-white rounded-xl font-bold text-lg transition-all"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
