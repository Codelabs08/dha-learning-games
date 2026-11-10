// Scans games/ and writes games.json. Run by the GitHub Action on every push (node build.js). No packages needed.
// Add a game:  games/<year>/<game-name>/index.html  (+ info.json, thumb.png/.jpg/.webp/.svg)
// Folders starting with "_" or "." (e.g. _template) are ignored.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const GAMES = path.join(ROOT, "games");
const IMG = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));

const titleCase = s => s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
const readJSON = p => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; } };
const findImg = (dir, base) => {
  for (const ext of IMG) { const p = path.join(dir, base + ext); if (fs.existsSync(p)) return rel(p); }
  return null;
};
const skip = n => n.startsWith(".") || n.startsWith("_");
const FIELDS = ["by", "years", "description", "emoji", "added", "strand", "tc"];
const pick = info => Object.fromEntries(FIELDS.filter(k => info[k]).map(k => [k, info[k]]));

const games = [];
const subjects = [];

if (fs.existsSync(GAMES)) {
  for (const subject of fs.readdirSync(GAMES).sort()) {
    const sDir = path.join(GAMES, subject);
    if (skip(subject) || !fs.statSync(sDir).isDirectory()) continue;
    let count = 0;
    for (const entry of fs.readdirSync(sDir).sort()) {
      if (skip(entry)) continue;
      const p = path.join(sDir, entry);
      if (!fs.statSync(p).isDirectory()) continue;
      let entryFile = path.join(p, "index.html");
      if (!fs.existsSync(entryFile)) {
        const html = fs.readdirSync(p).find(f => f.toLowerCase().endsWith(".html"));
        if (!html) continue;
        entryFile = path.join(p, html);
      }
      const info = readJSON(path.join(p, "info.json"));
      games.push({
        id: `${subject}/${entry}`,
        subject,
        title: info.title || titleCase(entry),
        thumb: info.thumb ? rel(path.join(p, info.thumb)) : (findImg(p, "thumb") || findImg(p, "thumbnail") || findImg(p, "cover")),
        url: rel(entryFile),
        ...pick(info),
      });
      count++;
    }
    if (count) subjects.push(subject);
  }
}

const order = Object.keys(site.subjects || {});
subjects.sort((a, b) => {
  const ia = order.indexOf(a), ib = order.indexOf(b);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
});

fs.writeFileSync(path.join(ROOT, "games.json"), JSON.stringify({ built: new Date().toISOString(), subjects, games }, null, 2));
console.log(`games.json: ${games.length} games in ${subjects.length} year groups (${subjects.join(", ")})`);
