// Vault Primer: builds a ready-to-use notes folder and hands it over as a zip.
(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date().toISOString().slice(0, 10);

  const note = (title, type, body, date = today) =>
    `---\ntitle: "${title}"\ntype: ${type}\ntags: []\naliases: []\nauthors: []\nupdated: ${date}\n---\n\n# ${title}\n\n${body.trim()}\n`;

  const templates = {
    Character: note("{{title}}", "character", `
## Who they are

## What they want

## What stands in their way

## Connections
`, "{{date}}"),
    Place: note("{{title}}", "location", `
## At a glance

## Who lives here

## Secrets

## Connections
`, "{{date}}"),
    Faction: note("{{title}}", "faction", `
## What they want

## How they get it

## Who they're up against

## Connections
`, "{{date}}"),
    Event: note("{{title}}", "event", `
## When

## What happened

## Who was there

## What changed
`, "{{date}}"),
    Session: note("Session {{date}}", "session", `
## Recap

## What the players did

## Threads left open

## Next time
`, "{{date}}"),
    Chapter: note("{{title}}", "chapter", `
## In one line

## Scenes

## Notes
`, "{{date}}"),
    Note: note("{{title}}", "note", ``, "{{date}}"),
  };

  const layouts = {
    world: {
      folders: ["Inbox", "Places", "Peoples", "Characters", "Factions", "History", "Maps"],
      templates: ["Character", "Place", "Faction", "Event", "Note"],
      start: "Drop rough ideas in **Inbox** and sort them later. Everything else has a folder.",
    },
    campaign: {
      folders: ["Inbox", "Sessions", "Characters", "Places", "Factions", "Handouts"],
      templates: ["Session", "Character", "Place", "Faction", "Note"],
      start: "Make a new **Session** note before each game, and fill in the recap straight after.",
    },
    novel: {
      folders: ["Inbox", "Chapters", "Characters", "Places", "Research"],
      templates: ["Chapter", "Character", "Place", "Note"],
      start: "One note per chapter in **Chapters**. Keep anything you look up in **Research**.",
    },
    notes: {
      folders: ["Inbox", "Notes"],
      templates: ["Note"],
      start: "Write in **Inbox**, move what you keep to **Notes**.",
    },
  };

  function build() {
    const name = ($("name").value.trim() || "My Vault").replace(/[\\/:*?"<>|]/g, "");
    const kind = layouts[$("kind").value];
    const files = {};
    files["Start here.md"] = note("Start here", "note", `
Welcome to ${name}.

${kind.start}

To make a new note from a template, open the command palette (Ctrl+P, or Cmd+P on a Mac) and choose **Templates: Insert template**.

Link notes by typing \`[[\` and the name of another note.
`);
    kind.folders.forEach((f) => (files[`${f}/.keep`] = ""));
    kind.templates.forEach((t) => (files[`Templates/${t}.md`] = templates[t]));
    files[".obsidian/templates.json"] = JSON.stringify({ folder: "Templates" }, null, 2);
    return { name, files };
  }

  function showTree() {
    const { name, files } = build();
    const lines = [name + "/"];
    const seen = new Set();
    Object.keys(files).filter((p) => !p.startsWith(".obsidian")).sort().forEach((p) => {
      const parts = p.split("/");
      if (parts.length > 1 && !seen.has(parts[0])) { seen.add(parts[0]); lines.push(`  ${parts[0]}/`); }
      if (parts.length > 1 && parts[1] !== ".keep") lines.push(`    ${parts[1]}`);
      if (parts.length === 1) lines.push(`  ${p}`);
    });
    $("tree").textContent = lines.join("\n");
  }

  $("name").addEventListener("input", showTree);
  $("kind").addEventListener("change", showTree);
  showTree();

  $("make").addEventListener("click", async () => {
    const { name, files } = build();
    const zip = new JSZip();
    const root = zip.folder(name);
    Object.entries(files).forEach(([p, c]) => root.file(p, c));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
})();
