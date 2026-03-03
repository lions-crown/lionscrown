// 変数宣言はファイル先頭に1回だけ（これで再宣言エラー防止）
let gameData = null;  // nullで初期化（undefinedより扱いやすい）
let currentPAIndex = 0;

console.log("game.js が読み込まれました");  // 読み込み確認ログ

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded 発火");
  init();
});

async function init() {
  console.log("init() 開始");

  const params = new URLSearchParams(location.search);
  console.log("クエリパラメータ:", location.search);

  const date = params.get("date") || "2026-03-01";
  let team = params.get("team");

  if (!team || team === "null" || team.trim() === "") {
    team = "1";
    console.warn("team が取得できなかったため、デフォルト '1' を使用");
  }

  console.log("使用パラメータ:", { date, team });

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", jsonUrl);

  try {
    const res = await fetch(jsonUrl);
    console.log("fetch レスポンス:", res.status, res.ok, res.statusText);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const rawText = await res.text();
    console.log("レスポンス先頭:", rawText.substring(0, 200));

    gameData = JSON.parse(rawText);
    console.log("gameData セット完了:", !!gameData, gameData.meta);

    // 描画呼び出し
    renderSummary();
    renderScoreboard();
    renderLineups();
    renderField();
    renderZone();
    renderFilters();
    renderPitcherStats();
    renderBatterStats();

    console.log("全render完了");

  } catch (err) {
    console.error("エラー詳細:", err);

    const errorHtml = `
      <div style="color:#c62828; background:#ffebee; padding:16px; border:2px solid #ef9a9a; margin:16px; border-radius:8px;">
        <strong>データ読み込みに失敗しました</strong><br>
        ${err.message || err}<br>
        <small>URL: ${jsonUrl}<br>コンソール(F12)を確認してください</small>
      </div>`;

    // 可能な限り多くのセクションにエラーを表示
    ["summary", "scoreboard", "homeLineup", "awayLineup", "field", "zone", "pitcherStats", "batterStats"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = errorHtml;
    });

    // filterResult にも
    const filterEl = document.getElementById("filterResult");
    if (filterEl) filterEl.innerText = "エラー発生";
  }
}

// render関数群（変更なしだが安全ガード強化）
function renderSummary() {
  if (!gameData) return;
  const m = gameData.meta || {};
  const el = document.getElementById("summary");
  if (el) {
    el.innerHTML = `
      ${m.home || "?"} vs ${m.away || "?"}<br>
      球場: ${m.stadium || "-"}<br>
      開始: ${m.start_time || "-"}<br>
      審判: ${m.umpires?.join(", ") || "-"}
    `;
  }
}

function renderScoreboard() {
  if (!gameData?.scoreboard) return;

  const sb = gameData.scoreboard;
  const innings = sb.innings || [];
  const totals = sb.total || { away: {}, home: {} };

  let html = '<table border="1" style="border-collapse:collapse; text-align:center; margin:10px auto; font-size:14px;">';
  html += '<tr><th></th>';
  innings.forEach(i => html += `<th>${i.inning || "?"}</th>`);
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

  const el = document.getElementById("scoreboard");
  if (el) el.innerHTML = html;
}


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

function renderField() {
  const field = document.getElementById("field");
  if (!field) return;
  field.innerHTML = "";
  const bases = gameData?.current_state?.bases || {};
  const positions = {
    1: { top: "200px", left: "220px" },
    2: { top: "80px", left: "135px" },
    3: { top: "200px", left: "50px" }
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
  if (currentPAIndex < (gameData?.pitches?.length - 1 || 0)) {
    currentPAIndex++;
    renderZone();
  }
}

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
