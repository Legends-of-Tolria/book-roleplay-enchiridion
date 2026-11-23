// Builds the web edition from content/ into public/.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { icons, iconFor } from "./icons.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "content");
const OUT = path.join(ROOT, "public");
const SITE = "https://legendsoftolria.com/";
const DISCORD = "https://discord.gg/UXd6CVyE3P";
const checkOnly = process.argv.includes("--check");

const pages = new Map(); // id ("I-worldbuilder/03-tools-of-the-trade") -> page
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_") || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".md")) {
      const id = path.relative(SRC, p).replace(/\\/g, "/").replace(/\.md$/, "");
      const { data, content } = matter(fs.readFileSync(p, "utf8"));
      pages.set(id, { id, data, body: content });
    }
  }
}
walk(SRC);

// Workshop tools: HTML fragments in site/tools/, wrapped in the same page shell.
const TOOLS = path.join(ROOT, "site", "tools");
const tools = [];
for (const f of fs.readdirSync(TOOLS).filter((f) => f.endsWith(".html")).sort()) {
  const raw = fs.readFileSync(path.join(TOOLS, f), "utf8");
  const meta = (k) => ((raw.match(new RegExp(`<!--\\s*${k}:\\s*(.*?)\\s*-->`)) || [])[1] || "");
  const id = "tools/" + f.replace(/\.html$/, "");
  const page = {
    id, html: raw, tool: true,
    data: { title: meta("title"), order: Number(meta("order") || 99) },
    scripts: meta("scripts").split(",").map((x) => x.trim()).filter(Boolean),
    body: "",
  };
  pages.set(id, page);
  tools.push(page);
}
tools.sort((a, b) => a.data.order - b.data.order);

const hrefFrom = (fromId, toId) => {
  const depth = fromId.split("/").length - 1;
  return "../".repeat(depth) + toId + ".html";
};

const broken = [];
function linkify(page) {
  return page.body.replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const t = target.trim();
    const hit = pages.get(t);
    if (!hit) { broken.push(`${page.id} -> ${t}`); return label || t; }
    return `[${label || hit.data.title}](${hrefFrom(page.id, t)})`;
  });
}

// Books in order, from content/<Roman>-<name>/index.md
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const books = [...pages.values()]
  .filter((p) => /^[IVX]+-[^/]+\/index$/.test(p.id))
  .map((p) => {
    const folder = p.id.split("/")[0];
    const chapters = [...pages.values()]
      .filter((c) => c.id.startsWith(folder + "/") && !c.id.endsWith("/index"))
      .sort((a, b) => a.id.localeCompare(b.id));
    return { folder, num: folder.split("-")[0], index: p, chapters };
  })
  .sort((a, b) => ROMAN.indexOf(a.num) - ROMAN.indexOf(b.num));
const appendices = [...pages.values()].filter((p) => p.id.startsWith("appendices/")).sort((a, b) => a.id.localeCompare(b.id));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function nav(current) {
  const item = (p, label) =>
    `<li${p.id === current.id ? ' class="here"' : ""}><a href="${hrefFrom(current.id, p.id)}">${esc(label)}</a></li>`;
  let h = `<a class="home" href="${hrefFrom(current.id, "index")}">The Roleplay Enchiridion</a>`;
  for (const b of books) {
    const open = current.id.startsWith(b.folder + "/");
    h += `<details${open ? " open class=\"current\"" : ""}><summary><span class="num">${b.num}</span>${iconFor(b.folder)}<span class="label">${esc(b.index.data.title.replace(/^Book [IVX]+: /, ""))}</span></summary><ol>`;
    b.chapters.forEach((c) => (h += item(c, c.data.title)));
    h += `</ol></details>`;
  }
  const inTools = current.id.startsWith("tools/");
  h += `<details${inTools ? " open class=\"current\"" : ""}><summary><span class="num"></span>${icons.workshop}<span class="label">The Workshop</span></summary><ol class="plain">`;
  tools.forEach((t) => (h += item(t, t.data.title)));
  h += `</ol></details>`;
  const inApp = current.id.startsWith("appendices/");
  h += `<details${inApp ? " open class=\"current\"" : ""}><summary><span class="num"></span>${icons.appendices}<span class="label">Appendices</span></summary><ol class="plain">`;
  appendices.forEach((a) => (h += item(a, a.data.title.replace(/^Appendix /, ""))));
  return h + `</ol></details>`;
}

