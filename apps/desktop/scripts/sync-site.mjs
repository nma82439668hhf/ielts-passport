import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(here, "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const sourceSite = path.join(repoRoot, "site", "index.html");
const source = fs.existsSync(sourceSite) ? path.join(repoRoot, "site") : repoRoot;
const target = path.join(desktopRoot, "web");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, {
  recursive: true,
  filter: (entry) => {
    const relative = path.relative(source, entry);
    if (!relative) return true;
    const first = relative.split(path.sep)[0];
    return !["apps", "node_modules", "dist", "web", ".git"].includes(first);
  }
});
console.log(`Copied ${source} -> ${target}`);
