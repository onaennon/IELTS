import { useState, useEffect, useCallback } from "react";
import "../styles/app.css";

import HomePage from "./HomePage.jsx";
import { SettingsPage, ScoresPage } from "./SettingsScores.jsx";
import TypingGame from "./TypingGame.jsx";
import EssayCoach from "./EssayCoach.jsx";
import WordChallenge from "./WordChallenge.jsx";

const DEFAULT_SCORES = {
  typing:     { best: 0, last: 0, sessions: 0 },
  essay:      { sessions: [], avgBand: 0 },
  word:       { attempted: 0, correct: 0, totalScore: 0, skipped: 0, flagged: [] },
  cityScores: {},
};

const DEFAULT_SETTINGS = {
  chineseMode: false,
};

export default function App() {
  const [page, setPage]         = useState("home");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [scores, setScores]     = useState(DEFAULT_SCORES);

  useEffect(() => {
    try {
      const s = localStorage.getItem("ielts-scores");
      if (s) setScores(prev => ({ ...DEFAULT_SCORES, ...JSON.parse(s) }));
    } catch {}
    try {
      const c = localStorage.getItem("ielts-settings");
      if (c) setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(c) }));
    } catch {}
  }, []);

  const saveScores = useCallback((next) => {
    setScores(next);
    try { localStorage.setItem("ielts-scores", JSON.stringify(next)); } catch {}
  }, []);

  const saveSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    try { localStorage.setItem("ielts-settings", JSON.stringify(next)); } catch {}
  };

  const overall = (() => {
    const parts = [];
    if (scores.typing.sessions > 0)
      parts.push(Math.min(scores.typing.best / 10, 10));
    if (scores.essay.avgBand > 0)
      parts.push(scores.essay.avgBand);
    if (scores.word.attempted > 0)
      parts.push(scores.word.totalScore / scores.word.attempted);
    if (!parts.length) return null;
    return (parts.reduce((a, b) => a + b, 0) / parts.length).toFixed(1);
  })();

  const sharedProps = { setPage, scores, saveScores, settings };

  return (
    <>
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb orb1"/>
        <div className="orb orb2"/>
        <div className="orb orb3"/>
      </div>

      <div className="app">
        {page === "home"     && <HomePage     setPage={setPage} scores={scores} overall={overall}/>}
        {page === "settings" && <SettingsPage setPage={setPage} settings={settings} saveSetting={saveSetting}/>}
        {page === "scores"   && <ScoresPage   setPage={setPage} scores={scores} overall={overall}/>}
        {page === "typing"   && <TypingGame   {...sharedProps}/>}
        {page === "essay"    && <EssayCoach   {...sharedProps}/>}
        {page === "words"    && <WordChallenge {...sharedProps}/>}
      </div>
    </>
  );
}
