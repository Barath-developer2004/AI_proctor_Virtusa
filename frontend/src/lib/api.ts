import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ─── Exams ───
export const examAPI = {
  list: () => api.get("/exams"),
  create: (data: { title: string; description: string; language: string; prompt: string; time_limit_sec: number; mcqs: any[]; available_from?: string; available_until?: string }) => api.post("/exams", data),
  get: (id: string) => api.get(`/exams/${id}`),
};

// ─── Sessions ───
export const sessionAPI = {
  start: (examId: string) => api.post("/sessions/start", { exam_id: examId }),
  get: (id: string) => api.get(`/sessions/${id}`),
  submitMCQs: (id: string, answers: number[]) => api.post(`/sessions/${id}/submit-mcqs`, { answers }),
  submitCode: (id: string, code: string, language: string) => api.post(`/sessions/${id}/submit-code`, { code, language }),
  socraticChat: (id: string, message: string) => api.post(`/sessions/${id}/socratic`, { message }),
  endSocratic: (id: string) => api.post(`/sessions/${id}/end-socratic`),
  saboteurFix: (id: string, code: string) => api.post(`/sessions/${id}/saboteur-fix`, { code }),
  reportViolation: (id: string, type?: string) => api.post(`/sessions/${id}/violation`, type ? { type } : {}),
};

// ─── Admin ───
export const adminAPI = {
  listSessions: () => api.get("/admin/sessions"),
  deleteSession: (id: string) => api.delete(`/admin/sessions/${id}`),
};

// ─── WebSocket ───
export function createTelemetrySocket(sessionId: string): WebSocket | null {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  const wsBase = API_BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/ws/telemetry?token=${token}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ session_id: sessionId }));
  };

  return ws;
}

export default api;
