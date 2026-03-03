let gameData = null;
let currentPAIndex = 0;
let pitchChart = null;

// 初期化
async function init(){
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date") || "2026-03-01";
  const team = urlParams.get("team") || "1";
  const jsonUrl = `https://lions-crown.github.io/lionscrown/live/${date}_${team}.json`;

  try{
    const res = await fetch(jsonUrl);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    gameData = await res.json();
    currentPAIndex = gameData.pitches.length-1; // 最新打者
    renderAllComponents();
  }catch(e){
    console.error("データ取得エラー:", e);
    showError(e.message);
  }
}

function showError(msg){
  ["summary","scoreboard","homeLineup","awayLineup","field","zone","pitcherStats","batterStats"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerHTML=`<div style="color:red;background:#fee;padding:12px;border:1px solid #faa;border-radius:6px;">データ読み込み失敗: ${msg}</div>`;
  });
}

function renderAllComponents(){
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

function renderSummary(){
  if(!gameData?.meta) return;
  const m = gameData.meta;
  document.getElementById("summary").innerHTML=`${m.home} vs ${m.away}<br>球場: ${m.stadium}<br>日付: ${m.date}`;
}

function renderScoreboard(){
  if(!gameData?.scoreboard) return;
  const sb = document.getElementById("scoreboard");
  sb.innerHTML="";
  gameData.scoreboard.innings.forEach(i=>{
    const a = document.createElement("a");
    a.href="#";
    a.textContent=i.inning+"回";
    a.onclick=e=>{e.preventDefault(); goToInning(i.inning);}
    sb.appendChild(a);
  });
}

function renderLineups(){
  renderTeam(gameData.lineups.home, document.getElementById("homeLineup"));
  renderTeam(gameData.lineups.away, document.getElementById("awayLineup"));
}
function renderTeam(players, container){
  if(!container || !players) return;
  container.innerHTML="";
  const list = document.createElement("div");
  list.className="lineup-list";
  players.forEach((p,i)=>{
    const item = document.createElement("div");
    item.className="lineup-item";
    item.innerHTML=`<div>${i+1}</div><div>${p.pos||"-"}</div><div>${p.name||"???"}</div><div>${p.avg||"-"}</div>`;
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderPitchLog(){
  const pa = gameData.pitches[currentPAIndex];
  if(!pa) return;
  const logEl = document.getElementById("pitchLog");
  let html=`<strong>${pa.inning}回 ${pa.half==="top"?"表":"裏"} 打者: ${pa.batter_name||pa.batter}</strong><br>`;
  (pa.pitches||[]).forEach((p,i)=>html+=`${i+1}球目: ${p.pitch_type} / ${p.result}<br>`);
  logEl.innerHTML=html;
}

function renderCount(){
  const pa = gameData.pitches[currentPAIndex];
  if(!pa) return;
  let balls=0,strikes=0;
  pa.pitches?.forEach(p=>{
    if(p.result==="ball") balls=Math.min(balls+1,3);
    if(p.result==="strike"||p.result==="foul") strikes=Math.min(strikes+1,2);
  });
  if(pa.result==="strikeout") strikes=3;
  const outs = getCurrentInningOuts();
  const container = document.getElementById("countDisplay");
  container.innerHTML="";
  container.appendChild(createDotRow("B",balls,3,"ball"));
  container.appendChild(createDotRow("S",strikes,3,"strike"));
  container.appendChild(createDotRow("O",outs,3,"out"));
}

function getCurrentInningOuts(){
  const pa = gameData.pitches[currentPAIndex];
  let outs=0;
  gameData.pitches.forEach((p,i)=>{
    if(i>currentPAIndex) return;
    if(p.inning===pa.inning && p.half===pa.half && (p.result==="out"||p.result==="strikeout")) outs++;
  });
  return Math.min(outs,3);
}

function createDotRow(label,count,max,type){
  const row=document.createElement("div"); row.className="countRow";
  const l=document.createElement("span"); l.className="countLabel"; l.innerText=label; row.appendChild(l);
  for(let i=0;i<max;i++){
    const dot=document.createElement("span"); dot.className="dot "+(i<count?"filled "+type:"empty");
    row.appendChild(dot);
  }
  return row;
}

function renderField(){
  const pa = gameData.pitches[currentPAIndex];
  const fieldEl=document.getElementById("field");
  fieldEl.innerHTML="";
  if(!pa?.fielders) return;
  const posMap={P:{top:"55%",left:"50%"},C:{top:"85%",left:"50%"}, "1B":{top:"65%",left:"75%"}, "2B":{top:"45%",left:"65%"}, "3B":{top:"65%",left:"25%"}, SS:{top:"45%",left:"35%"}, LF:{top:"20%",left:"25%"}, CF:{top:"10%",left:"50%"}, RF:{top:"20%",left:"75%"}};
  Object.entries(pa.fielders).forEach(([pos,name])=>{
    if(!posMap[pos]) return;
    const div=document.createElement("div");
    div.style.position="absolute";
    div.style.top=posMap[pos].top;
    div.style.left=posMap[pos].left;
    div.style.transform="translate(-50%,-50%)";
    div.style.background="white"; div.style.color="black"; div.style.padding="4px 6px"; div.style.borderRadius="10px"; div.style.fontSize="12px";
    div.textContent=`${pos} ${name}`;
    fieldEl.appendChild(div);
  });
}

function renderZone(){
  const pa=gameData.pitches[currentPAIndex];
  const zone = document.getElementById("zone");
  zone.innerHTML="";
  const size=zone.clientWidth; const unit=size/5;
  const grid = document.createElement("div");
  grid.className="zoneGrid";
  for(let y=1;y<=5;y++){for(let x=1;x<=5;x++){const cell=document.createElement("div"); if(x>=2 && x<=4 && y>=2 && y<=4) cell.classList.add("strikeZone"); grid.appendChild(cell);}}
  zone.appendChild(grid);
  pa.pitches?.forEach((p,i)=>{
    if(!p.zone) return;
    const marker=document.createElement("div");
    marker.className="pitchMarker result-"+p.result;
    marker.innerText = `${i+1}`;
    marker.style.left=`${p.zone.x*unit}px`;
    marker.style.top=`${p.zone.y*unit}px`;
    zone.appendChild(marker);
  });
}

function renderPitcherStats(){
  const pa=gameData.pitches[currentPAIndex];
  if(!pa?.pitches) return;
  const counts={};
  pa.pitches.forEach(p=>{counts[p.pitch_type]=(counts[p.pitch_type]||0)+1;});
  const statsEl=document.getElementById("pitcherStats");
  statsEl.innerHTML=""; // canvasは再利用
  const canvas=document.getElementById("pitchChart");
  if(pitchChart) pitchChart.destroy();
  const ctx=canvas.getContext("2d");
  pitchChart=new Chart(ctx,{
    type:"doughnut",
    data:{labels:Object.keys(counts), datasets:[{data:Object.values(counts), backgroundColor:["#4da3ff","#ff7676","#ffd84d","#7cff7c","#c57cff"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"white"}}}}
  });
}

function renderBatterStats(){
  const allPA=gameData.pitches||[];
  const byResult={};
  allPA.forEach(pa=>{byResult[pa.result]=(byResult[pa.result]||0)+1;});
  document.getElementById("batterStats").innerHTML=Object.entries(byResult).map(([k,v])=>`${k}: ${v}`).join("<br>")||"データなし";
}

// 打者移動・検索
function prevPA(){if(currentPAIndex>0){currentPAIndex--; renderAllComponents();}}
function nextPA(){if(currentPAIndex<gameData.pitches.length-1){currentPAIndex++; renderAllComponents();}}
function latestPA(){currentPAIndex=gameData.pitches.length-1; renderAllComponents();}
function searchBatter(){
  const name=document.getElementById("searchBatter").value.trim();
  const idx=gameData.pitches.findIndex(p=>p.batter===name || p.batter_name===name);
  if(idx>=0){currentPAIndex=idx; renderAllComponents();}
}

// イニングリンク
function goToInning(inning){
  const idx=gameData.pitches.findIndex(p=>p.inning===inning);
  if(idx>=0){currentPAIndex=idx; renderAllComponents();}
}

window.onload=init;
