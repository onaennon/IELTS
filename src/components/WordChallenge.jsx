import { useState, useEffect } from "react";
import { Loading } from "./shared.jsx";
import { callAI, parseJSON } from "../api/gemini.js";
import { WORD_CHALLENGE_SYSTEM, WORD_EXAMPLE_SYSTEM, TRANSLATE_SYSTEM } from "../data/prompts.js";
import { getRandomWord, getChineseDef } from "../data/words.js";

const MAX_EXAMPLES = 3;

// ── TRANSLATION POPUP ──────────────────────────────────────
function TranslationPopup({ text, onClose, settings }) {
  const [translation, setTranslation] = useState("");
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (!settings.chineseMode || !text) return;
    setLoading(true);
    callAI(TRANSLATE_SYSTEM, text)
      .then(resp => setTranslation(resp.trim()))
      .catch(() => setTranslation("（翻譯失敗）"))
      .finally(() => setLoading(false));
  }, [text]);

  if (!settings.chineseMode) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:100,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)",
        padding:"0 16px 40px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#1a1a2e", border:"1px solid rgba(255,215,0,0.3)",
          borderRadius:16, padding:"20px", width:"100%", maxWidth:440,
          animation:"fadeUp 0.25s ease",
        }}
      >
        <p className="label mb-sm" style={{ color:"var(--gold)" }}>繁體中文翻譯</p>
        <p style={{ fontStyle:"italic", color:"var(--off-white)", fontSize:"0.95rem",
          marginBottom:12, lineHeight:1.65 }}>"{text}"</p>
        <div style={{ borderTop:"1px solid rgba(255,215,0,0.15)", paddingTop:12 }}>
          {loading
            ? <div className="flex items-center gap-sm"><Loading/><p className="body-sm">翻譯中...</p></div>
            : <p style={{ color:"var(--gold)", fontSize:"1rem", lineHeight:1.65 }}>{translation}</p>
          }
        </div>
        <p className="body-sm mt-sm text-center" style={{ color:"var(--grey2)", fontSize:"0.78rem" }}>
          點擊任意處關閉
        </p>
      </div>
    </div>
  );
}

