const fs = require("node:fs");
const path = require("node:path");

function resolveSite(root = path.resolve(__dirname, "..")) {
  const site = [path.join(root, "source", "site"), path.join(root, "site"), root]
    .find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
  if (!site) throw new Error(`Website index.html not found under ${root}`);
  return site;
}

module.exports = { resolveSite };
