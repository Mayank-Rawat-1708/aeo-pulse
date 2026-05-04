import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ReportCard.css";

const ENGINE_META = {
  "Llama 3.1":    { color:"#ff6b35", short:"LMA", bg:"rgba(255,107,53,0.1)",  icon:"⚡" },
  "Mistral Small":{ color:"#8b7cf6", short:"MST", bg:"rgba(139,124,246,0.1)", icon:"✦" },
  "Command R":    { color:"#2dd4a8", short:"CMD", bg:"rgba(45,212,168,0.1)",  icon:"◈" },
};

function gradeInfo(score) {
  if (score >= 80) return { letter:"A", color:"#2dd4a8", label:"Excellent" };
  if (score >= 60) return { letter:"B", color:"#c8a84b", label:"Good" };
  if (score >= 40) return { letter:"C", color:"#f97316", label:"Moderate" };
  return { letter:"D", color:"#ff5577", label:"Low" };
}

// ── Animated score ring ───────────────────────────────────
function ScoreRing({ score, color, size=84 }) {
  if (score === null || score === undefined) {
    return (
      <div className="ring-na" style={{ width:size, height:size }}>
        <span>N/A</span>
      </div>
    );
  }
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const g = gradeInfo(score);
  return (
    <div className="ring-wrap" style={{ width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:"absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          animate={{ strokeDashoffset: circ - (score/100)*circ }}
          transition={{ duration:1.4, delay:0.3, ease:[0.16,1,0.3,1] }}
        />
      </svg>
      <div className="ring-inner">
        <motion.span className="ring-score"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}>
          {score}
        </motion.span>
        <span className="ring-grade" style={{ color:g.color }}>{g.letter}</span>
      </div>
    </div>
  );
}

// ── Engine card ────────────────────────────────────────────
function EngineCard({ result, index }) {
  const [open, setOpen] = useState(false);
  const m = ENGINE_META[result.engine] || { color:"#fff", short:"??", bg:"rgba(255,255,255,0.05)", icon:"●" };
  const sentColor = result.sentiment==="positive" ? "var(--pos)" : result.sentiment==="negative" ? "var(--neg)" : "var(--neu)";

  return (
    <motion.div className="ec"
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:0.1+index*0.12, ease:[0.16,1,0.3,1] }}>

      <div className="ec-top">
        <div className="ec-id">
          <div className="ec-avatar" style={{ background:m.bg, color:m.color, borderColor:`${m.color}40` }}>
            {m.icon}
          </div>
          <div>
            <div className="ec-name">{result.engine}</div>
            <div className="ec-provider">{result.provider}</div>
          </div>
        </div>
        <ScoreRing score={result.visibilityScore} color={m.color} size={80} />
      </div>

      <div className="ec-stats">
        <div className="ec-stat">
          <span className="ec-stat-label">Sentiment</span>
          <span className="ec-stat-val" style={{ color:sentColor }}>
            {result.sentiment === "positive" ? "😊 Positive" : result.sentiment === "negative" ? "😟 Negative" : "😐 Neutral"}
          </span>
        </div>
        <div className="ec-stat">
          <span className="ec-stat-label">Brands found</span>
          <span className="ec-stat-val">{result.brands?.length || 0}</span>
        </div>
        <div className="ec-stat">
          <span className="ec-stat-label">Response time</span>
          <span className="ec-stat-val mono">{(result.latency/1000).toFixed(1)}s</span>
        </div>
      </div>

      {result.brands?.length > 0 && (
        <div className="ec-brands">
          {result.brands.slice(0,6).map((b,i) => (
            <span key={b.brand} className="ec-brand"
              style={{ opacity: Math.max(0.38, 1-i*0.14) }}>
              <span className="ec-brand-rank">#{b.rank}</span>
              {b.brand}
              <span className="ec-brand-cnt">{b.mentions} mention{b.mentions!==1?"s":""}</span>
            </span>
          ))}
        </div>
      )}

      {result.status === "error" && (
        <div className="ec-error">⚠ {result.error?.slice(0,140)}</div>
      )}

      {result.response && (
        <>
          <button className="ec-toggle" onClick={() => setOpen(!open)}>
            {open ? "▲ Hide response" : "▼ Read full AI response"}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div className="ec-response"
                initial={{ height:0, opacity:0 }}
                animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }}
                transition={{ duration:0.35 }}>
                <div className="ec-response-inner">{result.response}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ── Brand detail modal ─────────────────────────────────────
function BrandDetail({ brand, results, onClose }) {
  const engines = results.filter(r => r.brands?.some(b => b.brand === brand.brand));
  const topRank  = Math.min(...engines.map(r => r.brands.find(b=>b.brand===brand.brand)?.rank || 99));

  // Find context sentences mentioning this brand from each engine's response
  function getContext(engineResult) {
    if (!engineResult?.response) return null;
    const sentences = engineResult.response.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevant  = sentences.filter(s => s.toLowerCase().includes(brand.brand.toLowerCase()));
    return relevant[0]?.trim() || null;
  }

  return (
    <motion.div className="bd-overlay"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}>
      <motion.div className="bd-panel"
        initial={{ opacity:0, y:30, scale:0.96 }}
        animate={{ opacity:1, y:0, scale:1 }}
        exit={{ opacity:0, y:20, scale:0.97 }}
        transition={{ ease:[0.16,1,0.3,1] }}
        onClick={e => e.stopPropagation()}>

        <div className="bd-header">
          <div>
            <div className="bd-eyebrow mono">Brand Analysis</div>
            <div className="bd-title">{brand.brand}</div>
          </div>
          <button className="bd-close" onClick={onClose}>✕</button>
        </div>

        <div className="bd-metrics">
          <div className="bd-metric">
            <span className="bd-metric-val">{brand.totalMentions}</span>
            <span className="bd-metric-label">Total mentions<br/>across all engines</span>
          </div>
          <div className="bd-metric">
            <span className="bd-metric-val">{engines.length}/3</span>
            <span className="bd-metric-label">AI engines that<br/>mentioned this brand</span>
          </div>
          <div className="bd-metric">
            <span className="bd-metric-val">#{topRank}</span>
            <span className="bd-metric-label">Highest rank<br/>in any engine</span>
          </div>
        </div>

        <div className="bd-section-title mono">What each engine says</div>
        <div className="bd-engines">
          {results.map(r => {
            const brandData = r.brands?.find(b => b.brand === brand.brand);
            const context   = getContext(r);
            const m = ENGINE_META[r.engine] || { color:"#fff", short:"??", icon:"●" };
            if (!brandData && !context) return null;
            return (
              <div key={r.engine} className="bd-engine-row">
                <div className="bd-engine-head">
                  <span className="bd-engine-icon" style={{ color:m.color }}>{m.icon}</span>
                  <span className="bd-engine-name">{r.engine}</span>
                  {brandData ? (
                    <span className="bd-engine-stat" style={{ color:m.color }}>
                      Rank #{brandData.rank} · {brandData.mentions} mention{brandData.mentions!==1?"s":""}
                    </span>
                  ) : (
                    <span className="bd-engine-stat" style={{ color:"var(--text3)" }}>Not mentioned</span>
                  )}
                </div>
                {context && (
                  <div className="bd-context">
                    <span className="bd-context-quote">"</span>
                    {context.replace(/\*+/g, "").trim()}
                    <span className="bd-context-quote">"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bd-why">
          <div className="bd-section-title mono">Why this ranking?</div>
          <p className="bd-why-text">
            {brand.totalMentions >= 10
              ? `${brand.brand} is a dominant presence — mentioned ${brand.totalMentions} times across ${engines.length} engines. AI models are highly likely to recommend it unprompted.`
              : brand.totalMentions >= 5
              ? `${brand.brand} has a solid presence with ${brand.totalMentions} total mentions. It appears in ${engines.length} of 3 AI engines, indicating consistent brand awareness in training data.`
              : `${brand.brand} has limited mentions (${brand.totalMentions} total). AI engines know it but don't prominently feature it. Consider building more authoritative content and third-party citations.`}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ReportCard ────────────────────────────────────────
export default function ReportCard({ data, onReset }) {
  const { query, targetBrand, results, topBrands, recommendations } = data;
  const [selectedBrand, setSelectedBrand] = useState(null);

  const scored  = results.filter(r => r.visibilityScore !== null && r.visibilityScore !== undefined);
  const avgScore = scored.length ? Math.round(scored.reduce((s,r) => s+r.visibilityScore, 0) / scored.length) : null;
  const g = avgScore !== null ? gradeInfo(avgScore) : null;

  return (
    <div className="rc">
      {/* Nav */}
      <div className="rc-nav">
        <motion.button className="rc-back" onClick={onReset}
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          whileHover={{ x:-3 }}>
          ← New analysis
        </motion.button>
        <motion.div className="rc-crumb" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}>
          <span className="rc-crumb-label">Query</span>
          <span className="rc-crumb-val">"{query}"</span>
        </motion.div>
      </div>

      {/* Score banner */}
      {targetBrand && avgScore !== null && (
        <motion.div className="rc-banner"
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12, ease:[0.16,1,0.3,1] }}>
          <div className="banner-left">
            <div className="banner-eyebrow mono">AEO Visibility Report</div>
            <div className="banner-brand">{targetBrand}</div>
            <div className="banner-sub">{g.label} visibility · averaged across {scored.length} AI {scored.length===1?"engine":"engines"}</div>
          </div>
          <div className="banner-right">
            <div className="banner-grade" style={{ color:g.color, borderColor:`${g.color}35` }}>{g.letter}</div>
            <div className="banner-score" style={{ color:g.color }}>
              {avgScore}<span className="banner-of">/100</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rc-body">

        {/* Engine cards */}
        <section className="rc-section">
          <div className="rc-section-head">
            <div className="rc-rule" />
            <h2 className="rc-section-title">Engine Breakdown</h2>
            <div className="rc-rule" />
          </div>
          <div className="engine-grid">
            {results.map((r,i) => <EngineCard key={r.engine} result={r} index={i} />)}
          </div>
        </section>

        {/* Leaderboard */}
        {topBrands?.length > 0 && (
          <motion.section className="rc-section"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
            <div className="rc-section-head">
              <div className="rc-rule" />
              <h2 className="rc-section-title">Brand Leaderboard</h2>
              <div className="rc-rule" />
            </div>
            <p className="rc-section-sub">Click any brand to see a detailed breakdown of its AI presence</p>
            <div className="leaderboard">
              {topBrands.map((b, i) => {
                const pct = Math.round((b.totalMentions / topBrands[0].totalMentions) * 100);
                const rankColor = i===0 ? "#c8a84b" : i===1 ? "#9090b0" : i===2 ? "#a06830" : "var(--text3)";
                const medal = i===0 ? "🥇" : i===1 ? "🥈" : i===2 ? "🥉" : null;
                return (
                  <motion.button key={b.brand} className="lb-row"
                    initial={{ opacity:0, x:-16 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: 0.45 + i*0.055, ease:[0.16,1,0.3,1] }}
                    whileHover={{ backgroundColor:"rgba(255,255,255,0.04)", x:3 }}
                    onClick={() => setSelectedBrand(b)}>

                    <span className="lb-rank" style={{ color:rankColor }}>
                      {medal || String(i+1).padStart(2,"0")}
                    </span>
                    <span className="lb-name">{b.brand}</span>
                    <div className="lb-bar-wrap">
                      <motion.div className="lb-bar"
                        style={{ background: i===0 ? "var(--gold)" : "rgba(255,255,255,0.14)" }}
                        initial={{ width:0 }}
                        animate={{ width:`${pct}%` }}
                        transition={{ delay:0.5+i*0.055, duration:0.9, ease:[0.16,1,0.3,1] }}
                      />
                    </div>
                    <span className="lb-count">
                      {b.totalMentions} <span className="lb-count-label">mention{b.totalMentions!==1?"s":""}</span>
                    </span>
                    <div className="lb-engines">
                      {[...new Set(b.engines)].map(e => {
                        const em = ENGINE_META[e];
                        return em ? (
                          <span key={e} className="lb-etag"
                            style={{ color:em.color, background:em.bg, borderColor:`${em.color}30` }}>
                            {em.short}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <span className="lb-arrow">→</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Recommendations */}
        <motion.section className="rc-section"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <div className="rc-section-head">
            <div className="rc-rule" />
            <h2 className="rc-section-title">Strategic Recommendations</h2>
            <div className="rc-rule" />
          </div>
          <div className="recs">
            {recommendations.map((rec, i) => (
              <motion.div key={i} className="rec"
                initial={{ opacity:0, x:-14 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.65+i*0.09, ease:[0.16,1,0.3,1] }}>
                <div className="rec-bar" style={{ background:`hsl(${36+i*28},70%,55%)` }} />
                <p className="rec-text">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="rc-footer mono">
        AEO Pulse · Llama 3.1 (Groq) · Mistral Small (Mistral AI) · Command R (Cohere) · Free tier
      </div>

      {/* Brand detail modal */}
      <AnimatePresence>
        {selectedBrand && (
          <BrandDetail
            brand={selectedBrand}
            results={results}
            onClose={() => setSelectedBrand(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
