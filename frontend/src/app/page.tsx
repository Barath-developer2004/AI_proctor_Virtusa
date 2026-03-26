import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen py-20 px-4 flex flex-col items-center bg-black text-gray-100">
      <div className="text-center max-w-3xl my-auto">
        <h1 className="text-6xl font-bold tracking-tight mb-4">
          <span className="text-orange-500">Jatayu</span> Proctor
        </h1>
        <p className="text-xl text-gray-400 mb-2">Agentic AI Assessment</p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Dynamic, AI-driven coding assessments that make cheating impossible
          through Ghost-Typing Telemetry, Socratic Micro-Assessments, and the
          Saboteur Protocol.
        </p>

        {/* Hackathon Demo Hub Button (Integrated cleanly into original design) */}
        <div className="mb-10 animate-bounce">
          <Link
            href="/demo"
            className="inline-block px-10 py-3 bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.5)] text-white rounded-xl font-bold tracking-wider uppercase transition-all"
          >
            ★ Launch Demo Hub
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-gray-700 hover:border-orange-500 rounded-lg font-semibold transition-colors"
          >
            Register
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 transition-all hover:-translate-y-1 hover:border-gray-600">
            <div className="text-2xl mb-3">👻</div>
            <h3 className="font-semibold text-lg mb-2">Ghost-Typing Telemetry</h3>
            <p className="text-gray-400 text-sm">
              Tracks millisecond-level keystroke cadence to differentiate organic
              human thinking from synthetic robotic transcription.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 transition-all hover:-translate-y-1 hover:border-gray-600">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="font-semibold text-lg mb-2">Socratic Micro-Assessment</h3>
            <p className="text-gray-400 text-sm">
              AI-driven timed chat where Gemini dynamically counter-questions the
              candidate to verify deep understanding.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 transition-all hover:-translate-y-1 hover:border-gray-600">
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="font-semibold text-lg mb-2">The Saboteur Protocol</h3>
            <p className="text-gray-400 text-sm">
              AI secretly injects a logical bug into submitted code. Candidate gets
              60 seconds to debug their own logic live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