function kicker(page) {
  const folder = page.id.split("/")[0];
  if (page.data.book) {
    const book = books.find((b) => b.folder === folder);
    const num = book ? book.num : "";
    const name = book ? book.index.data.title.replace(/^Book [IVX]+: /, "") : page.data.book;
    const top = `<span class="k-top">${iconFor(folder)}<a href="${hrefFrom(page.id, folder + "/index")}">Book ${num}</a></span>`;
    if (!page.data.chapter) return top;
    return `${top}<span class="k-sub">${esc(name)}<span class="sep">/</span>Chapter ${ROMAN[page.data.chapter - 1]}</span>`;
  }
  if (folder === "tools") {
    return `<span class="k-top">${icons.workshop}<a href="${hrefFrom(page.id, "tools/index")}">The Workshop</a></span>`;
  }
  if (folder === "appendices") {
    const letter = (page.data.title.match(/^Appendix ([A-Z])/) || [])[1];
    return `<span class="k-top">${icons.appendices}<span>Appendices</span></span>${letter ? `<span class="k-sub">Appendix ${letter}</span>` : ""}`;
  }
  return "";
}

function render(page) {
  const draft = (page.data.tags || []).includes("draft");
  const md = draft ? "" : linkify(page).replace(/^\s*# .*\n+/, ""); // title comes from frontmatter
  const html = page.tool ? page.html : marked.parse(md, { gfm: true });
  const scripts = (page.scripts || []).map((src) => `<script src="${src}"></script>`).join("\n");
  const css = hrefFrom(page.id, "tome").replace(/\.html$/, ".css");
  const title = page.id === "index" ? "The Roleplay Enchiridion" : `${page.data.title} · The Roleplay Enchiridion`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="An open handbook for worldbuilders, writers, game masters, players and artists.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${css}">
</head>
<body class="${page.id === "index" ? "front" : page.tool ? "tool" : "leaf"}${draft ? " draft" : ""}">
<button class="menu" aria-controls="contents" aria-expanded="false">Contents</button>
<nav id="contents">${nav(page)}</nav>
<main>
<article>
<header>${kicker(page) ? `<p class="kicker">${kicker(page)}</p>` : ""}<h1>${esc(page.data.title.replace(/^(Book [IVX]+|Appendix [A-Z]): /, ""))}</h1></header>
${html}
</article>
<footer>Compiled by A.Z. at <a href="${SITE}">Legends of Tolria</a> &middot; <a href="${DISCORD}">Join the conversation on Discord</a> &middot; Text under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></footer>
</main>
<script>
const b=document.querySelector('.menu'),n=document.getElementById('contents');
b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
</script>
${scripts}
</body>
</html>
`;
}

for (const p of pages.values()) if (!p.tool) linkify(p);
if (broken.length) {
  console.error("Broken links:\n  " + [...new Set(broken)].join("\n  "));
  process.exit(1);
}
if (checkOnly) { console.log(`${pages.size} pages, all links resolve.`); process.exit(0); }

fs.rmSync(OUT, { recursive: true, force: true });
for (const p of pages.values()) {
  const f = path.join(OUT, p.id + ".html");
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, render(p));
}
fs.copyFileSync(path.join(ROOT, "site", "tome.css"), path.join(OUT, "tome.css"));
for (const f of fs.readdirSync(TOOLS)) {
  if (f.endsWith(".html")) continue;
  fs.cpSync(path.join(TOOLS, f), path.join(OUT, "tools", f), { recursive: true });
}
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`Built ${pages.size} pages into public/`);
