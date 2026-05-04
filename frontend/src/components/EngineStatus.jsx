import { motion, AnimatePresence } from "framer-motion";
import "./EngineStatus.css";

const META = {
  "Llama 3.1":    { color:"#ff6b35", icon:"⚡", label:"Groq LPU" },
  "Mistral Small":{ color:"#8b7cf6", icon:"✦",  label:"Mistral AI" },
  "Command R":    { color:"#2dd4a8", icon:"◈",  label:"Cohere" },
};

export default function EngineStatus({ engines }) {
  const done = engines.filter(e => e.done).length;

  return (
    <div className="es">
      <motion.div className="es-bg"
        animate={{ scale:[1,1.1,1], opacity:[0.12,0.22,0.12] }}
        transition={{ duration:4, repeat:Infinity }} />

      <motion.div className="es-label"
        initial={{ opacity:0 }} animate={{ opacity:1 }}>
        Querying AI engines
      </motion.div>

      <div className="es-track">
        <motion.div className="es-fill"
          animate={{ width: `${(done/engines.length)*100}%` }}
          transition={{ duration:0.6, ease:"easeOut" }} />
      </div>

      <div className="es-rows">
        {engines.map((e, i) => {
          const m = META[e.name] || { color:"#fff", icon:"●", label:e.name };
          return (
            <motion.div key={e.name} className="es-row"
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i*0.15, ease:[0.16,1,0.3,1] }}>
              <div className="es-row-icon" style={{ background:`${m.color}18`, color:m.color }}>{m.icon}</div>
              <div className="es-row-body">
                <span className="es-row-name">{e.name}</span>
                <AnimatePresence mode="wait">
                  {e.done ? (
                    <motion.span key="done" className="es-row-status"
                      initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                      style={{ color:m.color }}>
                      ✓ Response received
                    </motion.span>
                  ) : (
                    <motion.span key="wait" className="es-row-status" style={{ color:"var(--text3)" }}>
                      Querying {m.label}…
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="es-row-right">
                {e.done ? (
                  <motion.div className="es-checkmark" style={{ color:m.color }}
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:"spring", stiffness:400, damping:15 }}>✓</motion.div>
                ) : (
                  <div className="es-spinner" style={{ borderTopColor:m.color }} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p className="es-sub"
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }}>
        Extracting brand signals · Computing visibility scores
      </motion.p>
    </div>
  );
}
