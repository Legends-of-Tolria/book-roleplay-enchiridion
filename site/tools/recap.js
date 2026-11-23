// Session Recap: turns a few boxes into a vault note and a Discord post.
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = "enchiridion-recap";
  const fields = ["campaign", "num", "date", "players", "happened", "loot", "threads", "next", "quote"];
  let view = "md";

  // Remember the campaign and the table, not the whole session.
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    $("campaign").value = saved.campaign || "";
    $("players").value = saved.players || "";
    if (saved.num) $("num").value = Number(saved.num) + 1;
  } catch {}
  $("date").value = new Date().toISOString().slice(0, 10);

  const val = (id) => $(id).value.trim();
  const lines = (id) => val(id).split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
  const list = (id) => lines(id).map((l) => "- " + l).join("\n");
  const yaml = (s) => /[:#"'\[\]{}]/.test(s) ? JSON.stringify(s) : s;

  function title() {
    const n = val("num");
    return [val("campaign"), n && `Session ${n}`].filter(Boolean).join(" · ") || "Session recap";
  }

  function note() {
    const sections = [
      ["What happened", list("happened")],
      ["Loot and rewards", list("loot")],
      ["Threads left open", lines("threads").map((l) => "- [ ] " + l).join("\n")],
      ["Next time", list("next")],
    ].filter(([, body]) => body);
    let md = `---\ntitle: ${yaml(title())}\ntype: session\n`;
    if (val("campaign")) md += `campaign: ${yaml(val("campaign"))}\n`;
    if (val("num")) md += `session: ${val("num")}\n`;
    md += `tags: [session]\nupdated: ${val("date")}\n---\n\n# ${title()}\n\n`;
    if (val("players")) md += `**Played:** ${val("players")}  \n`;
    md += `**Date:** ${val("date")}\n\n`;
    for (const [h, body] of sections) md += `## ${h}\n\n${body}\n\n`;
    if (val("quote")) md += `> ${val("quote").replace(/\n/g, "\n> ")}\n`;
    return md.trimEnd() + "\n";
  }

  function discord() {
    let d = `**${title()}**`;
    if (val("date")) d += `  ·  ${val("date")}`;
    d += "\n";
    const part = (h, id) => { if (lines(id).length) d += `\n__${h}__\n${lines(id).map((l) => "• " + l).join("\n")}\n`; };
    part("What happened", "happened");
    part("Loot", "loot");
    part("Still open", "threads");
    part("Next time", "next");
    if (val("quote")) d += `\n> ${val("quote").replace(/\n/g, "\n> ")}\n`;
    return d.trimEnd();
  }

  function update() {
    $("out").textContent = view === "md" ? note() : discord();
    try { localStorage.setItem(KEY, JSON.stringify({ campaign: val("campaign"), players: val("players"), num: val("num") })); } catch {}
  }

  fields.forEach((f) => $(f).addEventListener("input", update));
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    view = b.dataset.view;
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
    update();
  }));

  $("copy").addEventListener("click", async () => {
    const text = $("out").textContent;
    try { await navigator.clipboard.writeText(text); }
    catch { const r = document.createRange(); r.selectNodeContents($("out")); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy"); }
    $("copy").textContent = "Copied";
    setTimeout(() => ($("copy").textContent = "Copy"), 1500);
  });

  $("download").addEventListener("click", () => {
    const name = title().replace(/[\\/:*?"<>|]/g, "").replace(/\s*·\s*/g, " - ") + ".md";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([note()], { type: "text/markdown" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("clear").addEventListener("click", () => {
    ["happened", "loot", "threads", "next", "quote"].forEach((f) => ($(f).value = ""));
    if (val("num")) $("num").value = Number(val("num")) + 1;
    $("date").value = new Date().toISOString().slice(0, 10);
    update();
  });

  update();
})();
