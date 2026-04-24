// ============================================================
// Vercel Serverless Function — Gemini API Proxy
// This keeps your API key hidden on the server side
// Deployed automatically by Vercel at /api/chat
// ============================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  try {
    const { systemPrompt, userMessage, history = [] } = req.body;

    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: "Missing systemPrompt or userMessage" });
    }

    const contents = [
      ...history.map(h => ({
        role: h.role === "assistant" ? "model" : h.role,
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        error: err?.error?.message || `Gemini API error: ${geminiRes.status}`
      });
    }

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
