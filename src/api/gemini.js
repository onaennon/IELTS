// ============================================================
// GEMINI API
// Key is read from VITE_GEMINI_API_KEY environment variable
// Local:  create a .env file with VITE_GEMINI_API_KEY=your_key
// Vercel: add VITE_GEMINI_API_KEY in Project → Settings → Env Vars
// ============================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function callAI(systemPrompt, userMessage, history = []) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing API key. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const contents = [
    ...history.map(h => ({
      role: h.role === "assistant" ? "model" : h.role,
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export function parseJSON(raw) {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
}
