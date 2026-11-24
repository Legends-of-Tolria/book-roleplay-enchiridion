// File Converter: any supported file -> Markdown first, then whatever you asked for.
(() => {
  const $ = (id) => document.getElementById(id);
  const files = $("files"), go = $("go"), zipBtn = $("zip"), results = $("results"), preview = $("preview");
  const format = $("format");
  let picked = [], done = [];

  pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
  td.use(turndownPluginGfm.gfm);

  const today = () => new Date().toISOString().slice(0, 10);
  const baseName = (n) => n.replace(/\.[^.]+$/, "");
  const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "note";
  // Give tables a header row and plain cells so they come out as Markdown tables.
  const cleanHtml = (html) => {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    doc.querySelectorAll("table").forEach((t) => {
      t.querySelectorAll("td p, th p").forEach((p) => p.replaceWith(...p.childNodes, " "));
      if (!t.querySelector("th")) {
        const first = t.querySelector("tr");
        first && first.querySelectorAll("td").forEach((td) => {
          const th = doc.createElement("th");
          th.append(...td.childNodes);
          td.replaceWith(th);
        });
      }
    });
    return doc.body.innerHTML;
  };
  const prettyName = (n) => { const s = baseName(n).replace(/[-_]+/g, " ").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
  const tidy = (md) => md.replace(/^(\s*)([-*]|\d+\.)\s{2,}/gm, "$1$2 ").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

  // Each reader returns { title?, md }
  const readers = {
    async docx(file) {
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      return { md: td.turndown(cleanHtml(value)) };
    },
    async html(file) {
      const doc = new DOMParser().parseFromString(await file.text(), "text/html");
      doc.querySelectorAll("script, style").forEach((n) => n.remove());
      return { title: doc.title, md: td.turndown(cleanHtml(doc.body.innerHTML)) };
    },
    async md(file) {
      let text = await file.text(), title;
      const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
      if (fm) {
        const t = fm[1].match(/^title:\s*"?(.*?)"?\s*$/m);
        if (t) title = t[1];
        text = text.slice(fm[0].length);
      }
      return { title, md: text };
    },
    async txt(file) {
      // Keep each line of a text file as its own paragraph.
      return { md: (await file.text()).replace(/\r\n?/g, "\n").replace(/([^\n])\n(?!\n)/g, "$1\n\n") };
    },
    async pdf(file) {
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const lines = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const { items } = await (await pdf.getPage(i)).getTextContent();
        let line = null;
        for (const it of items) {
          if (!it.str.trim() && !line) continue;
          const y = it.transform[5], size = Math.abs(it.transform[0]) || it.height;
          if (!line || Math.abs(y - line.y) > 2) {
            if (line) lines.push(line);
            line = { text: "", y, size, gap: line ? line.y - y : 0 };
          }
          line.text += it.str;
          line.size = Math.max(line.size, size);
        }
        if (line) lines.push(line);
      }
      // Work out what normal text looks like, then spot headings and paragraph breaks.
      const median = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] || 0;
      const body = median(lines.map((l) => l.size));
      const step = median(lines.filter((l) => l.gap > 0).map((l) => l.gap)) || body * 1.2;
      let title, out = "", para = "";
      const flush = () => { if (para) out += para.replace(/(\w)- (\w)/g, "$1$2") + "\n\n"; para = ""; };
      for (const l of lines) {
        const text = l.text.trim();
        if (!text) { flush(); continue; }
        if (l.size > body * 1.25 && text.length < 120) {
          flush();
          if (!title) { title = text; out += `# ${text}\n\n`; } else out += `## ${text}\n\n`;
          continue;
        }
        if (l.gap > step * 1.3 || l.gap < 0) flush();
        para += (para ? " " : "") + text;
      }
      flush();
      return { title, md: out };
    },
  };
  readers.markdown = readers.md;
  readers.htm = readers.html;

  function asMarkdownNote(title, body) {
    const tags = $("tags").value.split(",").map((t) => t.trim()).filter(Boolean);
    const author = $("author").value.trim();
    const q = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;
    const front = [
      "---",
      `title: ${q(title)}`,
      `tags: [${tags.map(q).join(", ")}]`,
      "aliases: []",
      `authors: [${author ? q(author) : ""}]`,
      `updated: ${today()}`,
      "---",
      "",
    ].join("\n");
    const hasH1 = /^#\s/m.test(body.split("\n").find((l) => l.trim()) || "");
    return front + (hasH1 ? "" : `# ${title}\n\n`) + body;
  }

  function asHtml(title, body) {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${esc(title)}</title>\n<style>body{font:18px/1.6 Georgia,serif;max-width:42rem;margin:40px auto;padding:0 16px;color:#222}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}</style>\n</head>\n<body>\n${marked.parse(body)}\n</body>\n</html>\n`;
  }

  function asText(body) {
    // Parse into a separate, inert document so nothing in the file can run.
    const div = new DOMParser().parseFromString(marked.parse(body), "text/html").body;
    div.querySelectorAll("p, h1, h2, h3, h4, li, tr, pre, blockquote").forEach((n) => n.append("\n"));
    div.querySelectorAll("li").forEach((n) => n.prepend("- "));
    return div.textContent.replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function download(name, content) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: "text/plain" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function pick(list) {
    picked = [...list];
    done = [];
    results.replaceChildren(...picked.map((f) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      const em = document.createElement("em");
      span.textContent = f.name;
      em.textContent = "ready";
      li.append(span, em);
      return li;
    }));
    go.disabled = !picked.length;
    zipBtn.hidden = true;
    preview.hidden = true;
  }

  files.addEventListener("change", () => pick(files.files));
  const drop = $("drop");
  ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (ev) => pick(ev.dataTransfer.files));
  format.addEventListener("change", () => document.querySelectorAll(".md-only").forEach((n) => (n.hidden = format.value !== "md")));

  go.addEventListener("click", async () => {
    go.disabled = true;
    done = [];
    const rows = results.querySelectorAll("li");
    const used = new Set();
    for (const [i, file] of picked.entries()) {
      const row = rows[i];
      const ext = file.name.split(".").pop().toLowerCase();
      const reader = readers[ext];
      if (!reader) { row.querySelector("em").textContent = "not a file I can read yet"; row.className = "bad"; continue; }
      row.querySelector("em").textContent = "working…";
      try {
        const { title: found, md } = await reader(file);
        const body = tidy(md);
        const h1 = (body.match(/^#\s+(.+)$/m) || [])[1];
        const title = (found || h1 || prettyName(file.name)).trim();
        const kind = format.value;
        const out = kind === "md" ? asMarkdownNote(title, body) : kind === "html" ? asHtml(title, body) : asText(body);
        let name = slug(title), n = 2;
        while (used.has(name)) name = `${slug(title)}-${n++}`;
        used.add(name);
        name += "." + kind;
        done.push({ name, out });
        row.className = "good";
        const btn = document.createElement("button");
        btn.className = "link";
        btn.textContent = `Download ${name}`;
        btn.addEventListener("click", () => download(name, out));
        row.querySelector("em").replaceChildren(btn);
        if (done.length === 1) { preview.textContent = out.slice(0, 4000); preview.hidden = false; }
      } catch (err) {
        console.error(err);
        row.className = "bad";
        row.querySelector("em").textContent = "couldn't read this one";
      }
    }
    zipBtn.hidden = done.length < 2;
    go.disabled = false;
  });

  zipBtn.addEventListener("click", async () => {
    const zip = new JSZip();
    done.forEach((d) => zip.file(d.name, d.out));
    download("converted-notes.zip", await zip.generateAsync({ type: "blob" }));
  });
})();
