// ===============================
// game.js 完全版
// ===============================

let gameData = null;        // 試合データ
let currentPAIndex = 0;     // 現在の打者インデックス
let pitchChart = null;      // Chart.jsオブジェクト

// ===============================
// 初期化
// ===============================
async function init() {
  console.log("init開始");

  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date") || "2026-03-01";
  const team = urlParams.get("team") || "1";

  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", jsonUrl);

  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    gameData = await res.json();
    console.log("データ取得成功");

    currentPAIndex = 0;

    renderAllComponents();

  } catch (err) {
    console.error("データ取得エラー:", err);
    showError(err.message);
  }
}

// ===============================
// エラー表示
// ===============================
function showError(message) {
  const ids = ["summary","scoreboard","homeLineup","awayLineup",
               "field","zone","pitcherStats","batterStats"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div style="color:red; background:#fee; padding:12px; border:1px solid #faa; border-radius:6px;">
      データ読み込み失敗: ${message}
    </div>`;
  });
}

// ===============================
// 描画まとめ
// ===============================
function renderAllComponents() {
  renderSummary();
  renderScoreboard();
  renderLineups();
  renderField();
  renderZone();
  renderPitchLog();
  renderCount();
  renderPitcherStats();
  renderBatterStats();
}

// ===============================
// 試合概要
// ===============================
function renderSummary() {
  if (!gameData?.meta) return;
  const m = gameData.meta;
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.date || "-"}
  `;
}

// ===============================
// スコアボード
// ===============================
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

// ===============================
// ラインナップ
// ===============================
function renderLineups() {
  if (!gameData?.lineups) return;
  renderTeam(gameData.lineups.home, document.getElementById("homeLineup"));
  renderTeam(gameData.lineups.away, document.getElementById("awayLineup"));
}

function renderTeam(players, container) {
  if (!container || !players) return;
  container.innerHTML = "";

  const list = document.createElement("div");
  list.className = "lineup-list";

  players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "lineup-item";
    item.innerHTML = `
      <div class="batting-order">${index+1}</div>
      <div class="position">${player.pos||"-"}</div>
      <div class="player-name">${player.name||"???"}</div>
      <div class="avg">${player.avg||"-"}</div>
    `;
    list.appendChild(item);
  });

  container.appendChild(list);
}

