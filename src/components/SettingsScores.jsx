import { cities } from "./shared.jsx";

// ── SETTINGS ──────────────────────────────────────────────────
export function SettingsPage({ setPage, settings, saveSetting }) {
  return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
        <h2 className="display display-md">Settings</h2>
        <div style={{ width:72 }}/>
      </div>
      <div className="scroll-area">
        <p className="label mb-sm">Language</p>
        <div className="card mb-md flex items-center justify-between">
          <div>
            <p style={{ fontWeight:600, color:"var(--white)", marginBottom:4 }}>
              Traditional Chinese · 繁體中文
            </p>
            <p className="body-sm">Show Chinese descriptions and translation popups</p>
          </div>
          <div
            className={`toggle ${settings.chineseMode ? "on" : ""}`}
            onClick={() => saveSetting("chineseMode", !settings.chineseMode)}
          >
            <div className="toggle-thumb"/>
          </div>
        </div>

        <div className="divider"/>
        <p className="label mb-sm">About</p>

        <div className="card mb-md">
          <p style={{ fontWeight:600, color:"var(--white)", marginBottom:4 }}>IELTS English Coach</p>
          <p className="body-sm">Powered by Gemini AI · 1000 IELTS vocabulary words</p>
          <p className="body-sm mt-sm">Optimised for IELTS academic preparation</p>
        </div>

        <div className="card" style={{ background:"rgba(255,215,0,0.04)", borderColor:"rgba(255,215,0,0.22)" }}>
          <p className="label mb-sm text-gold">Target Band Score</p>
          <p style={{ fontWeight:600, color:"var(--white)", fontSize:"1.1rem", marginBottom:4 }}>Band 6.5 – 7.5</p>
          <p className="body-sm">Most European universities require a minimum of Band 6.5</p>
        </div>
      </div>
    </div>
  );
}

// ── SCORES ────────────────────────────────────────────────────
export function ScoresPage({ setPage, scores, overall }) {
  const wordAcc = scores.word.attempted > 0
    ? Math.round((scores.word.correct / scores.word.attempted) * 100) : 0;

  return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
        <h2 className="display display-md">Your Scores</h2>
        <div style={{ width:72 }}/>
      </div>
      <div className="scroll-area">

        {/* Overall */}
        <div className="text-center mb-lg">
          <p className="label mb-sm">Overall Average</p>
          <div style={{
            fontFamily:"var(--font-display)", fontSize:"5.5rem", fontWeight:300, lineHeight:1,
            background:"linear-gradient(135deg,#ff6b9d,#ffd700)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"
          }}>{overall || "—"}</div>
          <p className="body-sm mt-sm">Across all completed sessions</p>
        </div>

        {/* Typing */}
        <div className="card card-glow mb-md">
          <div className="flex items-center justify-between mb-md">
            <p style={{ fontWeight:600, color:"var(--white)" }}>🗺️ Travel Typing</p>
            <span className="badge badge-pink">{scores.typing.sessions} sessions</span>
          </div>
          <div className="flex justify-between mb-xs">
            <p className="body-sm">Best Score</p>
            <p className="body-sm text-pink">{scores.typing.best} pts</p>
          </div>
          <div className="bar-track mb-md">
            <div className="bar-fill" style={{ width:`${Math.min(scores.typing.best / 2, 100)}%` }}/>
          </div>
          <div className="flex justify-between">
            <p className="body-sm">Last Score</p>
            <p className="body-sm text-white">{scores.typing.last} pts</p>
          </div>
        </div>

        {/* Word */}
        <div className="card card-glow mb-md">
          <div className="flex items-center justify-between mb-md">
            <p style={{ fontWeight:600, color:"var(--white)" }}>📖 Word Challenge</p>
            <span className="badge badge-purple">{wordAcc}% accuracy</span>
          </div>
          <div className="flex justify-between mb-xs">
            <p className="body-sm">Words Attempted</p>
            <p className="body-sm text-white">{scores.word.attempted}</p>
          </div>
          <div className="flex justify-between mb-xs">
            <p className="body-sm">Words Correct</p>
            <p className="body-sm text-pink">{scores.word.correct}</p>
          </div>
          <div className="flex justify-between mb-md">
            <p className="body-sm">Words Skipped</p>
            <p className="body-sm text-grey">{scores.word.skipped || 0}</p>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width:`${wordAcc}%` }}/>
          </div>
        </div>

        {/* Cities */}
        <div className="card card-glow">
          <p style={{ fontWeight:600, color:"var(--white)", marginBottom:12 }}>🗺️ Cities Unlocked</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {cities.map(c => {
              const visited = (scores.cityScores?.[c.name] || 0) > 0;
              return (
                <span key={c.name} className={`badge ${visited ? "badge-pink" : ""}`}
                  style={!visited ? {
                    background:"rgba(255,255,255,0.04)",
                    color:"var(--grey2)",
                    border:"1px solid rgba(255,255,255,0.08)"
                  } : {}}>
                  {c.emoji} {c.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
