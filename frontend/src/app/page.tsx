import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen py-20 px-4 flex flex-col items-center bg-black text-gray-100 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="ambient-blob blob-orange"></div>
      <div className="ambient-blob blob-cyan"></div>
      <div className="ambient-blob blob-purple"></div>

      <div className="text-center max-w-4xl my-auto z-10 relative">
        <h1 className="text-7xl font-black tracking-tighter mb-4 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 glow-text-orange">
            Jatayu
          </span>{" "}
          Proctor
        </h1>
        <p className="text-2xl font-medium text-cyan-400 mb-6 tracking-wide uppercase">
          Agentic AI Assessment Platform
        </p>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
          Dynamic, AI-driven coding assessments that make cheating impossible
          through <span className="text-gray-200 font-medium">Ghost-Typing Telemetry</span>,{" "}
          <span className="text-gray-200 font-medium">Socratic Micro-Assessments</span>, and the
          dreaded <span className="text-gray-200 font-medium">Saboteur Protocol</span>.
        </p>

        {/* Hackathon Demo Hub Button (Integrated cleanly into original design) */}
        <div className="mb-12 animate-pulse hover:animate-none">
          <Link
            href="/demo"
            className="inline-block px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_30px_rgba(8,145,178,0.5)] hover:shadow-[0_0_50px_rgba(8,145,178,0.8)] text-white rounded-2xl font-black tracking-widest uppercase transition-all hover:-translate-y-1 border border-cyan-400/30"
          >
            ★ Launch Demo Hub
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/login"
            className="px-10 py-4 premium-btn text-white rounded-xl font-bold text-lg text-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-10 py-4 glass-panel hover:bg-white/10 text-white rounded-xl font-bold text-lg transition-all text-center"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="glass-card p-8 rounded-2xl">
            <div className="text-4xl mb-6 bg-gray-800/50 w-16 h-16 flex items-center justify-center rounded-xl border border-gray-700/50">👻</div>
            <h3 className="font-bold text-xl mb-3 text-gray-100">Ghost-Typing Telemetry</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tracks millisecond-level keystroke cadence to differentiate organic
              human thinking from synthetic robotic transcription.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl">
            <div className="text-4xl mb-6 bg-gray-800/50 w-16 h-16 flex items-center justify-center rounded-xl border border-gray-700/50">🧠</div>
            <h3 className="font-bold text-xl mb-3 text-gray-100">Socratic Micro-Assessment</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-driven timed chat where Gemini dynamically counter-questions the
              candidate to verify deep understanding.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl">
            <div className="text-4xl mb-6 bg-gray-800/50 w-16 h-16 flex items-center justify-center rounded-xl border border-gray-700/50">🔧</div>
            <h3 className="font-bold text-xl mb-3 text-gray-100">The Saboteur Protocol</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI secretly injects a logical bug into submitted code. Candidate gets
              60 seconds to debug their own logic live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
