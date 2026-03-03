async function init() {
  console.log("init開始");
  console.log("location.search 生値:", location.search);

  let search = location.search;
  let date = "2026-03-01";
  let team = "1";

  const dateMatch = search.match(/[?&]date=([^&]*)/i);
  const teamMatch = search.match(/[?&]team=([^&]*)/i);

  if (dateMatch?.[1]) {
    date = decodeURIComponent(dateMatch[1]);
  }

  if (teamMatch?.[1]) {
    const rawTeam = decodeURIComponent(teamMatch[1]);
    const digits = rawTeam.match(/\d+/);
    if (digits) team = digits[0].charAt(0);
  }

  if (!/^\d$/.test(team)) team = "1";

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", jsonUrl);

  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    gameData = await res.json();
    console.log("データ取得成功");

    currentPAIndex = 0;

    // 🔥 初期表示はこれだけでOK
    renderSummary();
    renderScoreboard();
    renderLineups();
    renderField();
    renderFilters();
    renderPitcherStats();
    renderBatterStats();

    // 打席系はまとめて
    renderAll();

    console.log("描画完了");

  } catch (err) {
    console.error("エラー:", err);

    const errorMsg = `
      <div style="color:#c62828; background:#ffebee; padding:16px; border:2px solid #ef9a9a; margin:16px; border-radius:8px;">
        <strong>データ読み込み失敗</strong><br>
        ${err.message}
      </div>`;

    [
      "summary","scoreboard","homeLineup","awayLineup",
      "field","zone","pitcherStats","batterStats"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = errorMsg;
    });
  }
}

/* ===============================
   表示系
================================ */

function renderSummary() {
  if (!gameData) return;
  const m = gameData.meta || {};
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.date || "-"}
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
  if (!players.length) return "<div style='color:#777;'>データなし</div>";
  return players.map(p => `
    <div style="margin:4px 0;">
      <a href="player_detail.html?id=${p.id || ''}" style="text-decoration:none; color:#1976d2;">
        ${p.name || "???"}
      </a>
      (${p.avg || p.era || "-"})
    </div>
  `).join("");
}

/* ===============================
   打席・フィールド
================================ */

function renderField() {
  const fieldEl = document.getElementById("field");
  if (!fieldEl) return;

  fieldEl.innerHTML = "";

  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa?.fielders) return;

  // 守備位置マッピング（％指定）
  const positions = {
    "P":  { top: "55%", left: "50%" },
    "C":  { top: "85%", left: "50%" },
    "1B": { top: "65%", left: "75%" },
    "2B": { top: "45%", left: "65%" },
    "3B": { top: "65%", left: "25%" },
    "SS": { top: "45%", left: "35%" },
    "LF": { top: "20%", left: "25%" },
    "CF": { top: "10%", left: "50%" },
    "RF": { top: "20%", left: "75%" }
  };

  Object.entries(pa.fielders).forEach(([pos, name]) => {
    if (!positions[pos]) return;

    const div = document.createElement("div");
    div.className = "fielder";
    div.style.top = positions[pos].top;
    div.style.left = positions[pos].left;
    div.textContent = `${pos} ${name}`;
    fieldEl.appendChild(div);
  });
}

function renderZone() {
  const zone = document.getElementById("zone");
  if (!zone) return;

  zone.innerHTML = "";

  const size = zone.clientWidth;      // 実際の描画サイズ
  const unit = size / 5;              // 1グリッド単位

  // ===== グリッド描画 =====
  const grid = document.createElement("div");
  grid.className = "zoneGrid";

  for (let y = 1; y <= 5; y++) {
    for (let x = 1; x <= 5; x++) {
      const cell = document.createElement("div");
      if (x >= 2 && x <= 4 && y >= 2 && y <= 4) {
        cell.classList.add("strikeZone");
      }
      grid.appendChild(cell);
    }
  }

  zone.appendChild(grid);

  // ===== 投球描画 =====
  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa?.pitches) return;

  pa.pitches.forEach((p, index) => {
    if (!p.zone) return;

    const marker = document.createElement("div");
    marker.className = "pitchMarker result-" + p.result;

    const typeSymbol = pitchSymbol(p.pitch_type);
    marker.innerText = `${typeSymbol}${index + 1}`;

    // ===== ここがミリ単位制御 =====
    const x = Math.max(0, Math.min(5, p.zone.x));
    const y = Math.max(0, Math.min(5, p.zone.y));

    marker.style.left = `${x * unit}px`;
    marker.style.top  = `${y * unit}px`;

    zone.appendChild(marker);
  });
}

function renderPitchLog() {
  const logEl = document.getElementById("pitchLog");
  if (!logEl) return;

  logEl.innerHTML = "";

  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa) return;

  let html = `<div><strong>
    ${pa.inning}回 ${pa.half === "top" ? "表" : "裏"}
    打者: ${pa.batter_name || pa.batter_id || "-"}
  </strong></div>`;

  (pa.pitches || []).forEach((p, i) => {
    html += `
      <div style="font-size:13px; margin-left:10px;">
        ${i + 1}球目：
        ${p.pitch_type} / ${p.result}
      </div>
    `;
  });

  logEl.innerHTML = html;
}

