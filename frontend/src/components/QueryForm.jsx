import { useState } from "react";
import { motion } from "framer-motion";
import "./QueryForm.css";

const EXAMPLES = [
  "best magnesium supplement for seniors",
  "best noise cancelling headphones under $300",
  "best laptop for developers",
  "best standing desk under $500",
];

export default function QueryForm({ onSubmit }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [focused, setFocused] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit({ query: query.trim(), targetBrand: brand.trim() });
  }

  return (
    <motion.div className="qf-outer"
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.72, duration:0.7 }}>
      <form className="qf-card" onSubmit={handleSubmit}>

        <div className="qf-top">
          <p className="qf-headline">What are shoppers asking AI right now?</p>
          <p className="qf-hint">Enter any product query to see how AI engines respond — and where your brand lands.</p>
        </div>

        <div className="qf-fields">
          {/* Query field */}
          <div className={`qf-field ${focused === 'query' ? 'focused' : ''}`}>
            <label className="qf-label">
              <span className="qf-label-num">01</span>
              Shopper query
            </label>
            <div className="qf-input-wrap">
              <svg className="qf-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="qf-input" type="text"
                placeholder="e.g. best noise cancelling headphones under $300"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused('query')}
                onBlur={() => setFocused(null)}
                required />
            </div>
          </div>

          <div className="qf-connector">
            <div className="qf-connector-line" />
            <span className="qf-connector-plus">+</span>
            <div className="qf-connector-line" />
          </div>

          {/* Brand field */}
          <div className={`qf-field ${focused === 'brand' ? 'focused' : ''}`}>
            <label className="qf-label">
              <span className="qf-label-num">02</span>
              Your brand <span className="qf-optional">optional — unlocks your visibility score</span>
            </label>
            <div className="qf-input-wrap">
              <svg className="qf-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <input className="qf-input" type="text"
                placeholder="e.g. Sony, Bose, Nature Made…"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                onFocus={() => setFocused('brand')}
                onBlur={() => setFocused(null)} />
            </div>
          </div>
        </div>

        <motion.button type="submit" className="qf-btn"
          whileHover={{ scale:1.018 }} whileTap={{ scale:0.982 }}>
          <span>Analyze AI Visibility</span>
          <div className="qf-btn-arrow">→</div>
        </motion.button>

        <div className="qf-examples">
          <span className="qf-ex-label">Try an example:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} type="button" className="qf-chip"
              onClick={() => setQuery(ex)}>{ex}</button>
          ))}
        </div>
      </form>
    </motion.div>
  );
}
