let gameData = null;
let currentPAIndex = 0;
let pitchChart = null;

async function init() {
  console.log("init開始");
  let search = location.search;
  let date = "2026-03-01";
  let team = "1";

  const dateMatch = search.match(/[?&]date=([^&]*)/i);
  const teamMatch = search.match(/[?&]team=([^&]*)/i);

  if (dateMatch?.[1]) date = decodeURIComponent(dateMatch[1]);
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
    renderAll();
  } catch (err) {
    console.error("データ読み込みエラー:", err);
    const errorMsg = `<div style="color:#c62828; background:#ffebee; padding:16px; border:2px solid #ef9a9a; margin:16px; border-radius:8px;">
        <strong>データ読み込み失敗</strong><br>${err.message}</div>`;
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
   描画関数
================================ */

function renderAll() {
  renderSummary();
  renderScoreboard();
  renderLineups();
  renderPitchLog();
  renderZone();
  renderCount();
  renderField();
  renderPitcherStats();
  renderBatterStats();
}

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
  html += `<td>${totals.away?.R ?? "-"}</td><td>${totals.away?.H ?? "-"}</td><td>${totals.away?.E ?? "-"}</td></tr>`;

  html += `<tr><td><strong>${gameData.meta.home}</strong></td>`;
  innings.forEach(i => html += `<td>${i.home ?? "-"}</td>`);
  html += `<td>${totals.home?.R ?? "-"}</td><td>${totals.home?.H ?? "-"}</td><td>${totals.home?.E ?? "-"}</td></tr>`;
  html += "</table>";

  document.getElementById("scoreboard").innerHTML = html;
}

