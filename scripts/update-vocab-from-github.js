const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const WORK = path.join(ROOT, "work");
const CEFR_DIR = path.join(WORK, "cefr-vocab");
const ECDICT_PATH = path.join(WORK, "ecdict.csv");
const SITE_DATA = process.env.SITE_DATA_DIR ? path.resolve(process.env.SITE_DATA_DIR) : path.join(ROOT, "site", "data");
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const SOURCES = {
  cefr: "anig1scur/CEFR-Vocabulary-List",
  ecdict: "skywind3000/ECDICT",
};

async function download(url, dest, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "IELTS-Passport-Updater" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buffer);
      console.log(`Downloaded ${url} -> ${dest} (${buffer.length} bytes)`);
      return;
    } catch (e) {
      lastError = e;
      if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

function run(script) {
  execFileSync(process.execPath, [script], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      SITE_DATA_DIR: SITE_DATA,
      CEFR_DIR,
      ECDICT_PATH,
    },
  });
}

function countVocab() {
  const file = path.join(SITE_DATA, "vocab-levels.js");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context);
  const levels = context.window.IELTS_BANK.vocabLevels || {};
  return Object.fromEntries(Object.entries(levels).map(([level, list]) => [level, list.length]));
}

(async () => {
  fs.mkdirSync(CEFR_DIR, { recursive: true });

  for (const level of LEVELS) {
    await download(
      `https://raw.githubusercontent.com/${SOURCES.cefr}/slave/${level}.txt`,
      path.join(CEFR_DIR, `${level}.txt`)
    );
  }
  await download(`https://raw.githubusercontent.com/${SOURCES.cefr}/slave/LICENSE`, path.join(CEFR_DIR, "LICENSE"));
  await download(`https://raw.githubusercontent.com/${SOURCES.ecdict}/master/ecdict.csv`, ECDICT_PATH);
  await download(`https://raw.githubusercontent.com/${SOURCES.ecdict}/master/LICENSE`, path.join(WORK, "ECDICT-LICENSE"));

  run(path.join(__dirname, "build-vocab-levels.js"));
  run(path.join(__dirname, "build-dictionary.js"));

  const meta = {
    updatedAt: new Date().toISOString(),
    sources: SOURCES,
    counts: countVocab(),
  };
  fs.writeFileSync(
    path.join(SITE_DATA, "vocab-meta.js"),
    `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.vocabMeta = ${JSON.stringify(meta)};\n`,
    "utf8"
  );
  console.log(JSON.stringify(meta, null, 2));
})();
