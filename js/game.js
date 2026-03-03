let gameData = null; // グローバル変数として宣言
let currentPAIndex = 0; // 初期化

async function init() {
  console.log("init開始");
  console.log("location.search 生値:", location.search);

  let search = location.search.replace(/&/g, '&');
  let date = "2026-03-01";
  let team = "1";  // 絶対に「1」にする

  const dateMatch = search.match(/[?&]date=([^&]*)/i);
  const teamMatch = search.match(/[?&]team=([^&]*)/i);

  if (dateMatch && dateMatch[1]) {
    date = decodeURIComponent(dateMatch[1]);
  }

  if (teamMatch && teamMatch[1]) {
    let rawTeam = decodeURIComponent(teamMatch[1]);
    console.log("抽出された生の team 値:", rawTeam);

    const digits = rawTeam.match(/\d+/g) || [];
    if (digits.length > 0) {
      team = digits.join('').charAt(0);  // 最初の1桁を取得
      console.log("数字抽出後 team:", team);
    } else {
      console.warn("teamに数字が見つからなかった → デフォルト '1'");
    }
  } else {
    console.warn("teamMatch が取れなかった → デフォルト '1'");
  }

  if (!team || team.length > 1 || !/^\d$/.test(team)) {
    team = "1";  // 最終的に「1」に強制
    console.warn("最終保険発動 → team を '1' に強制修正");
  }

  console.log("最終決定 team:", team);

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", jsonUrl);

  try {
    const res = await fetch(jsonUrl);
    console.log("fetch結果:", res.status, res.ok ? "成功" : "失敗", "実際のURL:", res.url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    gameData = await res.json(); // グローバル変数に格納
    console.log("データ取得成功:", gameData.meta);

    renderSummary();
    renderScoreboard();
    renderLineups();
    renderField();
    renderZone();
    renderFilters();
    renderPitcherStats();
    renderBatterStats();

    console.log("描画完了");

  } catch (err) {
    console.error("エラー:", err);

    const errorMsg = `
      <div style="color:#c62828; background:#ffebee; padding:16px; border:2px solid #ef9a9a; margin:16px; border-radius:8px;">
        <strong>データ読み込み失敗</strong>
        ${err.message || "不明なエラー"}
        <small>試したURL: ${jsonUrl}
コンソール(F12)を確認してください</small>
      </div>`;

    ["summary", "scoreboard", "homeLineup", "awayLineup", "field", "zone", "pitcherStats", "batterStats"]
      .forEach(id => document.getElementById(id)?.innerHTML = errorMsg);
  }
}

// render関数群
function renderSummary() {
  if (!gameData) return;
  const m = gameData.meta || {};
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}

    球場: ${m.stadium || "-"}

    開始: ${m.date || "-"}

    審判: ${m.umpires?.join(", ") || "-"}
  `;
}

function renderScoreboard() {
  if (!gameData?.scoreboard) return;

  const sb = gameData.scoreboard;
  const innings = sb.innings || [];
  const totals = sb.total || {};

  let html = '<table border="1" style="border-collapse:collapse; text-align:center; margin:10px auto;">';
  html += '<tr><th></th>';

  innings.forEach(i => html += `<th>${i.inning}</th>`);
  html += '<th>R</th><th>H</th><th>E</th></tr>';

  html += `<tr><td><strong>${gameData.meta.away}</strong></td>`;
  innings.forEach(i => html += `<td>${i.away ?? "-"}</td>`);
  html += `<td>${totals.away?.R ?? "-"}</td>
           <td>${totals.away?.H ?? "-"}</td>
           <td>${totals.away?.E ?? "-"}</td></tr>`;

  html += `<tr><td><strong>${gameData.meta.home}</strong></td>`;
  innings.forEach(i => html += `<td>${i.home ?? "-"}</td>`);
  html += `<td>${totals.home?.R ?? "-"}</td>
           <td>${totals.home?.H ?? "-"}</td>
           <td>${totals.home?.E ?? "-"}</td></tr>`;

  html += "</table>";

  document.getElementById("scoreboard").innerHTML = html;
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

  const pa = gameData?.pitches?.[currentPAIndex];
  const basesStr = pa?.bases || "000";

  const positions = {
    1: { top: "200px", left: "220px" },
    2: { top: "80px", left: "135px" },
    3: { top: "200px", left: "50px" }
  };

  [1,2,3].forEach((b, i) => {
    const base = document.createElement("div");
    base.className = "base";
    if (basesStr[i] === "1") base.classList.add("runner");

    base.style.position = "absolute";
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
    cell.innerText = p.pitch_type;

    // 3×3ゾーン想定
    if (p.zone) {
      cell.style.position = "absolute";
      cell.style.left = `${(p.zone.x - 1) * 60}px`;
      cell.style.top = `${(p.zone.y - 1) * 60}px`;
    }

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

  const batters = [...new Set(pitches.map(p => p.batter_id).filter(Boolean))];  // batter_idに変更
  document.getElementById("batterFilter").innerHTML =
    batters.map(b => `<option>${b}</option>`).join("") || "<option>なし</option>";
}

function filterPitches() {
  const inning = document.getElementById("inningFilter")?.value;
  const batter = document.getElementById("batterFilter")?.value;
  if (!inning || !batter) return;
  const filtered = (gameData?.pitches || []).filter(p =>
    String(p.inning) === inning && p.batter_id === batter  // batter_idに変更
  );
  document.getElementById("filterResult").innerText = `${filtered.length} 件`;
}

function renderPitcherStats() {
  const allPitches = (gameData?.pitches || []).flatMap(pa => pa.pitches || []);
  const byType = {};

  allPitches.forEach(p => {
    byType[p.pitch_type] = (byType[p.pitch_type] || 0) + 1;
  });

  let html = "";
  for (let t in byType) {
    html += `${t}: ${byType[t]}<br>`;
  }

  document.getElementById("pitcherStats").innerHTML = html || "データなし";
}

function renderBatterStats() {
  const allPA = gameData?.pitches || [];
  const byResult = {};

  allPA.forEach(pa => {
    byResult[pa.result] = (byResult[pa.result] || 0) + 1;
  });

  let html = "";
  for (let r in byResult) {
    html += `${r}: ${byResult[r]}<br>`;
  }

  document.getElementById("batterStats").innerHTML = html || "データなし";
}

// ページが読み込まれた際にinit関数を呼び出す
window.onload = init;
