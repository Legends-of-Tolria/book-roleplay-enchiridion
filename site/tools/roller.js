// Table Roller: paste a list, roll on it, keep your favourites.
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = "enchiridion-tables";
  const starter = {
    "Road encounters": [
      "1-2 A merchant with a broken axle, offering a discount for help",
      "3-4 {1d4+1} wolves, thin and desperate",
      "5 A shrine with fresh flowers and no one in sight",
      "6 Soldiers checking papers, and one of them is lying",
    ].join("\n"),
  };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { ...starter }; } catch { return { ...starter }; } };
  const store = (t) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} };
  let tables = load();

  const die = (n) => Math.floor(Math.random() * n) + 1;
  // {2d6+1}, {d20}, {3d4-1}
  const rollDice = (text) =>
    text.replace(/\{\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*\}/gi, (_, n, s, mod) => {
      let total = 0;
      for (let i = 0; i < (Number(n) || 1); i++) total += die(Number(s));
      return String(total + (mod ? Number(mod.replace(/\s/g, "")) : 0));
    });

  // Lines like "1-3 Wolf" or "4. Bear" take their numbers as odds; plain lines count once each.
  function parse(text) {
    const rows = [];
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const m = line.match(/^(\d+)(?:\s*[-–]\s*(\d+))?[.):]?\s+(.+)$/);
      if (m) rows.push({ from: +m[1], to: +(m[2] || m[1]), text: m[3] });
      else rows.push({ text: line });
    }
    const numbered = rows.length && rows.every((r) => r.from);
    if (numbered) return rows.map((r) => ({ weight: r.to - r.from + 1, text: r.text }));
    return rows.map((r) => ({ weight: 1, text: r.from ? `${r.from} ${r.text}` : r.text }));
  }

  function rollOnce() {
    const rows = parse($("entries").value);
    if (!rows.length) return null;
    let pick = Math.random() * rows.reduce((a, r) => a + r.weight, 0);
    for (const r of rows) if ((pick -= r.weight) < 0) return rollDice(r.text);
    return rollDice(rows[rows.length - 1].text);
  }

  function show(results) {
    if (!results[0]) { $("result").textContent = "Add a few lines to roll on."; return; }
    $("result").innerHTML = results.map((r) => `<p>${r.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
    const h = $("history");
    results.forEach((r) => { const li = document.createElement("li"); li.textContent = r; h.prepend(li); });
    while (h.children.length > 12) h.lastChild.remove();
  }

  function fill(selected) {
    const names = Object.keys(tables);
    $("saved").innerHTML = `<option value="">New table</option>` + names.map((n) => `<option>${n.replace(/</g, "&lt;")}</option>`).join("");
    $("saved").value = selected && tables[selected] !== undefined ? selected : "";
  }

  function open(name) {
    $("tname").value = name;
    $("entries").value = name ? tables[name] : "";
  }

  $("saved").addEventListener("change", () => open($("saved").value));
  $("roll").addEventListener("click", () => show([rollOnce()]));
  $("roll3").addEventListener("click", () => show([rollOnce(), rollOnce(), rollOnce()].filter(Boolean)));
  $("save").addEventListener("click", () => {
    const name = $("tname").value.trim() || "Untitled table";
    tables[name] = $("entries").value;
    store(tables);
    fill(name);
    $("tname").value = name;
  });
  $("del").addEventListener("click", () => {
    const name = $("saved").value;
    if (!name) return;
    delete tables[name];
    store(tables);
    fill("");
    open("");
  });

  const first = Object.keys(tables)[0] || "";
  fill(first);
  open(first);
})();
