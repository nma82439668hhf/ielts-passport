import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(here, "..");
const repoRoot = path.resolve(mobileRoot, "..", "..");
const sourceSite = path.join(repoRoot, "site", "index.html");
const source = fs.existsSync(sourceSite) ? path.join(repoRoot, "site") : repoRoot;
const target = path.join(mobileRoot, "www");

fs.rmSync(target, { recursive: true, force: true });

const skip = new Set(["apps", "node_modules", "dist", "www", "android", "ios", ".git"]);
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

copyDir(source, target);
console.log(`Copied ${source} -> ${target}`);
