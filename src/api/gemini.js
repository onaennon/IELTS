// ============================================================
// AI API — calls /api/chat (Vercel serverless proxy)
// The actual Gemini API key lives on the server, not here
// Set GEMINI_API_KEY (no VITE_ prefix) in Vercel env vars
// ============================================================

export async function callAI(systemPrompt, userMessage, history = []) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text || "";
}

export function parseJSON(raw) {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
}
