import { readFileSync, writeFileSync } from "node:fs";

const inputPath = "docs/SAN_ANTONIO_INDOOR_GOLF_SIMULATOR_PROSPECTS.csv";
const outputPath = "docs/SAN_ANTONIO_INDOOR_GOLF_SIMULATOR_PROSPECTS_MOBILE.html";

function parseCsv(source) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value, protocol) {
  if (!value) return "";
  if (protocol === "tel") return `tel:${value.replace(/[^+\d]/g, "")}`;
  if (protocol === "mailto") return `mailto:${encodeURIComponent(value)}`;
  return /^https:\/\//i.test(value) ? value : "";
}

const prospects = parseCsv(readFileSync(inputPath, "utf8"));
const cards = prospects.map((prospect, index) => {
  const phoneUrl = safeUrl(prospect.phone, "tel");
  const emailUrl = safeUrl(prospect.email, "mailto");
  const websiteUrl = safeUrl(prospect.website, "https");
  const searchText = Object.values(prospect).join(" ").toLowerCase();
  const actions = [
    phoneUrl ? `<a class="action" href="${escapeHtml(phoneUrl)}">Call</a>` : "",
    emailUrl ? `<a class="action" href="${escapeHtml(emailUrl)}">Email</a>` : "",
    websiteUrl ? `<a class="action primary" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noreferrer">Website</a>` : "",
  ].filter(Boolean).join("");

  return `<article class="card" data-priority="${escapeHtml(prospect.priority)}" data-search="${escapeHtml(searchText)}">
    <div class="card-top">
      <span class="number">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h2>${escapeHtml(prospect.business)}</h2>
        <p class="location">${escapeHtml(prospect.city)} · ${escapeHtml(prospect.status)}</p>
      </div>
      <span class="badge badge-${escapeHtml(prospect.priority)}">${escapeHtml(prospect.priority)}</span>
    </div>
    <dl>
      <div><dt>Address</dt><dd>${escapeHtml(prospect.address)}</dd></div>
      <div><dt>Model</dt><dd>${escapeHtml(prospect.model)}</dd></div>
      <div><dt>Technology</dt><dd>${escapeHtml(prospect.technology || "Needs verification")}</dd></div>
      <div><dt>Partner fit</dt><dd>${escapeHtml(prospect.partner_fit)}</dd></div>
      <div class="next"><dt>Next action</dt><dd>${escapeHtml(prospect.next_action)}</dd></div>
    </dl>
    ${actions ? `<nav class="actions" aria-label="Contact ${escapeHtml(prospect.business)}">${actions}</nav>` : ""}
  </article>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#101816">
  <title>Pin2Win · San Antonio Simulator Prospects</title>
  <style>
    :root { color-scheme: light; --ink:#18211f; --muted:#59645f; --green:#2f6b3f; --cream:#fbf8f1; --line:#ded6c8; --white:#fff; }
    * { box-sizing: border-box; }
    html { background:#101816; }
    body { margin:0; color:var(--ink); background:var(--cream); font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { padding:calc(24px + env(safe-area-inset-top)) 18px 25px; color:white; background:#101816; }
    .eyebrow { margin:0 0 8px; color:#a8c878; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    h1 { max-width:700px; margin:0; font-size:clamp(27px,7vw,44px); line-height:1.05; letter-spacing:-.035em; }
    .intro { max-width:750px; margin:14px 0 0; color:#c7d0cb; font-size:14px; }
    .controls { position:sticky; z-index:5; top:0; display:grid; gap:10px; padding:12px 16px; border-bottom:1px solid var(--line); background:rgba(251,248,241,.96); backdrop-filter:blur(12px); }
    input,select { width:100%; min-height:46px; padding:10px 13px; border:1px solid #cfc8bc; border-radius:12px; background:white; color:var(--ink); font:inherit; }
    main { width:min(100%,850px); margin:auto; padding:16px 14px 42px; }
    .summary { display:flex; justify-content:space-between; gap:12px; margin:0 3px 12px; color:var(--muted); font-size:13px; }
    .card { margin:0 0 13px; padding:17px; border:1px solid var(--line); border-radius:17px; background:var(--white); box-shadow:0 5px 18px rgba(28,36,32,.055); }
    .card-top { display:grid; grid-template-columns:32px minmax(0,1fr) auto; align-items:start; gap:10px; }
    .number { display:grid; width:32px; height:32px; place-items:center; border-radius:10px; color:white; background:var(--green); font-size:12px; font-weight:800; }
    h2 { margin:1px 0 2px; font-size:19px; line-height:1.15; letter-spacing:-.02em; }
    .location { margin:0; color:var(--muted); font-size:12px; text-transform:capitalize; }
    .badge { max-width:75px; padding:5px 8px; border-radius:999px; background:#edf1ed; color:#46514b; font-size:10px; font-weight:900; text-align:center; text-transform:uppercase; }
    .badge-high { color:#245633; background:#e4f0e6; }
    .badge-reference { color:#69480d; background:#f6e8bc; }
    .badge-watch,.badge-verify { color:#7c441e; background:#f8e7db; }
    dl { display:grid; gap:8px; margin:15px 0 0; }
    dl div { display:grid; grid-template-columns:82px minmax(0,1fr); gap:8px; }
    dt { color:var(--muted); font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
    dd { margin:0; font-size:13px; }
    .next { margin-top:2px; padding-top:10px; border-top:1px solid #ece7de; }
    .next dd { font-weight:700; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:15px; }
    .action { min-width:76px; padding:9px 12px; border:1px solid #c8d3ca; border-radius:10px; color:var(--green); font-size:13px; font-weight:800; text-align:center; text-decoration:none; }
    .action.primary { color:white; border-color:var(--green); background:var(--green); }
    .empty { display:none; padding:45px 20px; color:var(--muted); text-align:center; }
    footer { padding:20px 16px calc(24px + env(safe-area-inset-bottom)); color:#b8c1bc; background:#101816; font-size:12px; text-align:center; }
    @media (min-width:650px) { .controls { grid-template-columns:2fr 1fr; } main { padding:22px; } .card { padding:21px; } }
    @media print { .controls { position:static; } .card { break-inside:avoid; box-shadow:none; } .actions { display:none; } }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">Pin2Win field prospecting</p>
    <h1>San Antonio-area simulator prospects</h1>
    <p class="intro">${prospects.length} operating, secondary and watchlist prospects. Tap to call, email or open the venue website. Verify current operations before visiting.</p>
  </header>
  <section class="controls" aria-label="Prospect filters">
    <input id="search" type="search" placeholder="Search business, city, technology…" autocomplete="off">
    <select id="priority">
      <option value="all">All prospect types</option>
      <option value="high">High priority</option>
      <option value="medium">Medium priority</option>
      <option value="outer">Outer market</option>
      <option value="secondary">Secondary</option>
      <option value="watch">Watchlist</option>
      <option value="verify">Needs verification</option>
      <option value="low">Low priority</option>
      <option value="reference">Current partner</option>
    </select>
  </section>
  <main>
    <div class="summary"><span id="count">${prospects.length} prospects shown</span><span>Updated Sep. 16, 2026</span></div>
    <section id="cards">${cards}</section>
    <p id="empty" class="empty">No prospects match those filters.</p>
  </main>
  <footer>Internal working list · Confirm status, decision-maker and technical compatibility before outreach.</footer>
  <script>
    const search = document.querySelector('#search');
    const priority = document.querySelector('#priority');
    const cards = [...document.querySelectorAll('.card')];
    const count = document.querySelector('#count');
    const empty = document.querySelector('#empty');
    function filterCards() {
      const term = search.value.trim().toLowerCase();
      const selected = priority.value;
      let visible = 0;
      cards.forEach((card) => {
        const matchesText = !term || card.dataset.search.includes(term);
        const matchesPriority = selected === 'all' || card.dataset.priority === selected;
        const show = matchesText && matchesPriority;
        card.hidden = !show;
        if (show) visible += 1;
      });
      count.textContent = visible + (visible === 1 ? ' prospect shown' : ' prospects shown');
      empty.style.display = visible ? 'none' : 'block';
    }
    search.addEventListener('input', filterCards);
    priority.addEventListener('change', filterCards);
  </script>
</body>
</html>`;

writeFileSync(outputPath, html);
console.log(`${outputPath} (${prospects.length} prospects)`);
