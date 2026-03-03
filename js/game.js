async function init() {
  console.log("init開始");
  console.log("location.search 生値:", location.search);

  // search文字列をクリーンアップ
  let search = location.search.replace(/&amp;/g, '&').replace(/^\?/, '');

  let date = "2026-03-01";
  let team = "1";

  // 安全に抽出
  const params = new URLSearchParams(search);
  if (params.has("date")) date = params.get("date");
  if (params.has("team")) team = params.get("team");

  console.log("抽出後 date:", date);
  console.log("抽出後 team:", team);

  // 念のためクリーンアップ（数字だけにする）
  team = team.replace(/[^0-9]/g, '') || "1";
  console.log("最終 team:", team);

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", jsonUrl);

  try {
    const res = await fetch(jsonUrl);
    console.log("fetch結果:", res.status, res.ok ? "成功" : "失敗");

    if (!res.ok) {
      throw new Error(`HTTPエラー ${res.status}`);
    }

    gameData = await res.json();
    console.log("データ取得成功:", gameData.meta);

    renderSummary();
    renderScoreboard();
    // 他のrender呼び出し...

  } catch (err) {
    console.error("エラー:", err);

    const errorMsg = `
      <div style="color:#c62828; background:#ffebee; padding:16px; border:2px solid #ef9a9a; margin:16px; border-radius:8px;">
        <strong>データ読み込み失敗</strong><br>
        ${err.message || "不明なエラー"}<br>
        <small>試したURL: ${jsonUrl}</small>
      </div>`;

    ["summary", "scoreboard", "homeLineup", "awayLineup", "field", "zone", "pitcherStats", "batterStats"]
      .forEach(id => document.getElementById(id)?.innerHTML = errorMsg);
  }
}

// render関数群（変更なしでOK、必要に応じてコピー）
function renderSummary() {
  if (!gameData) return;
  const m = gameData.meta || {};
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.start_time || "-"}<br>
    審判: ${m.umpires?.join(", ") || "-"}
  `;
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

  const awayTotal = totals.away || { R: "-", H: "-", E: "-" };
  html += `<tr><td><strong>${gameData.meta?.away || "Away"}</strong></td>`;
  innings.forEach(() => html += "<td>-</td>");
  html += `<td>${awayTotal.R}</td><td>${awayTotal.H}</td><td>${awayTotal.E}</td></tr>`;

  const homeTotal = totals.home || { R: "-", H: "-", E: "-" };
  html += `<tr><td><strong>${gameData.meta?.home || "Home"}</strong></td>`;
  innings.forEach(() => html += "<td>-</td>");
  html += `<td>${homeTotal.R}</td><td>${homeTotal.H}</td><td>${homeTotal.E}</td></tr>`;

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
