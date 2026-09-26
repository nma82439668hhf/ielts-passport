const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: node tools/set-version.js 1.0.2");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const site = fs.existsSync(path.join(root, "site", "index.html")) ? path.join(root, "site") : root;
const releasedAt = new Date().toISOString();
const base = "https://nma82439668hhf.github.io/ielts-passport/";

fs.writeFileSync(path.join(site, "data", "version.js"), `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.version = ${JSON.stringify({ webVersion: version, releasedAt })};\n`, "utf8");
fs.writeFileSync(path.join(site, "data", "remote-version.js"), `window.IELTS_REMOTE_VERSION = ${JSON.stringify({ webVersion: version, releasedAt, siteUrl: base })};\n`, "utf8");
fs.writeFileSync(path.join(site, "version.json"), `${JSON.stringify({ webVersion: version, releasedAt, siteUrl: base, mode: "hybrid" }, null, 2)}\n`, "utf8");
console.log(`Version set to ${version}`);
