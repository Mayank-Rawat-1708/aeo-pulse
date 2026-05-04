import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";
import { CohereClient } from "cohere-ai";

dotenv.config();

// ── Keep alive on any crash ────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection:", reason?.message || reason);
});

// ── Validate env keys ──────────────────────────────────────────────────────────
["GROQ_API_KEY","MISTRAL_API_KEY","COHERE_API_KEY"].forEach(k => {
  const v = process.env[k];
  if (!v || v.includes("your_")) console.warn(`⚠️  ${k} missing or placeholder`);
  else console.log(`✅ ${k} = ${v.slice(0,10)}...`);
});

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Clients ────────────────────────────────────────────────────────────────────
const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY    || "placeholder" });
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "placeholder" });
const cohere  = new CohereClient({ token: process.env.COHERE_API_KEY || "placeholder" });

// ── Prompt ─────────────────────────────────────────────────────────────────────
function buildPrompt(query) {
  return `A shopper asks: "${query}"\n\nAnswer as a knowledgeable product recommendation assistant. Mention specific brand names where relevant. Be conversational, specific, and thorough — name at least 4-6 real brands.`;
}

// ── Brand extraction ───────────────────────────────────────────────────────────
// Known brand list — AI engines consistently mention these when recommending products.
// This approach is far more precise than regex heuristics for the leaderboard.
const KNOWN_BRANDS = new Set([
  // Audio / Headphones
  "Sony","Bose","Sennheiser","Apple","Samsung","Jabra","Plantronics","Skullcandy",
  "Beats","Bang","Olufsen","Audio-Technica","AudioTechnica","Shure","AKG","Beyerdynamic",
  "Anker","Soundcore","JBL","Harman","Philips","Panasonic","LG","Microsoft","Logitech",
  // Laptops / Computers
  "Dell","HP","Lenovo","Asus","Acer","Toshiba","Razer","MSI","Huawei","Xiaomi",
  "ThinkPad","MacBook","Surface","Chromebook",
  // Phones
  "Google","OnePlus","Motorola","Nokia","Oppo","Vivo","Realme","Nothing",
  // Supplements / Health
  "Thorne","Jarrow","NOW","Solgar","Garden","Life","Kirkland","Nature","Swanson",
  "Nordic","Naturals","Optimum","Nutrition","MegaFood","Rainbow","Light","Pure",
  "Encapsulations","Designs","Health","Ritual","Centrum","Vitacost","Bluebonnet",
  "Country","Natrol","Puritan",
  // Furniture / Desks
  "Flexispot","Uplift","Autonomous","Vari","Ikea","Fully","Ergotron","Herman","Miller",
  "Steelcase","Humanscale","Secretlab","DXRacer","Noblechairs",
  // Fitness / Wearables
  "Garmin","Fitbit","Polar","Whoop","Oura","Suunto","Coros","Wahoo",
  // Keyboards / Peripherals
  "Keychron","Ducky","Corsair","Razer","SteelSeries","HyperX","Roccat","Wooting",
  "Das","Keyboard","Varmilo","Leopold","Filco","Topre",
  // Coffee / Kitchen
  "Breville","DeLonghi","Nespresso","Keurig","Jura","Technivorm","Baratza","Fellow",
  // Cameras
  "Canon","Nikon","Fujifilm","Olympus","Panasonic","Leica","Hasselblad","GoPro","DJI",
  // TVs / Home
  "TCL","Hisense","Vizio","Roku","Amazon","Fire",
  // Cars
  "Tesla","Toyota","Honda","Ford","BMW","Mercedes","Audi","Hyundai","Kia","Rivian",
  // Generic tech brands
  "Anker","Belkin","Satechi","Elgato","CalDigit","OWC","Twelve","South","Peak","Design",
]);

