import { EuropeMap } from "./shared.jsx";

export default function HomePage({ setPage, scores, overall }) {
  return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <span className="display" style={{ fontSize:"1.05rem", letterSpacing:"0.05em" }}>✦ IELTS Coach</span>
        <div className="flex gap-sm">
          <button className="back-btn" onClick={() => setPage("scores")}>📊 Scores</button>
          <button className="back-btn" onClick={() => setPage("settings")}>⚙ Settings</button>
        </div>
      </div>

      <div className="hero">
        <p className="hero-tag">✦ European Journey ✦</p>
        <h1 className="display display-xl">Master English<br/><em>for Europe</em></h1>
        <p className="body-md mt-sm text-grey">IELTS preparation · Travel theme · AI scoring</p>
      </div>

      <div className="px mb-md">
        <EuropeMap cityScores={scores.cityScores}/>
      </div>

      {overall && (
        <div className="px mb-md">
          <div className="card card-glow flex items-center justify-between">
            <div>
              <p className="label mb-xs">Overall Progress</p>
              <p style={{
                fontFamily:"var(--font-display)", fontSize:"2.4rem", fontWeight:300,
                background:"linear-gradient(135deg,#ff6b9d,#ffd700)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                backgroundClip:"text", lineHeight:1
              }}>{overall}</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage("scores")}>
              View All →
            </button>
          </div>
        </div>
      )}

      <div className="mode-cards">
        {[
          {
            id: "typing", icon: "🗺️", cls: "icon-pink",
            title: "Travel Typing",
            desc: "5 minute timed sentence challenge",
            badge: scores.typing.sessions > 0 ? `Best: ${scores.typing.best}pts` : null,
            badgeCls: "badge-pink",
          },
          {
            id: "essay", icon: "✍️", cls: "icon-gold",
            title: "Essay Coach",
            desc: "IELTS Task 1 & 2 with AI band scoring",
            badge: scores.essay.avgBand > 0 ? `Avg Band ${scores.essay.avgBand.toFixed(1)}` : null,
            badgeCls: "badge-gold",
          },
          {
            id: "words", icon: "📖", cls: "icon-purple",
            title: "Word Challenge",
            desc: "1000 IELTS words · use them correctly",
            badge: scores.word.attempted > 0 ? `${scores.word.correct}/${scores.word.attempted} correct` : null,
            badgeCls: "badge-purple",
          },
        ].map(m => (
          <div key={m.id} className="mode-card" onClick={() => setPage(m.id)}>
            <div className={`mode-icon ${m.cls}`}>{m.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:600, color:"var(--white)", marginBottom:3 }}>{m.title}</p>
              <p className="body-sm">{m.desc}</p>
              {m.badge && (
                <span className={`badge ${m.badgeCls}`} style={{ marginTop:7, display:"inline-flex" }}>
                  {m.badge}
                </span>
              )}
            </div>
            <span style={{ color:"var(--grey)", fontSize:"1.1rem" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