function renderCount() {
  const container = document.getElementById("countDisplay");
  if (!container) return;

  container.innerHTML = "";

  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa || !pa.pitches) return;

  let balls = 0;
  let strikes = 0;

  // ===== 球ごとのカウント計算 =====
  pa.pitches.forEach(p => {

    if (p.result === "ball") {
      if (balls < 3) balls++;
    }

    if (p.result === "strike") {
      if (strikes < 2) strikes++;
    }

    if (p.result === "foul") {
      if (strikes < 2) strikes++;
    }

  });

  // 三振なら3表示
  if (pa.result === "strikeout") {
    strikes = 3;
  }

  // ===== 通算アウト取得（再代入しない） =====
  let outs = getCurrentInningOuts();  // ← let にする

  container.appendChild(createCountRow("B", balls, 3, "ball"));
  container.appendChild(createCountRow("S", strikes, 3, "strike"));
  container.appendChild(createCountRow("O", outs, 3, "out"));
}

function getCurrentInningOuts() {
  if (!gameData?.pitches?.length) return 0;

  const currentPA = gameData.pitches[currentPAIndex];
  if (!currentPA) return 0;

  const inning = currentPA.inning;
  const half = currentPA.half;

  let outs = 0;

  gameData.pitches.forEach((pa, index) => {
    if (!pa) return;
    if (index > currentPAIndex) return;

    if (pa.inning === inning && pa.half === half) {
      if (pa.result === "out" || pa.result === "strikeout") {
        outs++;
      }
    }
  });

  return Math.min(outs, 3);
}

function createCountRow(label, count, max, type) {
  const row = document.createElement("div");
  row.className = "countRow";

  const labelSpan = document.createElement("span");
  labelSpan.className = "countLabel";
  labelSpan.innerText = label;

  row.appendChild(labelSpan);

  for (let i = 0; i < max; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";

    if (i < count) {
      dot.classList.add("filled", type);
    } else {
      dot.classList.add("empty");
    }

    row.appendChild(dot);
  }

  return row;
}


function pitchSymbol(type) {
  switch (type) {
    case "fastball": return "F";
    case "slider": return "S";
    case "curve": return "C";
    case "fork": return "K";
    default: return "?";
  }
}

function resultClass(r) {
  if (r === "strike") return "strike";
  if (r === "ball") return "ball";
  if (r === "hit") return "hit";
  if (r === "out") return "out";
  return "";
}

function renderAll() {
  renderPitchLog();
  renderZone();
  renderCount();
  renderField();
}

function prevPA() {
  console.log("before:", currentPAIndex);
  if (currentPAIndex > 0) {
    currentPAIndex--;
    console.log("after:", currentPAIndex);
    renderAll();
  }
}

function nextPA() {
  if (currentPAIndex < gameData.pitches.length - 1) {
    currentPAIndex++;
    renderAll();
  }
}

/* ===============================
   フィルター
================================ */

function renderFilters() {
  const pitches = gameData?.pitches || [];
  const innings = [...new Set(pitches.map(p => p.inning).filter(Boolean))];

  const inningEl = document.getElementById("inningFilter");
  if (inningEl)
    inningEl.innerHTML =
      innings.map(i => `<option>${i}</option>`).join("") || "<option>なし</option>";

  const batters = [...new Set(pitches.map(p => p.batter_id).filter(Boolean))];

  const batterEl = document.getElementById("batterFilter");
  if (batterEl)
    batterEl.innerHTML =
      batters.map(b => `<option>${b}</option>`).join("") || "<option>なし</option>";
}

function filterPitches() {
  const inning = document.getElementById("inningFilter")?.value;
  const batter = document.getElementById("batterFilter")?.value;
  if (!inning || !batter) return;

  const filtered = (gameData?.pitches || []).filter(p =>
    String(p.inning) === inning && p.batter_id === batter
  );

  document.getElementById("filterResult").innerText = `${filtered.length} 件`;
}

/* ===============================
   統計
================================ */

let pitchChart = null;

function renderPitcherStats() {
  const statsEl = document.getElementById("pitcherStats");
  const canvas = document.getElementById("pitchChart");
  if (!statsEl || !canvas) return;

  const pa = gameData?.pitches?.[currentPAIndex];
  if (!pa?.pitches) return;

  // 球種カウント
  const counts = {};
  pa.pitches.forEach(p => {
    counts[p.pitch_type] = (counts[p.pitch_type] || 0) + 1;
  });

  statsEl.innerHTML = `
    投球数: ${pa.pitches.length}
  `;

  const ctx = canvas.getContext("2d");

  if (pitchChart) pitchChart.destroy();

  pitchChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: [
          "#4da3ff",
          "#ff7676",
          "#ffd84d",
          "#7cff7c",
          "#c57cff"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      }
    }
  });
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

window.onload = init;
