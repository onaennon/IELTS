import { useState } from "react";
import { Loading } from "./shared.jsx";
import { callAI, parseJSON } from "../api/gemini.js";
import { ESSAY_SYSTEM } from "../data/prompts.js";

function formatBand(n) { return Number(n).toFixed(1); }

export default function EssayCoach({ setPage, scores, saveScores, settings }) {
  const [phase, setPhase]       = useState("select");
  const [taskType, setTaskType] = useState("");
  const [essay, setEssay]       = useState("");
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const minWords  = taskType === "Task 1" ? 150 : 250;

  const submit = async () => {
    setError("");
    setPhase("loading");
    try {
      const resp = await callAI(
        ESSAY_SYSTEM,
        `Task Type: IELTS Writing ${taskType}\n\nEssay:\n${essay}`
      );
      const parsed = parseJSON(resp);
      setResult(parsed);

      const newSession = {
        type: taskType,
        date: new Date().toLocaleDateString(),
        overall:   parsed.overallBand,
        task:      parsed.taskAchievement,
        coherence: parsed.coherenceCohesion,
        lexical:   parsed.lexicalResource,
        grammar:   parsed.grammaticalRange,
      };
      const allSessions = [...scores.essay.sessions, newSession];
      const avgBand = allSessions.reduce((a,b) => a + b.overall, 0) / allSessions.length;
      saveScores({ ...scores, essay: { sessions: allSessions, avgBand } });
      setPhase("results");
    } catch (e) {
      setError(`Could not evaluate essay: ${e.message}`);
      setPhase("write");
    }
  };

  // ── SELECT ──
  if (phase === "select") return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
        <h2 className="display display-md">Essay Coach</h2>
        <div style={{ width:72 }}/>
      </div>
      <div className="scroll-area">
        <p className="text-center" style={{ fontSize:"3rem", marginBottom:16 }}>✍️</p>
        <h3 className="display display-md text-center mb-sm">Select Task Type</h3>
        <p className="body-sm text-center mb-lg">The IELTS exam has two writing tasks. Select which you are practising today.</p>

        {[
          {
            t:"Task 1", title:"Task 1 — Describe Data",
            desc:"Describe a graph, chart, diagram or map. Minimum 150 words.",
            zh:"描述圖表或數據，至少150字",
          },
          {
            t:"Task 2", title:"Task 2 — Academic Essay",
            desc:"Argument, discussion or problem-solution essay. Minimum 250 words.",
            zh:"學術論文，包含引言、主體和結論，至少250字",
          },
        ].map(item => (
          <div key={item.t} className="card mb-md"
            onClick={() => setTaskType(item.t)}
            style={{
              cursor:"pointer",
              borderColor: taskType===item.t ? "var(--pink)" : "var(--card-border)",
              background: taskType===item.t ? "rgba(255,107,157,0.06)" : "var(--card)"
            }}>
            <div className="flex items-center justify-between mb-xs">
              <p style={{ fontWeight:600, color:"var(--white)" }}>{item.title}</p>
              {taskType===item.t && <span className="badge badge-pink">Selected</span>}
            </div>
            <p className="body-sm">{item.desc}</p>
            {settings.chineseMode && <p className="body-sm mt-sm text-gold">{item.zh}</p>}
          </div>
        ))}

        <div className="card mb-lg" style={{ background:"rgba(255,215,0,0.04)", borderColor:"rgba(255,215,0,0.22)" }}>
          <p className="label mb-sm text-gold">4 Official IELTS Scoring Criteria</p>
          {["Task Achievement","Coherence & Cohesion","Lexical Resource","Grammatical Range & Accuracy"].map(c => (
            <p key={c} className="body-sm mb-xs">• {c}</p>
          ))}
        </div>

        <button className="btn btn-primary w-full" disabled={!taskType} onClick={() => setPhase("write")}>
          Continue →
        </button>
      </div>
    </div>
  );

  // ── WRITE ──
  if (phase === "write") return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => setPhase("select")}>← Back</button>
        <h2 className="display display-md">{taskType}</h2>
        <span className={`badge ${wordCount >= minWords ? "badge-green" : "badge-gold"}`}>
          {wordCount} words
        </span>
      </div>
      <div className="scroll-area">
        <div className="card mb-md" style={{ background:"rgba(255,215,0,0.04)", borderColor:"rgba(255,215,0,0.22)" }}>
          <p className="label mb-xs text-gold">Requirements</p>
          <p className="body-sm">
            {taskType==="Task 1"
              ? "Describe the data or diagram. Summarise main trends. Do NOT give personal opinions. Minimum 150 words."
              : "Write a full essay. Introduction, body paragraphs, conclusion. Minimum 250 words."}
          </p>
          {settings.chineseMode && (
            <p className="body-sm mt-sm text-gold">
              {taskType==="Task 1"
                ? "描述數據趨勢，不要加入個人意見，至少150字"
                : "寫完整論文，包含引言、主體和結論，至少250字"}
            </p>
          )}
        </div>

        {error && <p className="error-text mb-md">{error}</p>}

        <textarea className="input-field mb-md" rows={14}
          placeholder={taskType==="Task 1"
            ? "The chart illustrates..."
            : "In recent years, there has been growing debate about..."}
          value={essay}
          onChange={e => setEssay(e.target.value)}
          style={{ fontSize:"1rem" }}/>

        <button className="btn btn-primary w-full" onClick={submit} disabled={wordCount < 30}>
          Submit for Scoring →
        </button>
      </div>
    </div>
  );

  // ── LOADING ──
  if (phase === "loading") return (
    <div className="page" style={{ alignItems:"center", justifyContent:"center", gap:16 }}>
      <p style={{ fontSize:"3rem" }}>📝</p>
      <p className="display display-md">Analysing Essay...</p>
      <Loading/>
      <p className="body-sm text-grey">Strict IELTS examiner at work</p>
    </div>
  );

  // ── RESULTS ──
  if (phase === "results" && result) return (
    <div className="page">
      <div className="sticky-header flex items-center justify-between">
        <button className="back-btn" onClick={() => { setPhase("write"); setResult(null); }}>← Revise</button>
        <h2 className="display display-md">Results</h2>
        <button className="back-btn" onClick={() => setPage("home")}>Home</button>
      </div>
      <div className="scroll-area">
        {/* Overall band */}
        <div className="card card-glow text-center mb-md" style={{ padding:"26px 20px" }}>
          <p className="label mb-sm">Overall Band Score</p>
          <div style={{
            fontFamily:"var(--font-display)", fontSize:"5rem", fontWeight:300, lineHeight:1,
            background:"linear-gradient(135deg,#ff6b9d,#ffd700)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"
          }}>{formatBand(result.overallBand)}</div>
          <p className="body-sm mt-sm">{result.overallFeedback}</p>
        </div>

        {/* 4 criteria grid */}
        <div className="band-grid mb-md">
          {[
            { label:"Task Achievement",      key:"taskAchievement", fb:"taskAchievementFeedback", zh:"任務完成度" },
            { label:"Coherence & Cohesion",  key:"coherenceCohesion",  fb:"coherenceFeedback",       zh:"連貫性" },
            { label:"Lexical Resource",      key:"lexicalResource",    fb:"lexicalFeedback",          zh:"詞彙資源" },
            { label:"Grammar & Accuracy",    key:"grammaticalRange",   fb:"grammaticalFeedback",      zh:"語法準確性" },
          ].map(item => (
            <div key={item.key} className="band-item">
              <p className="label mb-xs" style={{ fontSize:"0.67rem" }}>{item.label}</p>
              {settings.chineseMode && (
                <p style={{ fontSize:"0.68rem", color:"var(--gold)", marginBottom:5 }}>{item.zh}</p>
              )}
              <p className="band-num">{formatBand(result[item.key])}</p>
              <p className="body-sm mt-sm" style={{ fontSize:"0.81rem" }}>{result[item.fb]}</p>
            </div>
          ))}
        </div>

        {/* Errors */}
        {result.errors?.length > 0 && (
          <div className="card mb-md" style={{ borderColor:"rgba(248,113,113,0.35)" }}>
            <p className="label mb-sm" style={{ color:"#fca5a5" }}>Specific Errors Found</p>
            {result.errors.map((e, i) => (
              <p key={i} className="body-sm mb-sm"
                style={{ paddingLeft:12, borderLeft:"2px solid #f87171" }}>• {e}</p>
            ))}
          </div>
        )}

        <button className="btn btn-primary w-full"
          onClick={() => { setPhase("write"); setResult(null); }}>
          Revise & Resubmit
        </button>
      </div>
    </div>
  );

  return null;
}
