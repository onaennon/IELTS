// ============================================================
// Vercel Serverless Function — Gemini API Proxy
// Vercel automatically serves this at /api/chat
// Set GEMINI_API_KEY in Vercel Project Settings → Environment Variables
// ============================================================

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Set CORS headers first — needed for all responses including OPTIONS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const { systemPrompt, userMessage, history = [] } = req.body;

    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: "Missing systemPrompt or userMessage in request body." });
    }

    const contents = [
      ...history.map(h => ({
        role: h.role === "assistant" ? "model" : h.role,
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      return res.status(geminiRes.status).json({
        error: err?.error?.message || `Gemini returned status ${geminiRes.status}`
      });
    }

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