// Product model names that map to their parent brand
const MODEL_TO_BRAND = {
  "QuietComfort":"Bose","QuietComfort 45":"Bose","QC45":"Bose","QC35":"Bose",
  "WH-1000XM5":"Sony","WH-1000XM4":"Sony","WF-1000XM5":"Sony","WF-1000XM4":"Sony",
  "AirPods":"Apple","AirPods Max":"Apple","AirPods Pro":"Apple",
  "Momentum":"Sennheiser","Momentum 4":"Sennheiser","PXC 550":"Sennheiser","PXC":"Sennheiser",
  "BackBeat":"Jabra","Evolve":"Jabra","Jabra Elite":"Jabra",
  "Surface":"Microsoft","Surface Pro":"Microsoft","Surface Laptop":"Microsoft",
  "ThinkPad":"Lenovo","IdeaPad":"Lenovo","Legion":"Lenovo",
  "MacBook":"Apple","MacBook Pro":"Apple","MacBook Air":"Apple","iPad":"Apple","iPhone":"Apple",
  "Pixel":"Google","Pixel Buds":"Google",
  "Galaxy":"Samsung","Galaxy Buds":"Samsung","Galaxy S":"Samsung",
  "MX Master":"Logitech","MX Keys":"Logitech",
  "XPS":"Dell","Inspiron":"Inspiron","Latitude":"Dell","Precision":"Dell",
  "Spectre":"HP","Envy":"HP","EliteBook":"HP","ProBook":"HP",
  "ZenBook":"Asus","VivoBook":"Asus","ROG":"Asus","TUF":"Asus",
  "Swift":"Acer","Aspire":"Acer","Predator":"Acer","Nitro":"Acer",
  "Blade":"Razer","Razer Blade":"Razer",
};

function extractBrands(text) {
  const brandCounts = {};

  // 1. Direct known brand matches (case-insensitive)
  for (const brand of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${brand.replace(/[-]/g,"[-]")}\\b`, "gi");
    const matches = text.match(regex) || [];
    if (matches.length > 0) {
      const key = brand;
      brandCounts[key] = (brandCounts[key] || 0) + matches.length;
    }
  }

  // 2. Model name → brand resolution
  for (const [model, brand] of Object.entries(MODEL_TO_BRAND)) {
    const regex = new RegExp(`\\b${model.replace(/[-\s]/g,"[\\s-]?")}\\b`, "gi");
    const matches = text.match(regex) || [];
    if (matches.length > 0) {
      brandCounts[brand] = (brandCounts[brand] || 0) + matches.length;
    }
  }

  return Object.entries(brandCounts)
    .map(([brand, mentions]) => ({ brand, mentions, rank: 0 }))
    .filter(b => b.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10)
    .map((b, i) => ({ ...b, rank: i + 1 }));
}

// ── Sentiment ──────────────────────────────────────────────────────────────────
function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  const pos = ["excellent","great","best","top","recommend","highly","outstanding","superior","premium","trusted","popular","effective","proven","favorite","reliable","powerful","impressive","exceptional"].filter(w => lower.includes(w)).length;
  const neg = ["avoid","poor","bad","worst","inferior","cheap","unreliable","questionable","disappointing","overpriced"].filter(w => lower.includes(w)).length;
  return pos >= 3 ? "positive" : neg >= 2 ? "negative" : "neutral";
}

// ── Visibility score ───────────────────────────────────────────────────────────
function computeVisibilityScore(brands, targetBrand) {
  if (!targetBrand || !brands.length) return null;
  const t = targetBrand.toLowerCase().trim();
  const match = brands.find((b) =>
    b.brand.toLowerCase().includes(t) || t.includes(b.brand.toLowerCase())
  );
  if (!match) return 0;
  return Math.min(100, Math.round((Math.max(0, 100 - (match.rank - 1) * 12) + Math.min(40, match.mentions * 8)) / 2));
}

// ── Recommendations ────────────────────────────────────────────────────────────
function generateRecommendations(results, targetBrand) {
  if (!targetBrand) return ["Enter your brand name above to receive a personalized AEO report."];
  const scored = results.filter((r) => r.visibilityScore !== null && r.visibilityScore !== undefined);
  const avg = scored.length ? scored.reduce((s, r) => s + r.visibilityScore, 0) / scored.length : 0;
  const recs = [];
  if (avg === 0) {
    recs.push(`🚨 Critical: "${targetBrand}" has zero presence in AI-generated recommendations. You're missing the emerging AI search channel entirely.`);
    recs.push("📝 Structure your product pages as Q&A pairs — AI engines are trained to extract and surface this format directly.");
    recs.push("🔗 Pursue mentions in authoritative review publications (Wirecutter, PCMag, etc.) — AI models heavily cite these sources.");
    recs.push("📣 Build a Reddit and community presence. AI engines frequently pull brand mentions from high-authority forums.");
  } else if (avg < 40) {
    recs.push(`⚠️ Low visibility: "${targetBrand}" scores ${Math.round(avg)}/100 on average. Competitors are capturing AI-driven discovery traffic you're missing.`);
    recs.push("📊 Implement FAQ Schema and HowTo Schema markup — this significantly improves AI engine indexing of your content.");
    recs.push("💬 Actively solicit reviews on Amazon, Trustpilot, and G2 — AI engines prioritize brands with substantial review footprints.");
  } else if (avg < 70) {
    recs.push(`✅ Moderate visibility: "${targetBrand}" scores ${Math.round(avg)}/100. You're present — now dominate.`);
    recs.push("🎯 Expand content depth around specific use-case queries ('best X for Y persona') — AI engines reward specificity.");
    recs.push("📣 Commission independent comparison articles — third-party coverage is weighted heavily in AI engine outputs.");
  } else {
    recs.push(`🏆 Strong visibility: "${targetBrand}" scores ${Math.round(avg)}/100. You're leading the AI search category.`);
    recs.push("🔄 Maintain content freshness — AI engines favor recently updated pages and newly cited brands.");
    recs.push("🌐 Localize content for new markets — each language expands your AI search footprint exponentially.");
  }
  recs.push("📱 Mirror the exact phrasing shoppers use with AI assistants in your page headings and meta descriptions.");
  return recs;
}

