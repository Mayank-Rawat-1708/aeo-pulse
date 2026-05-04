import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "./components/Hero";
import QueryForm from "./components/QueryForm";
import EngineStatus from "./components/EngineStatus";
import ReportCard from "./components/ReportCard";
import "./App.css";

export default function App() {
  const [state, setState] = useState("idle");
  const [data, setData] = useState(null);
  const [loadingEngines, setLoadingEngines] = useState([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

  async function handleAnalyze({ query, targetBrand }) {
    setState("loading");
    const engines = ["Llama 3.1", "Mistral Small", "Command R"];
    setLoadingEngines(engines.map(e => ({ name: e, done: false })));
    engines.forEach((engine, i) => {
      setTimeout(() => {
        setLoadingEngines(prev => prev.map(e => e.name === engine ? { ...e, done: true } : e));
      }, 700 + i * 800);
    });
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, targetBrand }),
      });
      const json = await res.json();
      setTimeout(() => { setData(json); setState("results"); }, 3200);
    } catch {
      setState("idle");
      alert("Cannot reach backend. Is it running on port 3001?");
    }
  }

  return (
    <div className="app">
      <div className="bg-layer" />
      <div className="grid-layer" />
      <div className="noise-layer" />
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5 }}>
            <Hero />
            <QueryForm onSubmit={handleAnalyze} />
          </motion.div>
        )}
        {state === "loading" && (
          <motion.div key="loading" className="loading-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EngineStatus engines={loadingEngines} />
          </motion.div>
        )}
        {state === "results" && data && (
          <motion.div key="results"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <ReportCard data={data} onReset={() => { setState("idle"); setData(null); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
