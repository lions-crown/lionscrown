let gameData;
let currentPAIndex = 0;

window.addEventListener("DOMContentLoaded", init);

let gameData;
let currentPAIndex = 0;

window.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(location.search);
  const date = params.get("date") || "2026-03-01";  // デフォルト値で安全
  let team = params.get("team");

  // teamがnull/undefined/空文字列の場合、デフォルト'1'を使う
  if (!team || team === "null") {
    team = "1";
    console.warn("teamパラメータが取得できなかったため、デフォルト'1'を使用します");
  }

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch開始:", jsonUrl);
  console.log("使用したパラメータ → date:", date, "team:", team);

  try {
    const res = await fetch(jsonUrl);
    console.log("HTTPステータス:", res.status, res.ok);

    if (!res.ok) {
      throw new Error(`HTTPエラー: ${res.status} ${res.statusText}`);
    }

    const rawText = await res.text();
    console.log("生のレスポンス本文（最初の200文字）:", rawText.substring(0, 200));

    gameData = JSON.parse(rawText);
    console.log("gameData全体:", gameData);
    console.log("gameData.scoreboard:", gameData.scoreboard);

    renderSummary();
    renderScoreboard();
    renderLineups();
    renderField();
    renderZone();
    renderFilters();
    renderPitcherStats();
    renderBatterStats();

  } catch (err) {
    console.error("データ読み込みエラー:", err);

    const errorHtml = `
      <div style="color:red; padding:1em; border:2px solid red; margin:1em; background:#ffebee;">
        <strong>データ読み込みに失敗しました</strong><br>
        ${err.message}<br>
        <small>URLを確認してください: ${jsonUrl}</small>
      </div>`;

    const summaryEl = document.getElementById("summary");
    const scoreboardEl = document.getElementById("scoreboard");

    if (summaryEl) summaryEl.innerHTML = errorHtml;
    if (scoreboardEl) scoreboardEl.innerHTML = errorHtml;
  }
}

/* =====================
   試合概要
===================== */
function renderSummary() {
  const m = gameData?.meta || {};
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.start_time || "-"}<br>
    審判: ${m.umpires?.join(", ") || "-"}
  `;
}

/* =====================
   スコアボード
===================== */
function renderScoreboard() {
  if (!gameData?.scoreboard) {
    document.getElementById("scoreboard").innerHTML = 
      "<p style='color:#d32f2f; font-weight:bold;'>スコアデータがありません</p>";
    return;
  }

  const sb = gameData.scoreboard;
  const innings = sb.innings || [];
  const totals = sb.total || { away: {}, home: {} };

  let html = '<table border="1" style="border-collapse: collapse; text-align: center; margin: 10px auto; font-size: 14px;">';
  html += '<tr><th></th>';

  innings.forEach(inningObj => {
    html += `<th>${inningObj.inning || "?"}</th>`;
  });
  html += '<th>R</th><th>H</th><th>E</th></tr>';

  // away
  const awayTotal = totals.away || { R: "-", H: "-", E: "-" };
  html += `<tr><td><strong>${gameData.meta?.away || "Away"}</strong></td>`;
  innings.forEach(() => html += "<td>-</td>");
  html += `<td>${awayTotal.R}</td><td>${awayTotal.H}</td><td>${awayTotal.E}</td></tr>`;

  // home
  const homeTotal = totals.home || { R: "-", H: "-", E: "-" };
  html += `<tr><td><strong>${gameData.meta?.home || "Home"}</strong></td>`;
  innings.forEach(() => html += "<td>-</td>");
  html += `<td>${homeTotal.R}</td><td>${homeTotal.H}</td><td>${homeTotal.E}</td></tr>`;

  html += "</table>";
  document.getElementById("scoreboard").innerHTML = html;
}

/* =====================
   オーダー（lineupsがない場合のフォールバック）
===================== */
function renderLineups() {
  const home = gameData?.lineups?.home || [];
  const away = gameData?.lineups?.away || [];

  document.getElementById("homeLineup").innerHTML = renderPlayers(home);
  document.getElementById("awayLineup").innerHTML = renderPlayers(away);
}

function renderPlayers(players) {
  if (!players?.length) return "<div style='color:#777;'>データなし</div>";
  return players.map(p => `
    <div style="margin:4px 0;">
      <a href="player_detail.html?id=${p.id || ''}" style="text-decoration:none; color:#1976d2;">
        ${p.name || "???"}
      </a>
      (${p.avg || p.era || "-"})
    </div>
  `).join("");
}

/* =====================
   守備・塁状況
===================== */
function renderField() {
  const field = document.getElementById("field");
  if (!field) return;
  field.innerHTML = "";

  const bases = gameData?.current_state?.bases || {};

  const positions = {
    1: { top: "200px", left: "220px" },
    2: { top: "80px",  left: "135px" },
    3: { top: "200px", left: "50px" }
  };

  [1, 2, 3].forEach(b => {
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
  if (!zone) return;
  zone.innerHTML = "";

  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa?.pitches) return;

  pa.pitches.forEach(p => {
    const cell = document.createElement("div");
    cell.className = "zoneCell " + (resultClass(p.result) || "");
    cell.innerText = p.type || "?";
    zone.appendChild(cell);
  });
}

function resultClass(r) {
  if (r === "strike") return "strike";
  if (r === "ball")   return "ball";
  if (r === "hit")    return "hit";
  if (r === "out")    return "out";
  return "";
}

function prevPA() {
  if (currentPAIndex > 0) {
    currentPAIndex--;
    renderZone();
  }
}

function nextPA() {
  if (currentPAIndex < (gameData?.pitches?.length - 1 || 0)) {
    currentPAIndex++;
    renderZone();
  }
}

/* =====================
   投球検索
===================== */
function renderFilters() {
  const pitches = gameData?.pitches || [];
  const innings = [...new Set(pitches.map(p => p.inning).filter(Boolean))];
  document.getElementById("inningFilter").innerHTML =
    innings.map(i => `<option>${i}</option>`).join("") || "<option>なし</option>";

  const batters = [...new Set(pitches.map(p => p.batter).filter(Boolean))];
  document.getElementById("batterFilter").innerHTML =
    batters.map(b => `<option>${b}</option>`).join("") || "<option>なし</option>";
}

function filterPitches() {
  const inning = document.getElementById("inningFilter")?.value;
  const batter = document.getElementById("batterFilter")?.value;
  if (!inning || !batter) return;

  const filtered = (gameData?.pitches || []).filter(p =>
    String(p.inning) === inning && p.batter === batter
  );

  document.getElementById("filterResult").innerText = `${filtered.length} 件`;
}

/* =====================
   投手集計
===================== */
function renderPitcherStats() {
  const allPitches = (gameData?.pitches || []).flatMap(p => p.pitches || []);
  const byType = {};
  allPitches.forEach(p => {
    const t = p.type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  });

  let html = "";
  for (let t in byType) {
    html += `${t}: ${byType[t]}<br>`;
  }
  document.getElementById("pitcherStats").innerHTML = html || "データなし";
}

/* =====================
   打者集計
===================== */
function renderBatterStats() {
  const all = gameData?.pitches || [];
  const byResult = {};
  all.forEach(pa => {
    const r = pa.result || "unknown";
    byResult[r] = (byResult[r] || 0) + 1;
  });

  let html = "";
  for (let r in byResult) {
    html += `${r}: ${byResult[r]}<br>`;
  }
  document.getElementById("batterStats").innerHTML = html || "データなし";
}
