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
    const digits = decodeURIComponent(teamMatch[1]).match(/\d+/);
    if (digits) team = digits[0].charAt(0);
  }
  if (!/^\d$/.test(team)) team = "1";

  const url = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;
  console.log("fetch URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    gameData = await res.json();
    console.log("データ取得成功", gameData);

    renderAllComponents();
  } catch (err) {
    console.error(err);
    ["summary","scoreboard","homeLineup","awayLineup","field","zone","pitcherStats","batterStats"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = `<div style="color:#f00;">データ読み込み失敗<br>${err.message}</div>`;
    });
  }
}

/* =========================
   描画系まとめ
========================= */
function renderAllComponents() {
  renderSummary();
  renderScoreboard();
  renderLineups();
  renderField();
  renderZone();
  renderPitcherStats();
  renderBatterStats();
  renderPitchLog();
  renderCount();
}

/* =========================
   概要・スコアボード
========================= */
function renderSummary() {
  if(!gameData?.meta) return;
  const m = gameData.meta;
  document.getElementById("summary").innerHTML = `
    ${m.home || "?"} vs ${m.away || "?"}<br>
    球場: ${m.stadium || "-"}<br>
    開始: ${m.date || "-"}
  `;
}

function renderScoreboard() {
  if(!gameData?.scoreboard) return;
  const sb = gameData.scoreboard;
  const innings = sb.innings || [];
  const totals = sb.total || {};
  let html = '<table border="1" style="border-collapse:collapse;text-align:center;margin:10px auto;">';
  html += '<tr><th></th>';
  innings.forEach(i=>html+=`<th>${i.inning}</th>`);
  html+='<th>R</th><th>H</th><th>E</th></tr>';
  html+=`<tr><td><strong>${gameData.meta.away}</strong></td>`;
  innings.forEach(i=>html+=`<td>${i.away ?? "-"}</td>`);
  html+=`<td>${totals.away?.R ?? "-"}</td><td>${totals.away?.H ?? "-"}</td><td>${totals.away?.E ?? "-"}</td></tr>`;
  html+=`<tr><td><strong>${gameData.meta.home}</strong></td>`;
  innings.forEach(i=>html+=`<td>${i.home ?? "-"}</td>`);
  html+=`<td>${totals.home?.R ?? "-"}</td><td>${totals.home?.H ?? "-"}</td><td>${totals.home?.E ?? "-"}</td></tr>`;
  html+='</table>';
  document.getElementById("scoreboard").innerHTML = html;
}

