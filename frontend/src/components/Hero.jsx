import { motion } from "framer-motion";
import "./Hero.css";

export default function Hero() {
  return (
    <div className="hero">
      <motion.div className="hero-halo"
        animate={{ scale:[1,1.08,1], opacity:[0.4,0.7,0.4] }}
        transition={{ duration:7, repeat:Infinity, ease:"easeInOut" }} />

      <motion.div className="hero-eyebrow"
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.6 }}>
        <div className="eyebrow-dot" />
        <span>Answer Engine Optimization</span>
        <div className="eyebrow-dot" />
      </motion.div>

      <motion.h1 className="hero-title"
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.2, duration:0.8, ease:[0.16,1,0.3,1] }}>
        Is your brand visible<br/>
        <em>to AI shoppers?</em>
      </motion.h1>

      <motion.p className="hero-sub"
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.38, duration:0.7 }}>
        We ask Llama, Mistral &amp; Cohere the same question your customers type into AI assistants.
        Then we tell you exactly where your brand stands.
      </motion.p>

      <motion.div className="hero-cards"
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.55, duration:0.7 }}>
        {[
          { color:"var(--groq)",    icon:"⚡", label:"Llama 3.1",    sub:"via Groq" },
          { color:"var(--mistral)", icon:"✦",  label:"Mistral Small", sub:"via Mistral AI" },
          { color:"var(--cohere)",  icon:"◈",  label:"Command R",     sub:"via Cohere" },
        ].map((e,i) => (
          <motion.div key={i} className="hero-engine-card"
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.6 + i*0.1 }}
            whileHover={{ y:-3, transition:{ duration:0.2 } }}
            style={{ "--ec": e.color }}>
            <span className="ec-icon">{e.icon}</span>
            <span className="ec-label">{e.label}</span>
            <span className="ec-sub">{e.sub}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
