// ============================================================
// SHARED UI COMPONENTS
// ============================================================

export function Loading() {
  return (
    <span className="dots">
      <span/><span/><span/>
    </span>
  );
}

export function CircularTimer({ seconds, total }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, seconds / total);
  const color = seconds < 30 ? "#f87171" : seconds < 60 ? "#ffd700" : "#ff6b9d";
  return (
    <div className="timer-ring">
      <svg width="82" height="82" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="41" cy="41" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
        <circle cx="41" cy="41" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}/>
      </svg>
      <span className="timer-text" style={{ color }}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

const cities = [
  { name: "Paris",     x: 155, y: 100, emoji: "🗼" },
  { name: "Rome",      x: 185, y: 145, emoji: "🏛️" },
  { name: "Barcelona", x: 130, y: 135, emoji: "🎨" },
  { name: "Amsterdam", x: 165, y: 75,  emoji: "🌷" },
  { name: "Vienna",    x: 210, y: 100, emoji: "🎻" },
  { name: "Prague",    x: 205, y: 85,  emoji: "🏰" },
  { name: "Athens",    x: 235, y: 165, emoji: "🏺" },
  { name: "Lisbon",    x: 100, y: 140, emoji: "🌊" },
];

export { cities };

export function EuropeMap({ cityScores = {} }) {
  return (
    <svg viewBox="0 0 350 220" className="map-svg">
      <defs>
        <radialGradient id="mgb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a2e"/>
          <stop offset="100%" stopColor="#0a0a0f"/>
        </radialGradient>
      </defs>
      <rect width="350" height="220" fill="url(#mgb)"/>
      {[50,100,150,200,250,300].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
      ))}
      {[50,100,150,200].map(y => (
        <line key={y} x1="0" y1={y} x2="350" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
      ))}
      <text x="175" y="18" textAnchor="middle" fill="rgba(255,107,157,0.45)"
        fontSize="7.5" fontFamily="DM Sans" fontWeight="600" letterSpacing="3">
        YOUR EUROPEAN JOURNEY
      </text>
      {cities.map(city => {
        const unlocked = (cityScores[city.name] || 0) > 0;
        return (
          <g key={city.name}>
            {unlocked && <circle cx={city.x} cy={city.y} r={14} fill="rgba(255,107,157,0.07)"/>}
            <circle cx={city.x} cy={city.y} r={unlocked ? 7 : 5}
              fill={unlocked ? "#ff6b9d" : "#2a2a3a"}
              style={unlocked ? { filter: "drop-shadow(0 0 8px #ff6b9d)" } : {}}/>
            <circle cx={city.x} cy={city.y} r={3} fill={unlocked ? "#fff" : "#444455"}/>
            <text x={city.x} y={city.y - 12} textAnchor="middle"
              fill={unlocked ? "#fff" : "#555566"} fontSize="9" fontFamily="DM Sans">
              {city.name}
            </text>
            {unlocked && (
              <text x={city.x + 10} y={city.y + 3} fill="rgba(255,215,0,0.9)" fontSize="8">
                {city.emoji}
              </text>
            )}
          </g>
        );
      })}
      <circle cx="20" cy="208" r="4" fill="#ff6b9d"/>
      <text x="28" y="211" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="DM Sans">Visited</text>
      <circle cx="68" cy="208" r="4" fill="#2a2a3a"/>
      <text x="76" y="211" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="DM Sans">Locked</text>
    </svg>
  );
}
