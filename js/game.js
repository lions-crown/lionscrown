let gameData = null;
let currentPAIndex = 0;
let pitchChart = null;

// 初期化
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date") || "2026-03-01";
  const team = urlParams.get("team") || "1";

  const jsonUrl = `live/${date}_${team}.json`;

  try {
    const res = await fetch(jsonUrl);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    gameData = await res.json();
    currentPAIndex = gameData.pitches.length - 1;
    renderAllComponents();
  } catch(err) {
    console.error("データ取得エラー:", err);
    showError(err.message);
  }
}

// エラー表示
function showError(msg){
  ["summary","scoreboard","homeLineup","awayLineup","field","zone","pitcherStats","batterStats"]
    .forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML=`<div style="color:red; background:#fee; padding:12px; border:1px solid #faa; border-radius:6px;">データ読み込み失敗: ${msg}</div>`;
    });
}

// 描画まとめ
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

// 試合概要
function renderSummary(){
  if(!gameData?.meta) return;
  const m = gameData.meta;
  document.getElementById("summary").innerHTML = `${m.home} vs ${m.away}<br>球場: ${m.stadium}<br>開始: ${m.date}`;
}

// スコアボード
function renderScoreboard(){
  if(!gameData?.scoreboard) return;
  const sb = gameData.scoreboard;
  const container = document.getElementById("scoreboard");
  container.innerHTML = "";
  sb.innings.forEach(i=>{
    const a = document.createElement("a");
    a.href="#";
    a.textContent = i.inning + "回";
    a.onclick = e=>{
      e.preventDefault();
      goToInning(i.inning);
    };
    container.appendChild(a);
  });
}

// ラインナップ
function renderLineups(){
  renderTeam(gameData.lineups?.home, document.getElementById("homeLineup"));
  renderTeam(gameData.lineups?.away, document.getElementById("awayLineup"));
}

function renderTeam(players, container){
  if(!container || !players) return;
  container.innerHTML="";
  const list = document.createElement("div");
  list.className="lineup-list";
  players.forEach((p,i)=>{
    const item = document.createElement("div");
    item.className="lineup-item";
    item.innerHTML=`<div class="batting-order">${i+1}</div><div class="position">${p.pos||"-"}</div><div class="player-name">${p.name||"???"}</div><div class="avg">${p.avg||"-"}</div>`;
    list.appendChild(item);
  });
  container.appendChild(list);
}

// 投球ログ
function renderPitchLog(){
  const pa = gameData.pitches?.[currentPAIndex];
  if(!pa) return;
  let html = `<strong>${pa.inning}回 ${pa.half==="top"?"表":"裏"} 打者: ${pa.batter_name||pa.batter||"-"}</strong><br>`;
  (pa.pitches||[]).forEach((p,i)=> html += `${i+1}球目: ${p.pitch_type} / ${p.result}<br>`);
  document.getElementById("pitchLog").innerHTML = html;
}

// カウント表示
function renderCount(){
  const container = document.getElementById("countDisplay");
  const pa = gameData.pitches?.[currentPAIndex];
  if(!container||!pa) return;
  let balls=0,strikes=0;
  pa.pitches?.forEach(p=>{
    if(p.result==="ball") balls++;
    if(p.result==="strike"||p.result==="foul") strikes++;
  });
  container.textContent = `B:${balls} S:${strikes} O:${pa.final_count?.outs||0}`;
}

// フィールド
function renderField(){
  const fieldEl = document.getElementById("field");
  const pa = gameData.pitches?.[currentPAIndex];
  if(!fieldEl || !pa) return;
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

// ストライクゾーン
function renderZone(){
  const zone = document.getElementById("zone");
  const pa = gameData.pitches?.[currentPAIndex];
  if(!zone || !pa) return;
  zone.innerHTML="";
  pa.pitches?.forEach((p,i)=>{
    if(!p.zone) return;
    const dot = document.createElement("div");
    dot.className="pitchMarker result-"+p.result;
    dot.style.left=`${p.zone.x*20}%`;
    dot.style.top=`${p.zone.y*20}%`;
    dot.title=`${p.pitch_type} ${p.velocity}km/h`;
    zone.appendChild(dot);
  });
}

// 投手詳細（Chart.js）
function renderPitcherStats(){
  const canvas = document.getElementById("pitchChart");
  if(!canvas||!canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  if(pitchChart) pitchChart.destroy();

  const pa = gameData.pitches?.[currentPAIndex];
  if(!pa?.pitches) return;
  const counts={};
  pa.pitches.forEach(p=> counts[p.pitch_type]=(counts[p.pitch_type]||0)+1);

  pitchChart = new Chart(ctx,{
    type:"doughnut",
    data:{labels:Object.keys(counts),datasets:[{data:Object.values(counts),backgroundColor:["#4da3ff","#ff7676","#ffd84d","#7cff7c","#c57cff"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"white"}}}}
  });

  document.getElementById("pitcherStats").insertAdjacentHTML("beforeend",`<div>投球数: ${pa.pitches.length}</div>`);
}

// 打者詳細
function renderBatterStats(){
  const byResult={};
  gameData.pitches?.forEach(pa=> byResult[pa.result]=(byResult[pa.result]||0)+1);
  let html="";
  for(let r in byResult) html+=`${r}: ${byResult[r]}<br>`;
  document.getElementById("batterStats").innerHTML = html||"データなし";
}

// 打者切替
function prevPA(){ if(currentPAIndex>0){currentPAIndex--; renderAllComponents(); } }
function nextPA(){ if(currentPAIndex<gameData.pitches.length-1){ currentPAIndex++; renderAllComponents(); } }
function latestPA(){ currentPAIndex=gameData.pitches.length-1; renderAllComponents(); }

// 選手検索
function searchBatter(){
  const name = document.getElementById("searchBatter").value.trim();
  const idx = gameData.pitches.findIndex(pa=> pa.batter_name===name || pa.batter===name);
  if(idx>=0){ currentPAIndex=idx; renderAllComponents(); }
}

// 回飛び
function goToInning(inning){
  const idx = gameData.pitches.findIndex(pa=> pa.inning===inning);
  if(idx>=0){ currentPAIndex=idx; renderAllComponents(); }
}

init();
