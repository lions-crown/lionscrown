let gameData;
let currentPAIndex = 0;

window.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(location.search);
  const date = params.get("date");
  const team = params.get("team");

  try {
    const res = await fetch(`live/${date}_${team}.json`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    gameData = await res.json();

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
    document.getElementById("scoreboard").innerHTML = 
      `<div style="color:red; padding:1em;">データ読み込みに失敗しました<br>${err.message}</div>`;
  }
}

/* =====================
   試合概要
===================== */
function renderSummary() {
  const m = gameData.meta || {};
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.start_time || "-"}<br>
    審判: ${m.umpires?.join(", ") || "-"}
  `;
}

/* =====================
   スコアボード   ← ここを現在のJSONに合わせました
===================== */
function renderScoreboard() {
  const sb = gameData.scoreboard || {};
  const innings = sb.innings || [];
  const total = sb.total || { home: {}, away: {} };

  let html = "<table><tr><th></th>";

  // イニング番号を表示（オブジェクトから inning キーを使う）
  innings.forEach(i => {
    html += `<th>${i.inning || "?"}</th>`;
  });
  html += "<th>R</th><th>H</th><th>E</th></tr>";

  // away と home を処理
  ["away", "home"].forEach(side => {
    const teamTotal = total[side] || { R: "-", H: "-", E: "-" };
    const teamName = side === "away" ? (gameData.meta?.away || "Away") : (gameData.meta?.home || "Home");

    html += `<tr><td>${teamName}</td>`;

    // イニングごとの得点（今のJSONには詳細がないので仮で "-" 表示）
    innings.forEach(() => {
      html += "<td>-</td>";  // ← 将来 runs が追加されたらここを修正
    });

    html += `
      <td>${teamTotal.R ?? "-"}</td>
      <td>${teamTotal.H ?? "-"}</td>
      <td>${teamTotal.E ?? "-"}</td>
    </tr>`;
  });

  html += "</table>";
  document.getElementById("scoreboard").innerHTML = html;
}

/* =====================
   オーダー（今のJSONに lineups がないので仮実装）
===================== */
function renderLineups() {
  // JSONに lineups がまだない場合のフォールバック
  const home = gameData.lineups?.home || [];
  const away = gameData.lineups?.away || [];

  document.getElementById("homeLineup").innerHTML = renderPlayers(home);
  document.getElementById("awayLineup").innerHTML = renderPlayers(away);
}

function renderPlayers(players) {
  if (!players.length) return "<div>データなし</div>";
  return players.map(p => `
    <div>
      <a href="player_detail.html?id=${p.id || ''}">
        ${p.name || "???"}
      </a>
      (${p.avg || p.era || "-"})
    </div>
  `).join("");
}

// 以下は変更なし（必要に応じて ?. ガードを追加しています）

function renderField() {
  const field = document.getElementById("field");
  field.innerHTML = "";

  const bases = gameData.current_state?.bases || {};

  const positions = {
    1: {top: "200px", left: "220px"},
    2: {top: "80px",  left: "135px"},
    3: {top: "200px", left: "50px"}
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

function renderZone() {
  const zone = document.getElementById("zone");
  zone.innerHTML = "";

  const pa = gameData.pitches?.[currentPAIndex];
  if (!pa || !pa.pitches) return;

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
  if (currentPAIndex < (gameData.pitches?.length - 1 || 0)) {
    currentPAIndex++;
    renderZone();
  }
}

function renderFilters() {
  const pitches = gameData.pitches || [];
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

  const filtered = (gameData.pitches || []).filter(p =>
    String(p.inning) === inning && p.batter === batter
  );

  document.getElementById("filterResult").innerText = `${filtered.length} 件`;
}

function renderPitcherStats() {
  const allPitches = (gameData.pitches || []).flatMap(p => p.pitches || []);
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

function renderBatterStats() {
  const all = gameData.pitches || [];
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