// ── Engine queries (each fully isolated — one can fail, others continue) ────────
async function queryGroq(prompt) {
  const start = Date.now();
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
    });
    return { engine: "Llama 3.1", provider: "Groq", response: res.choices[0].message.content, latency: Date.now() - start, status: "success" };
  } catch (e) {
    console.error("Groq error:", e.message);
    return { engine: "Llama 3.1", provider: "Groq", error: e.message, status: "error", latency: Date.now() - start };
  }
}

async function queryMistral(prompt) {
  const start = Date.now();
  try {
    const res = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 700,
    });
    const content = res.choices[0].message.content;
    const text = typeof content === "string" ? content : content.map(c => c.text || "").join("");
    return { engine: "Mistral Small", provider: "Mistral AI", response: text, latency: Date.now() - start, status: "success" };
  } catch (e) {
    console.error("Mistral error:", e.message);
    return { engine: "Mistral Small", provider: "Mistral AI", error: e.message, status: "error", latency: Date.now() - start };
  }
}

async function queryCohere(prompt) {
  const start = Date.now();
  try {
    const res = await cohere.chat({
      model: "command-r-08-2024",
      message: prompt,
      maxTokens: 700,
    });
    return { engine: "Command R", provider: "Cohere", response: res.text, latency: Date.now() - start, status: "success" };
  } catch (e) {
    console.error("Cohere error:", e.message);
    return { engine: "Command R", provider: "Cohere", error: e.message, status: "error", latency: Date.now() - start };
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.post("/analyze", async (req, res) => {
  try {
    const { query, targetBrand } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    console.log(`\n🔍 Query: "${query}" | Brand: "${targetBrand || "none"}"`);
    const prompt = buildPrompt(query);

    const [groqRes, mistralRes, cohereRes] = await Promise.all([
      queryGroq(prompt),
      queryMistral(prompt),
      queryCohere(prompt),
    ]);

    const raw = [groqRes, mistralRes, cohereRes];
    raw.forEach(r => console.log(`  ${r.status === "success" ? "✅" : "❌"} ${r.engine} — ${r.latency}ms`));

    const results = raw.map((r) => {
      if (r.status === "error") return { ...r, brands: [], sentiment: "unknown", visibilityScore: null };
      const brands = extractBrands(r.response);
      return { ...r, brands, sentiment: analyzeSentiment(r.response), visibilityScore: computeVisibilityScore(brands, targetBrand) };
    });

    const brandMap = {};
    results.forEach((r) => {
      r.brands?.forEach((b) => {
        if (!brandMap[b.brand]) brandMap[b.brand] = { brand: b.brand, totalMentions: 0, engines: [] };
        brandMap[b.brand].totalMentions += b.mentions;
        brandMap[b.brand].engines.push(r.engine);
      });
    });

    res.json({
      query, targetBrand,
      results,
      topBrands: Object.values(brandMap).sort((a, b) => b.totalMentions - a.totalMentions).slice(0, 10),
      recommendations: generateRecommendations(results, targetBrand),
    });
  } catch (e) {
    console.error("❌ /analyze route error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ AEO Pulse running on :${PORT}`);
  console.log(`   Engines: Llama 3.1 (Groq) · Mistral Small · Command R (Cohere)\n`);
});