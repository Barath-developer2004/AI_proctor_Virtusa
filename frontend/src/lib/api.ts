const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── Candidate ───
export function registerCandidate(name: string, email: string) {
  return request<{ id: number; name: string; email: string; sessionToken: string }>(
    "/api/candidates/register",
    { method: "POST", body: JSON.stringify({ name, email }) }
  );
}

export function getCandidate(id: number) {
  return request<{ id: number; name: string; email: string; sessionToken: string }>(
    `/api/candidates/${id}`
  );
}

// ─── Assessment ───
export function createAssessment(candidateId: number, title: string, problemStatement: string) {
  return request<{ id: number; title: string; status: string }>(
    "/api/assessments",
    { method: "POST", body: JSON.stringify({ candidateId, title, problemStatement }) }
  );
}

export function getAssessment(id: number) {
  return request<{
    id: number;
    title: string;
    problemStatement: string;
    status: string;
    submittedCode: string;
    saboteurMutatedCode: string;
  }>(`/api/assessments/${id}`);
}

// ─── Saboteur Protocol ───
export function submitCode(assessmentId: number, code: string, language: string = "javascript") {
  return request<{ assessmentId: number; mutatedCode: string; debugTimeLimitSeconds: number }>(
    "/api/assessments/submit-code",
    { method: "POST", body: JSON.stringify({ assessmentId, code, language }) }
  );
}

export function submitDebuggedCode(assessmentId: number, code: string) {
  return request<{ id: number; status: string; message: string }>(
    `/api/assessments/${assessmentId}/submit-debug`,
    { method: "POST", body: JSON.stringify({ code }) }
  );
}

// ─── Socratic Chat ───
export function sendChatMessage(assessmentId: number, message: string) {
  return request<{ assessmentId: number; aiReply: string }>(
    "/api/chat/message",
    { method: "POST", body: JSON.stringify({ assessmentId, message }) }
  );
}

export function getChatHistory(assessmentId: number) {
  return request<{ role: string; content: string; sentAt: string }[]>(
    `/api/chat/history/${assessmentId}`
  );
}

// ─── Telemetry ───
export function getTelemetryEvents(candidateId: number) {
  return request<{ id: number; eventType: string; severity: string; recordedAt: string }[]>(
    `/api/telemetry/candidate/${candidateId}`
  );
}

export function getViolationCount(candidateId: number) {
  return request<{ candidateId: number; violationCount: number }>(
    `/api/telemetry/candidate/${candidateId}/count`
  );
}