// ===============================
// 投球ログ
// ===============================
function renderPitchLog() {
  const logEl = document.getElementById("pitchLog");
  if (!logEl || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  let html = `<div><strong>${pa.inning}回 ${pa.half==="top"?"表":"裏"} 打者: ${pa.batter_name||"-"}</strong></div>`;

  (pa.pitches||[]).forEach((p,i)=>{
    html += `<div style="font-size:13px;margin-left:10px;">${i+1}球目: ${p.pitch_type} / ${p.result}</div>`;
  });

  logEl.innerHTML = html;
}

// ===============================
// 投球カウント表示
// ===============================
function renderCount() {
  const container = document.getElementById("countDisplay");
  if (!container || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  let balls=0, strikes=0;
  pa.pitches?.forEach(p=>{
    if(p.result==="ball") balls = Math.min(balls+1,3);
    if(p.result==="strike"||p.result==="foul") strikes = Math.min(strikes+1,2);
  });
  if(pa.result==="strikeout") strikes=3;

  const outs = getCurrentInningOuts();

  container.innerHTML = "";
  container.appendChild(createDotRow("B", balls, 3, "ball"));
  container.appendChild(createDotRow("S", strikes, 3, "strike"));
  container.appendChild(createDotRow("O", outs, 3, "out"));
}

function getCurrentInningOuts() {
  if(!gameData?.pitches?.length) return 0;
  const pa = gameData.pitches[currentPAIndex];
  const inning = pa.inning, half=pa.half;
  let outs=0;
  gameData.pitches.forEach((p,i)=>{
    if(i>currentPAIndex) return;
    if(p.inning===inning && p.half===half && (p.result==="out"||p.result==="strikeout")) outs++;
  });
  return Math.min(outs,3);
}

// ドット生成（InvalidCharacterError 修正版）
function createDotRow(label,count,max,type){
  const row = document.createElement("div");
  row.className = "countRow";

  const labelSpan = document.createElement("span");
  labelSpan.className = "countLabel";
  labelSpan.innerText = label;
  row.appendChild(labelSpan);

  for(let i=0;i<max;i++){
    const dot = document.createElement("span");
    dot.className="dot";
    if(i<count){
      dot.classList.add("filled");
      dot.classList.add(type);  // ← スペースではなく個別に追加
    } else {
      dot.classList.add("empty");
    }
    row.appendChild(dot);
  }
  return row;
}

// ===============================
// フィールド
// ===============================
function renderField() {
  const fieldEl = document.getElementById("field");
  if(!fieldEl || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  fieldEl.innerHTML="";

  const posMap = {P:{top:"55%",left:"50%"},C:{top:"85%",left:"50%"}, "1B":{top:"65%",left:"75%"}, "2B":{top:"45%",left:"65%"}, "3B":{top:"65%",left:"25%"}, SS:{top:"45%",left:"35%"}, LF:{top:"20%",left:"25%"}, CF:{top:"10%",left:"50%"}, RF:{top:"20%",left:"75%"}};

  Object.entries(pa.fielders||{}).forEach(([pos,name])=>{
    if(!posMap[pos]) return;
    const div = document.createElement("div");
    div.style.position="absolute";
    div.style.top=posMap[pos].top;
    div.style.left=posMap[pos].left;
    div.style.transform="translate(-50%,-50%)";
    div.style.background="white";
    div.style.color="black";
    div.style.padding="4px 6px";
    div.style.borderRadius="10px";
    div.style.fontSize="12px";
    div.textContent=`${pos} ${name}`;
    fieldEl.appendChild(div);
  });
}

// ===============================
// ストライクゾーン
// ===============================
function renderZone() {
  const zone = document.getElementById("zone");
  if(!zone || !gameData?.pitches?.[currentPAIndex]) return;

  zone.innerHTML="";
  const size=zone.clientWidth;
  const unit=size/5;

  // グリッド
  const grid = document.createElement("div");
  grid.className="zoneGrid";
  for(let y=1;y<=5;y++){
    for(let x=1;x<=5;x++){
      const cell = document.createElement("div");
      if(x>=2 && x<=4 && y>=2 && y<=4) cell.classList.add("strikeZone");
      grid.appendChild(cell);
    }
  }
  zone.appendChild(grid);

  // 投球描画
  const pa=gameData.pitches[currentPAIndex];
  pa.pitches?.forEach((p,i)=>{
    if(!p.zone) return;
    const marker=document.createElement("div");
    marker.className="pitchMarker result-"+p.result;
    const typeSymbol = pitchSymbol(p.pitch_type);
    marker.innerText = `${typeSymbol}${i+1}`;
    const x=Math.max(0,Math.min(5,p.zone.x));
    const y=Math.max(0,Math.min(5,p.zone.y));
    marker.style.left=`${x*unit}px`;
    marker.style.top=`${y*unit}px`;
    zone.appendChild(marker);
  });
}

function pitchSymbol(type){
  switch(type){
    case "fastball": return "F";
    case "slider": return "S";
    case "curve": return "C";
    case "fork": return "K";
    default: return "?";
  }
}

// ===============================
// 投手・打者詳細
// ===============================
function renderPitcherStats(){
  const statsEl=document.getElementById("pitcherStats");
  const canvas=document.getElementById("pitchChart");
  if(!statsEl||!canvas) return;

  const pa=gameData?.pitches?.[currentPAIndex];
  if(!pa?.pitches) return;

  const counts={};
  pa.pitches.forEach(p=>{counts[p.pitch_type]=(counts[p.pitch_type]||0)+1;});

  statsEl.innerHTML=`投球数: ${pa.pitches.length}`;

  const ctx=canvas.getContext("2d");
  if(pitchChart) pitchChart.destroy();

  pitchChart = new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:Object.keys(counts),
      datasets:[{
        data:Object.values(counts),
        backgroundColor:["#4da3ff","#ff7676","#ffd84d","#7cff7c","#c57cff"]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{labels:{color:"white"}}}
    }
  });
}

function renderBatterStats(){
  const allPA=gameData?.pitches||[];
  const byResult={};
  allPA.forEach(pa=>{byResult[pa.result]=(byResult[pa.result]||0)+1;});

  let html="";
  for(let r in byResult) html+=`${r}: ${byResult[r]}<br>`;
  document.getElementById("batterStats").innerHTML=html||"データなし";
}

// ===============================
// 打者切替
// ===============================
function prevPA(){if(currentPAIndex>0){currentPAIndex--; renderAllComponents();}}
function nextPA(){if(currentPAIndex<gameData.pitches.length-1){currentPAIndex++; renderAllComponents();}}

// ===============================
// 起動
// ===============================
window.onload=init;