/* =========================
   ラインナップ
========================= */
function renderLineups() {
  if(!gameData?.lineups) return;
  const homeEl = document.getElementById("homeLineup");
  const awayEl = document.getElementById("awayLineup");
  homeEl.innerHTML = "";
  awayEl.innerHTML = "";

  function renderTeam(teamData, container) {
    if(!teamData) return;
    const list = document.createElement("div");
    list.className="lineup-list";
    teamData.forEach((player,index)=>{
      const item=document.createElement("div");
      item.className="lineup-item";
      item.innerHTML=`
        <div class="batting-order">${index+1}</div>
        <div class="position">${player.pos||"-"}</div>
        <div class="player-name">${player.name||"???"}</div>
        <div class="avg">${player.avg||""}</div>
      `;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  renderTeam(gameData.lineups.home, homeEl);
  renderTeam(gameData.lineups.away, awayEl);
}

/* =========================
   前打者／次打者
========================= */
function prevPA(){if(currentPAIndex>0){currentPAIndex--;renderCurrentPA();}}
function nextPA(){if(currentPAIndex<gameData.pitches.length-1){currentPAIndex++;renderCurrentPA();}}
function renderCurrentPA(){
  renderPitchLog();
  renderZone();
  renderCount();
  renderField();
  renderPitcherStats();
  renderBatterStats();
}

/* =========================
   投球ログ・カウント
========================= */
function renderPitchLog(){
  const el=document.getElementById("pitchLog");
  if(!el || !gameData?.pitches?.[currentPAIndex]) return;
  const pa=gameData.pitches[currentPAIndex];
  let html=`<div><strong>${pa.inning}回 ${pa.half==="top"?"表":"裏"} 打者: ${pa.batter_name||pa.batter_id||"-"}</strong></div>`;
  (pa.pitches||[]).forEach((p,i)=>{html+=`<div style="margin-left:10px;font-size:13px;">${i+1}球目：${p.pitch_type} / ${p.result}</div>`;});
  el.innerHTML=html;
}

function renderCount(){
  const container=document.getElementById("countDisplay");
  if(!container || !gameData?.pitches?.[currentPAIndex]) return;
  const pa=gameData.pitches[currentPAIndex];
  let balls=0,strikes=0;
  pa.pitches.forEach(p=>{
    if(p.result==="ball" && balls<3) balls++;
    if((p.result==="strike" || p.result==="foul") && strikes<2) strikes++;
  });
  if(pa.result==="strikeout") strikes=3;

  let outs=0;
  const currentInning=pa.inning;
  const currentHalf=pa.half;
  gameData.pitches.forEach((p,i)=>{if(i>currentPAIndex) return;if(p.inning===currentInning && p.half===currentHalf && (p.result==="out"||p.result==="strikeout")) outs++;});
  outs=Math.min(outs,3);

  container.innerHTML="";
function createDotRow(label, count, max, type) {
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
      dot.classList.add("filled");
      dot.classList.add(type);  // ← スペースでまとめずに別々にadd
    } else {
      dot.classList.add("empty");
    }
    row.appendChild(dot);
  }
  return row;
}

  container.appendChild(createDotRow("B",balls,3,"ball"));
  container.appendChild(createDotRow("S",strikes,3,"strike"));
  container.appendChild(createDotRow("O",outs,3,"out"));
}

/* =========================
   守備位置
========================= */
function renderField(){
  const el=document.getElementById("field");
  if(!el || !gameData?.pitches?.[currentPAIndex]) return;
  const pa=gameData.pitches[currentPAIndex];
  if(!pa.fielders){el.innerHTML="守備情報なし"; return;}
  el.innerHTML="";

  const positions={
    P:{top:"55%",left:"50%"},C:{top:"85%",left:"50%"},
    "1B":{top:"65%",left:"75%"}, "2B":{top:"45%",left:"65%"}, "3B":{top:"65%",left:"25%"},
    SS:{top:"45%",left:"35%"}, LF:{top:"20%",left:"25%"}, CF:{top:"10%",left:"50%"}, RF:{top:"20%",left:"75%"}
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
    el.appendChild(div);
  });
}

/* =========================
   投球ゾーン
========================= */
function renderZone(){
  const zone=document.getElementById("zone");
  if(!zone || !gameData?.pitches?.[currentPAIndex]) return;
  const pa=gameData.pitches[currentPAIndex];
  zone.innerHTML="";

  const size=zone.clientWidth,unit=size/5;
  const grid=document.createElement("div"); grid.className="zoneGrid";
  for(let y=1;y<=5;y++){for(let x=1;x<=5;x++){
    const cell=document.createElement("div");
    if(x>=2 && x<=4 && y>=2 && y<=4) cell.classList.add("strikeZone");
    grid.appendChild(cell);
  }}
  zone.appendChild(grid);

  (pa.pitches||[]).forEach((p,i)=>{
    if(!p.zone) return;
    const marker=document.createElement("div");
    marker.className="pitchMarker result-"+p.result;
    marker.innerText=`${p.pitch_type.charAt(0).toUpperCase()}${i+1}`;
    const x=Math.max(0,Math.min(5,p.zone.x));
    const y=Math.max(0,Math.min(5,p.zone.y));
    marker.style.left=`${x*unit}px`;
    marker.style.top=`${y*unit}px`;
    zone.appendChild(marker);
  });
}

/* =========================
   投手・打者詳細
========================= */
function renderPitcherStats(){
  const el=document.getElementById("pitcherStats");
  const canvas=document.getElementById("pitchChart");
  if(!el || !canvas || !gameData?.pitches?.[currentPAIndex]) return;

  const pa=gameData.pitches[currentPAIndex];
  const counts={};
  (pa.pitches||[]).forEach(p=>{counts[p.pitch_type]=(counts[p.pitch_type]||0)+1;});
  el.innerHTML=`投球数: ${pa.pitches.length}`;

  const ctx=canvas.getContext("2d");
  if(pitchChart) pitchChart.destroy();

  pitchChart=new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:Object.keys(counts),
      datasets:[{data:Object.values(counts),
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
  const el=document.getElementById("batterStats");
  if(!el) return;
  const byResult={};
  (gameData?.pitches||[]).forEach(pa=>{byResult[pa.result]=(byResult[pa.result]||0)+1;});
  let html="";
  for(let r in byResult) html+=`${r}: ${byResult[r]}<br>`;
  el.innerHTML=html||"データなし";
}

window.onload = init;
