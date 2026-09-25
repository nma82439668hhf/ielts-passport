const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ECDICT = process.env.ECDICT_PATH ? path.resolve(process.env.ECDICT_PATH) : path.join(ROOT, "work", "ecdict.csv");
const CEFR_DIR = process.env.CEFR_DIR ? path.resolve(process.env.CEFR_DIR) : path.join(ROOT, "work", "cefr-vocab");
const SITE_DATA = process.env.SITE_DATA_DIR ? path.resolve(process.env.SITE_DATA_DIR) : path.join(ROOT, "site", "data");
const OUT_DIR = path.join(SITE_DATA, "dict");
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function readCefrSet() {
  const set = new Set();
  for (const level of LEVELS) {
    const file = path.join(CEFR_DIR, `${level}.txt`);
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
      .forEach((w) => set.add(w));
  }
  return set;
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
  const senses = String(value || "")
    .replace(/\\n/g, "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("[网络]"))
    .flatMap((s) => s.split(/[；;]/))
    .map((s) => s.replace(/\[[^\]]+\]/g, "").replace(/^[a-z]+\.\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return senses.join("；").slice(0, 100);
}

function cleanEn(value) {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]+\]/g, "")
    .trim()
    .slice(0, 160);
}

function main() {
  const cefr = readCefrSet();
  const dictionary = {};
  const csv = fs.readFileSync(ECDICT, "utf8");
  parseCsvRecords(csv, (row) => {
    const word = String(row[0] || "").trim().toLowerCase();
    if (!word || word.length > 24 || !/^[a-z][a-z'-]*$/.test(word)) return;
    if (dictionary[word]) return;
    const phonetic = row[1] ? `/${String(row[1]).trim()}/` : "";
    const definition = cleanEn(row[2]);
    const translation = cleanZh(row[3]);
    if (!translation) return;
    const pos = String(row[4] || "").trim();
    const collins = Number(row[5] || 0);
    const oxford = Number(row[6] || 0);
    const tag = String(row[7] || "").toLowerCase();
    const bnc = Number(row[8] || 0);
    const frq = Number(row[9] || 0);
    const usefulTag = /(zk|gk|cet4|cet6|ky|ielts|toefl)/.test(tag);
    const commonRank = (bnc > 0 && bnc <= 30000) || (frq > 0 && frq <= 30000);
    if (!cefr.has(word) && !usefulTag && collins < 2 && oxford < 1 && !commonRank) return;
    dictionary[word] = [phonetic, translation, definition, pos];
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const shards = {};
  for (const [word, entry] of Object.entries(dictionary)) {
    const first = word[0];
    const key = /^[a-z]$/.test(first) ? first : "other";
    if (!shards[key]) shards[key] = {};
    shards[key][word] = entry;
  }
  let totalSize = 0;
  for (const [key, entries] of Object.entries(shards)) {
    const file = path.join(OUT_DIR, `${key}.js`);
    fs.writeFileSync(
      file,
      `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.dictionary = window.IELTS_BANK.dictionary || {};\nObject.assign(window.IELTS_BANK.dictionary, ${JSON.stringify(entries)});\n`,
      "utf8"
    );
    totalSize += fs.statSync(file).size;
  }
  console.log(JSON.stringify({ words: Object.keys(dictionary).length, shards: Object.keys(shards).length, totalSize }, null, 2));
}

main();