export default function WordChallenge({ setPage, scores, saveScores, settings }) {
  const [phase, setPhase]                   = useState("intro");
  const [currentWord, setCurrentWord]       = useState(null);
  const [showChinese, setShowChinese]       = useState(false);
  const [sentence, setSentence]             = useState("");
  const [submittedSentence, setSubmitted]   = useState("");
  const [loading, setLoading]               = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [result, setResult]                 = useState(null);
  const [example, setExample]               = useState(null);
  const [examplesUsed, setExamplesUsed]     = useState(0); // 0-3
  const [sessionScore, setSessionScore]     = useState(0);
  const [count, setCount]                   = useState(0);
  const [skipped, setSkipped]               = useState(0);
  const [error, setError]                   = useState("");
  const [popup, setPopup]                   = useState(null);

  const examplesLeft = MAX_EXAMPLES - examplesUsed;
  const canRequestExample = phase === "feedback" && examplesLeft > 0 && !loadingExample;

  const nextWord = (wasSkipped = false) => {
    if (wasSkipped && currentWord) {
      saveScores({
        ...scores,
        word: {
          ...scores.word,
          skipped: (scores.word.skipped || 0) + 1,
          flagged: [...(scores.word.flagged || []),
            { word: currentWord.word, reason:"skipped" }],
        }
      });
      setSkipped(s => s + 1);
    }
    setCurrentWord(getRandomWord());
    setShowChinese(false);
    setSentence("");
    setSubmitted("");
    setResult(null);
    setExample(null);
    setExamplesUsed(0);
    setError("");
    setPhase("playing");
  };

  const submit = async () => {
    if (!sentence.trim() || loading) return;
    setLoading(true);
    setError("");
    const userSentence = sentence.trim();
    setSubmitted(userSentence);
    setSentence("");
    try {
      const resp = await callAI(
        WORD_CHALLENGE_SYSTEM,
        `Word: "${currentWord.word}"\nUser's sentence: "${userSentence}"`
      );
      const parsed = parseJSON(resp);
      if (typeof parsed.score !== "number") throw new Error("Invalid response");

      setResult(parsed);
      setSessionScore(s => s + parsed.score);
      setCount(c => c + 1);

      const needsHelp = parsed.score < 5 || !parsed.wordUsedCorrectly;
      saveScores({
        ...scores,
        word: {
          attempted:  scores.word.attempted + 1,
          correct:    scores.word.correct + (parsed.wordUsedCorrectly ? 1 : 0),
          totalScore: scores.word.totalScore + parsed.score,
          skipped:    scores.word.skipped || 0,
          flagged: needsHelp
            ? [...(scores.word.flagged || []),
               { word: currentWord.word, reason:"low_score", score: parsed.score }]
            : (scores.word.flagged || []),
        }
      });
      setPhase("feedback");
    } catch (e) {
      setError("Scoring failed — progress not saved. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestExample = async () => {
    if (!canRequestExample) return;
    setExamplesUsed(n => n + 1);
    setLoadingExample(true);
    setExample(null);

    // Flag example requested
    saveScores({
      ...scores,
      word: {
        ...scores.word,
        flagged: [...(scores.word.flagged || []),
          { word: currentWord.word, reason:"requested_example" }],
      }
    });

    try {
      const resp = await callAI(
        WORD_EXAMPLE_SYSTEM,
        `Word: "${currentWord.word}"\nUser's sentence: "${submittedSentence}"\nExaminer feedback: "${result.feedback}"\nScore: ${result.score}/10`
      );
      setExample(parseJSON(resp));
    } catch (e) {
      // Don't count failed attempt against the limit — restore one use
      setExamplesUsed(n => Math.max(0, n - 1));
      setExample({ exampleSentence:"Example unavailable — please try again.", explanation:"" });
    } finally {
      setLoadingExample(false);
    }
  };

  const isGood = result && result.score >= 7 && result.wordUsedCorrectly;
  const isMid  = result && result.score >= 4;

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
        <h2 className="display display-md">Word Challenge</h2>
        <div style={{ width:72 }}/>
      </div>
      <div className="scroll-area text-center">
        <p style={{ fontSize:"3.5rem", marginBottom:20 }}>📖</p>
        <h2 className="display display-lg mb-md">Vocabulary Master</h2>
        <p className="body-md mb-lg" style={{ maxWidth:320, margin:"0 auto 20px" }}>
          A word appears. Write one sentence using it correctly. Tap the word for its Chinese definition.
        </p>
        <div className="card mb-lg" style={{ textAlign:"left", maxWidth:340, margin:"0 auto 20px" }}>
          <p className="label mb-sm">How it works</p>
          <p className="body-sm mb-xs">⭐ Gold star = advanced word (20% chance)</p>
          <p className="body-sm mb-xs">🇹🇼 Tap word → Chinese definition</p>
          <p className="body-sm mb-xs">💡 Show Example — up to 3 times per word</p>
          <p className="body-sm mb-xs">⏭ Skip any word — no score penalty</p>
          {settings.chineseMode && <p className="body-sm mt-sm text-gold">點擊任何英文句子可查看翻譯</p>}
        </div>
        <button className="btn btn-primary" style={{ minWidth:220 }} onClick={() => nextWord(false)}>
          Start →
        </button>
      </div>
    </div>
  );

  // ── PLAYING / FEEDBACK ──
  return (
    <div className="page">
      {/* STICKY HEADER */}
      <div className="sticky-header">
        <div className="flex items-center justify-between" style={{ marginBottom:10 }}>
          <button className="back-btn" style={{ padding:"7px 12px", fontSize:"0.8rem" }}
            onClick={() => setPage("home")}>← Exit</button>
          <div className="flex gap-lg">
            <div className="text-center">
              <p className="label" style={{ fontSize:"0.64rem" }}>Score</p>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", color:"var(--gold)", lineHeight:1 }}>
                {sessionScore}
              </p>
            </div>
            <div className="text-center">
              <p className="label" style={{ fontSize:"0.64rem" }}>Done</p>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", color:"var(--pink)", lineHeight:1 }}>
                {count}
              </p>
            </div>
            {skipped > 0 && (
              <div className="text-center">
                <p className="label" style={{ fontSize:"0.64rem" }}>Skipped</p>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", color:"var(--grey)", lineHeight:1 }}>
                  {skipped}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-sm">
          <button className="btn btn-primary btn-sm" style={{ flex:1 }}
            onClick={() => phase === "playing" ? nextWord(true) : nextWord(false)}
            disabled={loading}>
            {phase === "playing" ? "Skip ⏭" : "Next Word →"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{
              flex:1,
              opacity: canRequestExample ? 1 : 0.35,
              cursor:  canRequestExample ? "pointer" : "not-allowed",
            }}
            onClick={requestExample}
            disabled={!canRequestExample}>
            {loadingExample
              ? <><Loading/> Loading</>
              : phase !== "feedback"
              ? "💡 Show Example"
              : examplesLeft === 0
              ? "✓ No attempts left"
              : `💡 Example (${examplesLeft} left)`}
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="scroll-area">
        {/* Word */}
        <div className="text-center" style={{ padding:"22px 0 14px" }}>
          <div style={{ cursor:"pointer", display:"inline-block" }}
            onClick={() => setShowChinese(s => !s)}>
            <p className="word-main">{currentWord?.word}</p>
            {currentWord?.isDifficult && (
              <div style={{ marginTop:8 }}>
                <span className="badge badge-gold">⭐ Advanced</span>
              </div>
            )}
            <p className="body-sm mt-sm" style={{ color:"var(--grey2)" }}>
              {showChinese ? "Tap to hide" : "🇹🇼 Tap for Chinese definition"}
            </p>
          </div>
        </div>

        {/* Chinese definition */}
        {showChinese && (
          <div className="chinese-box mb-md">
            <p className="label mb-xs text-gold">中文定義</p>
            <p style={{ color:"var(--gold)", fontSize:"1rem" }}>{getChineseDef(currentWord?.word)}</p>
          </div>
        )}

        {/* Input */}
        {phase === "playing" && (
          <>
            <p className="label mb-sm">Write a sentence using this word:</p>
            <textarea className="input-field mb-md" rows={4}
              placeholder={`Use "${currentWord?.word}" in a sentence...`}
              value={sentence}
              onChange={e => setSentence(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              disabled={loading}/>
            {error && <p className="error-text mb-sm">{error}</p>}
            <button className="btn btn-primary w-full" onClick={submit}
              disabled={loading || !sentence.trim()}>
              {loading ? <><Loading/> Scoring...</> : "Submit for Scoring →"}
            </button>
          </>
        )}

        {/* Feedback */}
        {phase === "feedback" && result && (
          <>
            <div className={`fb mb-md ${isGood ? "fb-good" : isMid ? "fb-neutral" : "fb-bad"}`}>
              <div className="flex items-center justify-between mb-sm">
                <p style={{ fontWeight:600, color:"var(--white)", fontSize:"0.88rem" }}>Your sentence</p>
                <span className={`badge ${result.score>=7?"badge-green":result.score>=4?"badge-gold":"badge-red"}`}>
                  {result.score}/10
                </span>
              </div>
              <p
                style={{
                  fontStyle:"italic", color:"var(--off-white)", fontSize:"0.95rem",
                  marginBottom:10, lineHeight:1.65,
                  cursor: settings.chineseMode ? "pointer" : "default",
                  textDecoration: settings.chineseMode ? "underline dotted rgba(255,215,0,0.4)" : "none",
                }}
                onClick={() => settings.chineseMode && setPopup(submittedSentence)}>
                "{submittedSentence}"
              </p>
              <span className={`badge ${result.wordUsedCorrectly ? "badge-green" : "badge-red"}`}
                style={{ display:"inline-flex", marginBottom:10 }}>
                {result.wordUsedCorrectly ? "✓ Word used correctly" : "✗ Incorrect word usage"}
              </span>
              <p className="body-sm"
                style={{ cursor: settings.chineseMode ? "pointer" : "default" }}
                onClick={() => settings.chineseMode && setPopup(result.feedback)}>
                {result.feedback}
              </p>
              {settings.chineseMode && (
                <p style={{ color:"rgba(255,215,0,0.6)", fontSize:"0.75rem", marginTop:8 }}>
                  點擊句子或反饋查看翻譯
                </p>
              )}
            </div>

            {/* Example */}
            {(loadingExample || example) && (
              <div className="fb fb-example mb-md" style={{ animation:"fadeUp 0.35s ease" }}>
                <p className="label mb-sm" style={{ color:"#c4b5fd" }}>
                  💡 Example Answer
                  {examplesUsed > 0 && (
                    <span style={{ marginLeft:8, fontSize:"0.68rem", color:"var(--grey)" }}>
                      ({examplesUsed}/{MAX_EXAMPLES} used)
                    </span>
                  )}
                </p>
                {loadingExample ? (
                  <div className="flex items-center gap-sm">
                    <Loading/><p className="body-sm">Generating example...</p>
                  </div>
                ) : (
                  <>
                    <p
                      style={{
                        fontStyle:"italic", color:"var(--white)",
                        fontSize:"1rem", marginBottom:10, lineHeight:1.7,
                        cursor: settings.chineseMode ? "pointer" : "default",
                        textDecoration: settings.chineseMode ? "underline dotted rgba(255,215,0,0.4)" : "none",
                      }}
                      onClick={() => settings.chineseMode && setPopup(example.exampleSentence)}>
                      "{example.exampleSentence}"
                    </p>
                    {example.explanation && (
                      <p className="body-sm"
                        style={{
                          borderTop:"1px solid rgba(139,92,246,0.22)", paddingTop:10,
                          cursor: settings.chineseMode ? "pointer" : "default",
                        }}
                        onClick={() => settings.chineseMode && setPopup(example.explanation)}>
                        {example.explanation}
                      </p>
                    )}
                    {settings.chineseMode && (
                      <p style={{ color:"rgba(255,215,0,0.6)", fontSize:"0.75rem", marginTop:8 }}>
                        以上為示範答案，點擊查看翻譯
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {popup && <TranslationPopup text={popup} onClose={() => setPopup(null)} settings={settings}/>}
    </div>
  );
}
