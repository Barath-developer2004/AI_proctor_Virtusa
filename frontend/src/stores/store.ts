import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "candidate";
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr) });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },
}));

// ─── Session store ───

type Phase = "MCQ" | "CODING" | "SOCRATIC" | "SABOTEUR" | "COMPLETE";

interface ChatMessage {
  role: "candidate" | "gemini";
  content: string;
}

interface SessionState {
  sessionId: string | null;
  examId: string | null;
  phase: Phase;
  code: string;
  mutatedCode: string;
  chatMessages: ChatMessage[];
  socraticScore: number | null;
  saboteurPassed: boolean | null;
  integrityScore: number | null;
  cadenceVerdict: string | null;

  setSession: (sessionId: string, examId: string) => void;
  setPhase: (phase: Phase) => void;
  setCode: (code: string) => void;
  setMutatedCode: (code: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setResults: (data: {
    socraticScore?: number;
    saboteurPassed?: boolean;
    integrityScore?: number;
    cadenceVerdict?: string;
  }) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  examId: null,
  phase: "MCQ",
  code: "",
  mutatedCode: "",
  chatMessages: [],
  socraticScore: null,
  saboteurPassed: null,
  integrityScore: null,
  cadenceVerdict: null,

  setSession: (sessionId, examId) => set({ sessionId, examId, phase: "MCQ", chatMessages: [] }),
  setPhase: (phase) => set({ phase }),
  setCode: (code) => set({ code }),
  setMutatedCode: (code) => set({ mutatedCode: code }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setResults: (data) =>
    set((s) => ({
      socraticScore: data.socraticScore ?? s.socraticScore,
      saboteurPassed: data.saboteurPassed ?? s.saboteurPassed,
      integrityScore: data.integrityScore ?? s.integrityScore,
      cadenceVerdict: data.cadenceVerdict ?? s.cadenceVerdict,
    })),
  reset: () =>
    set({
      sessionId: null,
      examId: null,
      phase: "MCQ",
      code: "",
      mutatedCode: "",
      chatMessages: [],
      socraticScore: null,
      saboteurPassed: null,
      integrityScore: null,
      cadenceVerdict: null,
    }),
}));
