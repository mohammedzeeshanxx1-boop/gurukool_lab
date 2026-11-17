export interface HealthStatusResponse {
  status: string;
  service: string;
  geminiConfigured: boolean;
  timestamp: string;
}

export interface TutorExplainRequest {
  question: string;
  subject: string;
  classLevel: string;
  board: string;
  language: string;
}

export interface TutorExplainResponse {
  explanation: string;
  model: string;
}

export async function fetchHealthStatus(
  signal?: AbortSignal,
): Promise<HealthStatusResponse> {
  const response = await fetch("/api/health", { signal });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return (await response.json()) as HealthStatusResponse;
}

export async function requestTutorExplanation(
  payload: TutorExplainRequest,
): Promise<TutorExplainResponse> {
  const response = await fetch("/api/tutor/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    explanation?: string;
    model?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}`,
    );
  }

  if (!data.explanation) {
    throw new Error("Server returned an empty explanation.");
  }

  return {
    explanation: data.explanation,
    model: data.model || "gemini-4-hydrogen",
  };
}
