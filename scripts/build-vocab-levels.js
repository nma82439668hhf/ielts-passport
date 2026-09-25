const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CEFR_DIR = process.env.CEFR_DIR ? path.resolve(process.env.CEFR_DIR) : path.join(ROOT, "work", "cefr-vocab");
const ECDICT = process.env.ECDICT_PATH ? path.resolve(process.env.ECDICT_PATH) : path.join(ROOT, "work", "ecdict.csv");
const SITE_DATA = process.env.SITE_DATA_DIR ? path.resolve(process.env.SITE_DATA_DIR) : path.join(ROOT, "site", "data");
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const LIMITS = { A1: 1092, A2: 1383, B1: 1800, B2: 1800, C1: 1026 };

function readWords(level) {
  return [...new Set(fs
    .readFileSync(path.join(CEFR_DIR, `${level}.txt`), "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 1 && /^[a-z][a-z'-]*$/.test(w)))];
}

function parseCsvRecords(text, onRecord) {
  let field = "";
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n") {
      record.push(field);
      onRecord(record);
      record = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || record.length) {
    record.push(field);
    onRecord(record);
  }
}

function cleanZh(value) {
  const lines = String(value || "")
    .replace(/\r/g, "")
    .replace(/\\n/g, "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("[网络]"))
    .map((s) => s.replace(/\[[^\]]+\]/g, "").replace(/^[a-z]+\.\s*/i, "").trim())
    .filter(Boolean);
  const senses = lines
    .flatMap((s) => s.split(/[；;]/))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return senses.join("；").slice(0, 80);
}

function cleanEn(value) {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function cleanPos(value) {
  const pos = String(value || "").trim();
  return pos || "";
}

function seededShuffle(arr, seedText) {
  const a = arr.slice();
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const rnd = () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(level, entries) {
  const usable = entries.filter((e) => e.zh && e.en && e.w.length <= 18);
  const source = seededShuffle(usable, `${level}-source`);
  const selected = source.slice(0, 60);
  const meaningPool = usable.map((e) => e.zh).filter(Boolean);
  const wordPool = usable.map((e) => e.w);
  const questions = [];

  selected.forEach((entry, i) => {
    const meaningDistractors = seededShuffle(
      meaningPool.filter((zh) => zh !== entry.zh),
      `${level}-zh-${entry.w}`
    ).slice(0, 3);
    const wordDistractors = seededShuffle(
      wordPool.filter((w) => w !== entry.w),
      `${level}-en-${entry.w}`
    ).slice(0, 3);

    if (i < 30) {
      const options = seededShuffle([entry.zh, ...meaningDistractors], `${level}-opt-zh-${entry.w}`);
      questions.push({
        type: "multiple-choice",
        order: questions.length + 1,
        word: entry.w,
        phonetic: entry.p,
        text: `“${entry.w}” 最接近下面哪个意思？`,
        answer: entry.zh,
        options,
        explain: `${entry.w} 的意思是“${entry.zh}”。${entry.en ? `英文释义：${entry.en}` : ""}`,
      });
    } else {
      const options = seededShuffle([entry.w, ...wordDistractors], `${level}-opt-en-${entry.w}`);
      questions.push({
        type: "multiple-choice",
        order: questions.length + 1,
        word: entry.w,
        phonetic: entry.p,
        text: `“${entry.zh}” 对应哪个英文单词？`,
        answer: entry.w,
        options,
        explain: `${entry.zh} → ${entry.w}${entry.p ? ` ${entry.p}` : ""}。${entry.en ? `英文释义：${entry.en}` : ""}`,
      });
    }
  });

  return {
    id: `vocab-${level.toLowerCase()}`,
    title: `${level} 核心词汇测验`,
    level,
    duration: level === "A1" ? "12 mins" : level === "A2" ? "15 mins" : "20 mins",
    source: "CEFR Vocabulary List (MIT) + ECDICT (MIT)",
    questions,
  };
}

function main() {
  const targets = new Set();
  const levelWords = {};
  for (const level of LEVELS) {
    const words = readWords(level).slice(0, LIMITS[level]);
    levelWords[level] = words;
    words.forEach((w) => targets.add(w));
  }

  const dict = new Map();
  const csv = fs.readFileSync(ECDICT, "utf8");
  parseCsvRecords(csv, (row) => {
    const word = String(row[0] || "").trim().toLowerCase();
    if (!targets.has(word) || dict.has(word)) return;
    dict.set(word, {
      w: word,
      p: row[1] ? `/${String(row[1]).trim()}/` : "",
      pos: cleanPos(row[4]),
      zh: cleanZh(row[3]),
      en: cleanEn(row[2]),
    });
  });

  const vocabLevels = {};
  const quizTests = [];
  for (const level of LEVELS) {
    const entries = levelWords[level]
      .map((w) => dict.get(w))
      .filter(Boolean)
      .filter((e) => e.zh || e.en);
    vocabLevels[level] = entries.map((e) => ({
      w: e.w,
      p: e.p,
      pos: e.pos,
      zh: e.zh || "",
      en: e.en || "",
    }));
    quizTests.push(buildQuiz(level, entries));
  }

  fs.writeFileSync(
    path.join(SITE_DATA, "vocab-levels.js"),
    `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.vocabLevels = ${JSON.stringify(vocabLevels)};\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(SITE_DATA, "vocab-quiz.js"),
    `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.vocabQuiz = ${JSON.stringify(quizTests)};\n`,
    "utf8"
  );

  const summary = Object.fromEntries(
    Object.entries(vocabLevels).map(([level, entries]) => [level, entries.length])
  );
  console.log(JSON.stringify({ vocab: summary, quizzes: quizTests.map((q) => [q.level, q.questions.length]) }, null, 2));
}

main();