function renderLineups() {
  if (!gameData?.lineups) return;

  const homeEl = document.getElementById("homeLineup");
  const awayEl = document.getElementById("awayLineup");
  if (!homeEl || !awayEl) return;

  homeEl.innerHTML = "";
  awayEl.innerHTML = "";

  function renderTeam(players, container) {
    const list = document.createElement("div");
    list.className = "lineup-list";
    players.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "lineup-item";
      item.innerHTML = `
        <div class="batting-order">${idx + 1}</div>
        <div class="position">${p.pos || "-"}</div>
        <div class="player-name">${p.name}</div>
        <div class="avg">${p.avg || "-"}</div>
      `;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  renderTeam(gameData.lineups.home, homeEl);
  renderTeam(gameData.lineups.away, awayEl);
}

/* ===============================
   投球・打席系
================================ */

function renderPitchLog() {
  const logEl = document.getElementById("pitchLog");
  if (!logEl || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  let html = `<div><strong>${pa.inning}回 ${pa.half==="top"?"表":"裏"} 打者: ${pa.batter_name||"-"}</strong></div>`;
  (pa.pitches||[]).forEach((p,i)=>{
    html += `<div style="font-size:13px; margin-left:10px;">${i+1}球目：${p.pitch_type} / ${p.result}</div>`;
  });
  logEl.innerHTML = html;
}

function renderZone() {
  const zone = document.getElementById("zone");
  if (!zone || !gameData?.pitches?.[currentPAIndex]) return;
  zone.innerHTML = "";

  const size = zone.clientWidth;
  const unit = size / 5;

  const grid = document.createElement("div");
  grid.className = "zoneGrid";
  for (let y=1;y<=5;y++){
    for (let x=1;x<=5;x++){
      const cell=document.createElement("div");
      if(x>=2 && x<=4 && y>=2 && y<=4) cell.classList.add("strikeZone");
      grid.appendChild(cell);
    }
  }
  zone.appendChild(grid);

  const pa = gameData.pitches[currentPAIndex];
  (pa.pitches||[]).forEach((p,i)=>{
    if(!p.zone) return;
    const marker = document.createElement("div");
    marker.className = "pitchMarker result-"+p.result;
    marker.innerText = pitchSymbol(p.pitch_type) + (i+1);

    const x = Math.max(0,Math.min(5,p.zone.x));
    const y = Math.max(0,Math.min(5,p.zone.y));
    marker.style.left = `${x*unit}px`;
    marker.style.top = `${y*unit}px`;
    zone.appendChild(marker);
  });
}

function renderCount() {
  const container = document.getElementById("countDisplay");
  if (!container || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  let balls=0,strikes=0;
  (pa.pitches||[]).forEach(p=>{
    if(p.result==="ball" && balls<3) balls++;
    if((p.result==="strike"||p.result==="foul") && strikes<2) strikes++;
  });
  if(pa.result==="strikeout") strikes=3;
  const outs = getCurrentInningOuts();

  container.innerHTML="";
  container.appendChild(createCountRow("B",balls,3,"ball"));
  container.appendChild(createCountRow("S",strikes,3,"strike"));
  container.appendChild(createCountRow("O",outs,3,"out"));
}

function getCurrentInningOuts(){
  if(!gameData?.pitches?.length) return 0;
  const currentPA = gameData.pitches[currentPAIndex];
  let outs=0;
  gameData.pitches.forEach((pa,i)=>{
    if(i>currentPAIndex) return;
    if(pa.inning===currentPA.inning && pa.half===currentPA.half){
      if(pa.result==="out" || pa.result==="strikeout") outs++;
    }
  });
  return Math.min(outs,3);
}

function createCountRow(label,count,max,type){
  const row=document.createElement("div");
  row.className="countRow";
  const labelSpan=document.createElement("span");
  labelSpan.className="countLabel";
  labelSpan.innerText=label;
  row.appendChild(labelSpan);
  for(let i=0;i<max;i++){
    const dot=document.createElement("span");
    dot.className="dot "+(i<count?`filled ${type}`:"empty");
    row.appendChild(dot);
  }
  return row;
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

/* ===============================
   フィールド表示
================================ */

function renderField() {
  const fieldEl = document.getElementById("field");
  if(!fieldEl || !gameData?.pitches?.[currentPAIndex]) return;
  fieldEl.innerHTML="";
  const pa = gameData.pitches[currentPAIndex];
  if(!pa.fielders) {fieldEl.innerHTML="守備情報なし"; return;}
  const positions = {
    P:{top:"55%",left:"50%"},C:{top:"85%",left:"50%"}, "1B":{top:"65%",left:"75%"},
    "2B":{top:"45%",left:"65%"},"3B":{top:"65%",left:"25%"},SS:{top:"45%",left:"35%"},
    LF:{top:"20%",left:"25%"},CF:{top:"10%",left:"50%"},RF:{top:"20%",left:"75%"}
  };
  Object.entries(pa.fielders).forEach(([pos,name])=>{
    if(!positions[pos]) return;
    const div=document.createElement("div");
    div.className="fielder";
    div.style.position="absolute";
    div.style.top=positions[pos].top;
    div.style.left=positions[pos].left;
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

/* ===============================
   前打者／次打者
================================ */

function prevPA(){if(currentPAIndex>0){currentPAIndex--; renderAll();}}
function nextPA(){if(gameData && currentPAIndex<gameData.pitches.length-1){currentPAIndex++; renderAll();}}

/* ===============================
   統計
================================ */

function renderPitcherStats(){
  const statsEl=document.getElementById("pitcherStats");
  const canvas=document.getElementById("pitchChart");
  if(!statsEl || !canvas || !gameData?.pitches?.[currentPAIndex]) return;

  const pa = gameData.pitches[currentPAIndex];
  const counts = {};
  (pa.pitches||[]).forEach(p=>{
    counts[p.pitch_type]=(counts[p.pitch_type]||0)+1;
  });

  statsEl.innerHTML=`投球数: ${pa.pitches.length}`;
  const ctx=canvas.getContext("2d");
  if(pitchChart) pitchChart.destroy();

  pitchChart=new Chart(ctx,{
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
  const allPA = gameData?.pitches || [];
  const byResult = {};
  allPA.forEach(pa=>{byResult[pa.result]=(byResult[pa.result]||0)+1;});
  let html="";
  for(let r in byResult) html+=`${r}: ${byResult[r]}<br>`;
  document.getElementById("batterStats").innerHTML=html||"データなし";
}

window.onload = init;
