import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(here, "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const source = [path.join(repoRoot, "source", "site"), path.join(repoRoot, "site"), repoRoot]
  .find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
if (!source) throw new Error(`Website index.html not found under ${repoRoot}`);
const target = path.join(desktopRoot, "web");

if (path.dirname(target) !== desktopRoot || path.basename(target) !== "web") {
  throw new Error("Unexpected desktop web target");
}
fs.rmSync(target, { recursive: true, force: true });

const skip = new Set(["apps", "node_modules", "dist", "web", ".git"]);
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
