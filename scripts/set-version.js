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
const policyPath = path.join(root, "deployment-policy.json");
// Missing policy fails closed: a website version bump must not resume native updates.
const policy = fs.existsSync(policyPath) ? JSON.parse(fs.readFileSync(policyPath, "utf8")) : {};
const nativeUpdatesEnabled = policy.nativeUpdates === "enabled";
const previousVersionFile = path.join(site,"version.json");
const previous = fs.existsSync(previousVersionFile) ? JSON.parse(fs.readFileSync(previousVersionFile,"utf8")) : {};
const appReleases = {...(previous.appReleases || {})};
if (nativeUpdatesEnabled) {
  for (const platform of policy.nativePlatforms || ["windows","macos","linux","android","ios"]) appReleases[platform] = version;
}

function updatePackageVersion(packagePath) {
  if (!fs.existsSync(packagePath)) return;
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.version = version;
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

fs.writeFileSync(path.join(site, "data", "version.js"), `window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.version = ${JSON.stringify({ webVersion: version, releasedAt, appReleases })};\n`, "utf8");
fs.writeFileSync(path.join(site, "version.json"), `${JSON.stringify({ webVersion: version, releasedAt, siteUrl: base, mode: "hybrid", appReleases }, null, 2)}\n`, "utf8");
if (nativeUpdatesEnabled) {
  if (policy.cloudUpdates !== "paused") {
    fs.writeFileSync(path.join(site, "data", "remote-version.js"), `window.IELTS_REMOTE_VERSION = ${JSON.stringify({ webVersion: version, releasedAt, siteUrl: base })};\n`, "utf8");
  }
  updatePackageVersion(path.join(root, "apps", "desktop", "package.json"));
  updatePackageVersion(path.join(root, "apps", "mobile", "package.json"));
}
console.log(`Website version set to ${version}; native updates ${nativeUpdatesEnabled ? "enabled" : "paused"}.`);
