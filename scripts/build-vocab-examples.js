const fs = require("fs");
const path = require("path");
const readline = require("readline");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const VOCAB_FILE = process.env.VOCAB_FILE ? path.resolve(process.env.VOCAB_FILE) : path.join(ROOT, "site", "data", "vocab-levels.js");
const TATOEBA_FILE = process.env.TATOEBA_FILE ? path.resolve(process.env.TATOEBA_FILE) : path.join(ROOT, "work", "tatoeba", "extracted", "eng_sentences.tsv");
const OUT = process.env.EXAMPLES_PATH ? path.resolve(process.env.EXAMPLES_PATH) : path.join(ROOT, "work", "vocab-examples.json");

function loadTargetWords() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(VOCAB_FILE, "utf8"), context);
  const levels = context.window.IELTS_BANK.vocabLevels || {};
  return new Set(Object.values(levels).flat().map((entry) => entry.w.toLowerCase()));
}

function simpleScore(sentence) {
  const words = sentence.split(/\s+/).length;
  const commas = (sentence.match(/[,;:()]/g) || []).length;
  return sentence.length + words * 1.5 + commas * 12;
}

async function main() {
  const targets = loadTargetWords();
  const examples = {};
  const rl = readline.createInterface({ input: fs.createReadStream(TATOEBA_FILE), crlfDelay: Infinity });
  for await (const line of rl) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const sentence = parts.slice(2).join("\t").trim();
    if (sentence.length < 18 || sentence.length > 150) continue;
    if (!/^[\x20-\x7E]+$/.test(sentence)) continue;
    const tokens = sentence.toLowerCase().match(/[a-z][a-z'-]*/g) || [];
    tokens.forEach((word) => {
      if (!targets.has(word)) return;
      const current = examples[word];
      if (!current || simpleScore(sentence) < simpleScore(current)) examples[word] = sentence;
    });
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(examples, null, 2), "utf8");
  console.log(JSON.stringify({ targetWords: targets.size, exampleWords: Object.keys(examples).length, output: OUT }, null, 2));
}

main();
