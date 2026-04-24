import { useState, useEffect, useRef, useCallback } from "react";
import { CircularTimer, cities, Loading } from "./shared.jsx";
import { callAI, parseJSON } from "../api/gemini.js";
import { TRAVEL_TYPING_SYSTEM } from "../data/prompts.js";

export default function TypingGame({ setPage, scores, saveScores, settings }) {
  const DURATION = 300;
  const [phase, setPhase]         = useState("intro");
  const [theme, setTheme]         = useState("");
  const [sentence, setSentence]   = useState("");
  const [timeLeft, setTimeLeft]   = useState(DURATION);
  const [totalScore, setTotalScore] = useState(0);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const [aiHistory, setAiHistory] = useState([]);
  const [error, setError]         = useState("");

  const intervalRef  = useRef(null);
  const inputRef     = useRef(null);
  const sentenceRef  = useRef("");
  const historyRef   = useRef([]);
  const totalRef     = useRef(0);

  // Keep refs in sync for use inside timer callback
  useEffect(() => { sentenceRef.current = sentence; }, [sentence]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { totalRef.current = totalScore; }, [totalScore]);

  const submitSentence = useCallback(async (forcedText) => {
    const text = (forcedText ?? sentenceRef.current).trim();
    if (!text) return;
    setSentence("");
    sentenceRef.current = "";
    setLoading(true);
    setError("");
    try {
      const resp = await callAI(TRAVEL_TYPING_SYSTEM, text, aiHistory);
      const parsed = parseJSON(resp);
      const pts = typeof parsed.score === "number" ? parsed.score : 0;
      const entry = { sentence: text, score: pts, feedback: parsed.feedback };
      setHistory(h => { const next = [...h, entry]; historyRef.current = next; return next; });
      setTotalScore(s => { const next = s + pts; totalRef.current = next; return next; });
      setFeedback({ score: pts, feedback: parsed.feedback });
      setAiHistory(h => [...h,
        { role:"user", content: text },
        { role:"model", content: resp }
      ]);
    } catch (e) {
      setError("Scoring failed — check your API key.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [aiHistory]);

  const startRound = async () => {
    setPhase("loading");
    setError("");
    try {
      const resp = await callAI(TRAVEL_TYPING_SYSTEM, "START_ROUND");
      const parsed = parseJSON(resp);
      setTheme(parsed.theme || "Describe your journey through a famous European city.");
      setAiHistory([
        { role:"user",  content:"START_ROUND" },
        { role:"model", content: resp }
      ]);
      setPhase("playing");
      setTimeLeft(DURATION);
      setTotalScore(0);
      totalRef.current = 0;
      setHistory([]);
      historyRef.current = [];
      setFeedback(null);
      setSentence("");
      sentenceRef.current = "";
    } catch (e) {
      setError("Could not start round. Check your API key.");
      setPhase("intro");
    }
  };

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          const typed = sentenceRef.current.trim();
          if (typed) {
            submitSentence(typed).then(() => setPhase("results"));
          } else {
            setPhase("results");
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase, submitSentence]);

  const saveAndExit = () => {
    if (historyRef.current.length === 0) { setPage("home"); return; }
    const city = cities[Math.floor(Math.random() * cities.length)].name;
    saveScores({
      ...scores,
      typing: {
        best: Math.max(scores.typing.best, totalRef.current),
        last: totalRef.current,
        sessions: scores.typing.sessions + 1,
      },
      cityScores: {
        ...scores.cityScores,
        [city]: (scores.cityScores[city] || 0) + totalRef.current
      }
    });
    setPage("home");
  };

  // ── INTRO / LOADING ──
  if (phase === "intro" || phase === "loading") return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
        <h2 className="display display-md">Travel Typing</h2>
        <div style={{ width:72 }}/>
      </div>
      <div className="scroll-area text-center">
        <p style={{ fontSize:"3.5rem", marginBottom:20 }}>🗺️</p>
        <h2 className="display display-lg mb-md">5 Minute Challenge</h2>
        <p className="body-md mb-lg" style={{ maxWidth:320, margin:"0 auto 20px" }}>
          The AI gives you a European travel theme. Write as many correct sentences as possible before time runs out.
        </p>
        <div className="card mb-lg" style={{ textAlign:"left", maxWidth:340, margin:"0 auto 20px" }}>
          <p className="label mb-sm">Scoring Rules</p>
          <p className="body-sm mb-xs">• Perfect, complex sentence = 9–10 pts</p>
          <p className="body-sm mb-xs">• Grammar errors = heavy deductions</p>
          <p className="body-sm mb-xs">• Off-theme = 0–3 pts only</p>
          <p className="body-sm mb-xs">• Simple sentences = max 5 pts</p>
          <p className="body-sm">• Nothing typed at timeout = not counted</p>
        </div>
        {error && <p className="error-text mb-md">{error}</p>}
        {phase === "loading" ? (
          <div className="flex items-center justify-center gap-md">
            <Loading/><p className="body-sm">Getting your theme...</p>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ minWidth:220 }} onClick={startRound}>
            Start Round →
          </button>
        )}
      </div>
    </div>
  );

  // ── RESULTS ──
  if (phase === "results") return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={saveAndExit}>← Save & Exit</button>
        <h2 className="display display-md">Results</h2>
        <button className="back-btn" onClick={() => setPhase("intro")}>Play Again</button>
      </div>
      <div className="scroll-area text-center">
        <p className="label mb-sm">Total Score</p>
        <div style={{
          fontFamily:"var(--font-display)", fontSize:"5rem", fontWeight:300, lineHeight:1, marginBottom:8,
          background:"linear-gradient(135deg,#ff6b9d,#ffd700)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"
        }}>{totalScore}</div>
        <p className="body-sm mb-lg">{history.length} sentence{history.length !== 1 ? "s" : ""} scored</p>

        {history.length === 0 ? (
          <div className="card mb-lg">
            <p className="body-md">No sentences were scored this session.</p>
          </div>
        ) : (
          <div style={{ textAlign:"left" }} className="mb-lg">
            <p className="label mb-sm">Breakdown</p>
            {history.map((h,i) => (
              <div key={i} className="card mb-sm" style={{ padding:"13px 15px" }}>
                <div className="flex items-center justify-between mb-xs">
                  <p className="body-sm" style={{ flex:1, marginRight:8, fontStyle:"italic", color:"var(--off-white)" }}>
                    "{h.sentence}"
                  </p>
                  <span className={`badge ${h.score>=7?"badge-green":h.score>=4?"badge-gold":"badge-red"}`}>
                    {h.score}/10
                  </span>
                </div>
                <p className="body-sm">{h.feedback}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-md">
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={saveAndExit}>Save & Exit</button>
          <button className="btn btn-primary"   style={{ flex:1 }} onClick={() => setPhase("intro")}>Play Again</button>
        </div>
      </div>
    </div>
  );

  // ── PLAYING ──
  return (
    <div className="page">
      <div className="sticky-header">
        <div className="flex items-center justify-between">
          <button className="back-btn btn-sm" onClick={() => {
            clearInterval(intervalRef.current);
            setPhase("results");
          }}>⏹ End</button>
          <CircularTimer seconds={timeLeft} total={DURATION}/>
          <div style={{ textAlign:"right" }}>
            <p className="label" style={{ fontSize:"0.68rem" }}>Score</p>
            <p style={{
              fontFamily:"var(--font-display)", fontSize:"1.8rem",
              fontWeight:300, color:"var(--gold)", lineHeight:1
            }}>{totalScore}</p>
          </div>
        </div>
      </div>

      <div className="scroll-area">
        <div className="card mb-md" style={{ borderColor:"rgba(255,107,157,0.35)" }}>
          <p className="label mb-xs">✈️ Theme</p>
          <p className="body-lg" style={{ fontStyle:"italic" }}>"{theme}"</p>
          {settings.chineseMode && (
            <p className="body-sm mt-sm text-gold">請根據此主題用英文造句</p>
          )}
        </div>

        {error && <p className="error-text mb-md">{error}</p>}

        {feedback && (
          <div className={`fb mb-md ${feedback.score>=7?"fb-good":feedback.score>=4?"fb-neutral":"fb-bad"}`}>
            <div className="flex items-center justify-between mb-xs">
              <p style={{ fontWeight:600, color:"var(--white)", fontSize:"0.88rem" }}>Last sentence</p>
              <span className={`badge ${feedback.score>=7?"badge-green":feedback.score>=4?"badge-gold":"badge-red"}`}>
                {feedback.score}/10
              </span>
            </div>
            <p className="body-sm">{feedback.feedback}</p>
          </div>
        )}

        <textarea
          ref={inputRef}
          className="input-field mb-md"
          rows={3}
          placeholder="Write your sentence here... (Enter to submit)"
          value={sentence}
          onChange={e => setSentence(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); submitSentence(); } }}
          disabled={loading}
          style={{ fontSize:"1rem" }}
        />

        <button className="btn btn-primary w-full"
          onClick={() => submitSentence()}
          disabled={loading || !sentence.trim()}>
          {loading ? <><Loading/> Scoring...</> : "Submit Sentence →"}
        </button>

        {history.length > 0 && (
          <div style={{ marginTop:20 }}>
            <p className="label mb-sm">This Round · {history.length} scored</p>
            {[...history].reverse().slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between mb-sm"
                style={{ padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <p className="body-sm" style={{
                  flex:1, marginRight:8, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--off-white)"
                }}>{h.sentence}</p>
                <span className={`badge ${h.score>=7?"badge-green":h.score>=4?"badge-gold":"badge-red"}`}>
                  {h.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
