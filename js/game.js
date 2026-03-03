let gameData;
let currentPAIndex = 0;

window.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(location.search);
  const date = params.get("date");
  const team = params.get("team");

  const res = await fetch(`live/${date}_${team}.json`);
  gameData = await res.json();

  renderSummary();
  renderScoreboard();
  renderLineups();
  renderField();
  renderZone();
  renderFilters();
  renderPitcherStats();
  renderBatterStats();
}

/* =====================
   試合概要
===================== */
function renderSummary() {
  const m = gameData.meta;
  document.getElementById("summary").innerHTML = `
    ${m.home} vs ${m.away}<br>
    球場: ${m.stadium}<br>
    開始: ${m.start_time}<br>
    審判: ${m.umpires?.join(", ")}
  `;
}

/* =====================
   スコアボード
===================== */
function renderScoreboard() {
  const sb = gameData.scoreboard;
  let html = "<table><tr><th></th>";

  sb.innings.forEach(i => html += `<th>${i}</th>`);
  html += "<th>R</th><th>H</th><th>E</th></tr>";

  ["away","home"].forEach(team => {
    html += `<tr><td>${sb[team].team}</td>`;
    sb[team].runs.forEach(r => html += `<td>${r}</td>`);
    html += `<td>${sb[team].total}</td>`;
    html += `<td>${sb[team].hits}</td>`;
    html += `<td>${sb[team].errors}</td></tr>`;
  });

  html += "</table>";
  document.getElementById("scoreboard").innerHTML = html;
}

/* =====================
   オーダー
===================== */
function renderLineups() {
  document.getElementById("homeLineup").innerHTML =
    renderPlayers(gameData.lineups.home);
  document.getElementById("awayLineup").innerHTML =
    renderPlayers(gameData.lineups.away);
}

function renderPlayers(players) {
  return players.map(p =>
    `<div>
      <a href="player_detail.html?id=${p.id}">
      ${p.name}</a>
      (${p.avg || p.era})
    </div>`
  ).join("");
}

/* =====================
   守備・塁
===================== */
function renderField() {
  const field = document.getElementById("field");
  field.innerHTML = "";

  const bases = gameData.current_state?.bases || {};

  const positions = {
    1: {top: "200px", left:"220px"},
    2: {top: "80px", left:"135px"},
    3: {top: "200px", left:"50px"}
  };

  [1,2,3].forEach(b => {
    const base = document.createElement("div");
    base.className = "base";
    if (bases[b]) base.classList.add("runner");
    base.style.top = positions[b].top;
    base.style.left = positions[b].left;
    field.appendChild(base);
  });
}

/* =====================
   投球ゾーン
===================== */
function renderZone() {
  const zone = document.getElementById("zone");
  zone.innerHTML = "";

  const pa = gameData.pitches[currentPAIndex];
  if (!pa) return;

  pa.pitches.forEach(p => {
    const cell = document.createElement("div");
    cell.className = "zoneCell " + resultClass(p.result);
    cell.innerText = p.type;
    zone.appendChild(cell);
  });
}

function resultClass(r) {
  if (r === "strike") return "strike";
  if (r === "ball") return "ball";
  if (r === "hit") return "hit";
  if (r === "out") return "out";
  return "";
}

function prevPA() {
  if (currentPAIndex > 0) {
    currentPAIndex--;
    renderZone();
  }
}

function nextPA() {
  if (currentPAIndex < gameData.pitches.length - 1) {
    currentPAIndex++;
    renderZone();
  }
}

/* =====================
   検索
===================== */
function renderFilters() {
  const innings = [...new Set(gameData.pitches.map(p => p.inning))];
  document.getElementById("inningFilter").innerHTML =
    innings.map(i => `<option>${i}</option>`).join("");

  const batters = [...new Set(gameData.pitches.map(p => p.batter))];
  document.getElementById("batterFilter").innerHTML =
    batters.map(b => `<option>${b}</option>`).join("");
}

function filterPitches() {
  const inning = document.getElementById("inningFilter").value;
  const batter = document.getElementById("batterFilter").value;

  const filtered = gameData.pitches.filter(p =>
    p.inning == inning && p.batter == batter
  );

  document.getElementById("filterResult").innerText =
    `${filtered.length} 件`;
}

/* =====================
   投手集計
===================== */
function renderPitcherStats() {
  const all = gameData.pitches.flatMap(p => p.pitches);
  const byType = {};

  all.forEach(p => {
    byType[p.type] = (byType[p.type] || 0) + 1;
  });

  let html = "";
  for (let t in byType) {
    html += `${t}: ${byType[t]}<br>`;
  }

  document.getElementById("pitcherStats").innerHTML = html;
}

/* =====================
   打者集計
===================== */
function renderBatterStats() {
  const all = gameData.pitches;
  const byResult = {};

  all.forEach(pa => {
    byResult[pa.result] = (byResult[pa.result] || 0) + 1;
  });

  let html = "";
  for (let r in byResult) {
    html += `${r}: ${byResult[r]}<br>`;
  }

  document.getElementById("batterStats").innerHTML = html;
}
