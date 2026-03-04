/* =========================
   GLOBAL STATE
========================= */

let gameData = null;
let currentIndex = 0;

let gameData = {};
let currentAtBat = 0;

/* =========================
   初期ロード
========================= */
async function loadGame(){

  const params = new URLSearchParams(location.search);
  const date = params.get("date") || "2026-03-01";
  const team = params.get("team") || "1";

  const file = `live/${date}_${team}.json`;

  try{
    const res = await fetch(file);
    if(!res.ok) throw new Error("JSON取得失敗");

    gameData = await res.json();

    /* データ安全補正 */
    gameData.game_info ??= {};
    gameData.scoreboard ??= {
      away:[],home:[],
      away_hits:0,home_hits:0,
      away_errors:0,home_errors:0
    };
    gameData.lineups ??= {
      away:{starting:[],bench:[]},
      home:{starting:[],bench:[]}
    };
    gameData.at_bats ??= [];

    renderAll();

  }catch(e){
    alert("読み込み失敗: "+e.message);
    console.error(e);
  }
}

/* =========================
   全体描画
========================= */
function renderAll(){
  renderHeader();
  renderScoreboard();
  renderCountBoard();
  renderField();
  renderZone();
  renderTimeline();
}

/* =========================
   ヘッダー
========================= */
function renderHeader(){
  const g = gameData.game_info || {};
  const away = g.away_team || "AWAY";
  const home = g.home_team || "HOME";
  const stadium = g.stadium || "";

  const el = document.getElementById("game-info");
  if(el){
    el.innerText = `${away} vs ${home} ${stadium ? "＠"+stadium : ""}`;
  }
}

/* =========================
   スコアボード
========================= */
function renderScoreboard(){

  const s = gameData.scoreboard || {};
  const innings = Math.max(
    s.away?.length || 0,
    s.home?.length || 0
  );

  let html = "<table class='score-table'><tr><th></th>";

  for(let i=1;i<=innings;i++){
    html += `<th onclick="jumpTo(${i})" style="cursor:pointer">${i}</th>`;
  }

  html += "<th>R</th><th>H</th><th>E</th></tr>";

  /* AWAY */
  html += `<tr><td>${gameData.game_info.away_team || "AWAY"}</td>`;
  for(let i=0;i<innings;i++){
    html += `<td>${s.away?.[i] ?? 0}</td>`;
  }
  html += `<td>${(s.away||[]).reduce((a,b)=>a+b,0)}</td>
           <td>${s.away_hits ?? 0}</td>
           <td>${s.away_errors ?? 0}</td></tr>`;

  /* HOME */
  html += `<tr><td>${gameData.game_info.home_team || "HOME"}</td>`;
  for(let i=0;i<innings;i++){
    html += `<td>${s.home?.[i] ?? 0}</td>`;
  }
  html += `<td>${(s.home||[]).reduce((a,b)=>a+b,0)}</td>
           <td>${s.home_hits ?? 0}</td>
           <td>${s.home_errors ?? 0}</td></tr></table>`;

  const el = document.getElementById("scoreboard");
  if(el) el.innerHTML = html;
}

/* =========================
   電光掲示板カウント
========================= */
function renderCountBoard(){

  if(!gameData.at_bats.length) return;

  const c = gameData.at_bats[currentAtBat].count || {b:0,s:0,o:0};

  renderLights("balls",3,c.b,"green");
  renderLights("strikes",2,c.s,"yellow");
  renderLights("outs",2,c.o,"red");
}

function renderLights(id,max,on,color){

  const el = document.getElementById(id);
  if(!el) return;

  el.innerHTML = "";

  for(let i=0;i<max;i++){
    const d = document.createElement("div");
    d.className = "light";
    if(i < on) d.classList.add("on",color);
    el.appendChild(d);
  }
}

/* =========================
   守備位置＋塁状況
========================= */
function renderField(){

  if(!gameData.at_bats.length) return;

  const ab = gameData.at_bats[currentAtBat];
  const f = document.getElementById("field");
  if(!f) return;

  f.innerHTML = "";

  /* 塁 */
  const bases = ab.bases || {};
  ["first","second","third"].forEach(b=>{
    const div = document.createElement("div");
    div.className = `base ${b}`;
    div.innerText = bases[b] || "";
    f.appendChild(div);
  });

  /* 守備位置 */
  const field = ab.field || {};
  for(const pos in field){
    const div = document.createElement("div");
    div.className = `pos ${pos}`;
    div.innerText = field[pos] || "";
    f.appendChild(div);
  }
}

/* =========================
   ストライクゾーン
========================= */
function renderZone(){

  if(!gameData.at_bats.length) return;

  const zone = document.getElementById("zone");
  if(!zone) return;

  zone.innerHTML = "";

  for(let y=1;y<=5;y++){
    for(let x=1;x<=5;x++){
      const cell = document.createElement("div");
      cell.className = "cell";
      if(x>=2 && x<=4 && y>=2 && y<=4)
        cell.classList.add("strike");
      zone.appendChild(cell);
    }
  }

  const pitches = gameData.at_bats[currentAtBat].pitches || [];

  pitches.forEach((p,i)=>{
    const index = (p.y-1)*5 + (p.x-1);
    const target = zone.children[index];
    if(!target) return;

    const dot = document.createElement("div");
    dot.className = "dot";

    if(p.result==="strike") dot.style.background="yellow";
    else if(p.result==="ball") dot.style.background="lime";
    else if(p.result==="hit") dot.style.background="cyan";
    else if(p.result==="out") dot.style.background="red";
    else dot.style.background="white";

    dot.innerText = i+1;

    target.appendChild(dot);
  });
}

/* =========================
   実況タイムライン
========================= */
function renderTimeline(){

  if(!gameData.at_bats.length) return;

  const logs = gameData.at_bats[currentAtBat].log || [];
  const tl = document.getElementById("timeline");
  if(!tl) return;

  tl.innerHTML = "";

  logs.forEach(l=>{
    tl.innerHTML += `
      <div class="log-item">
        ${l.time || ""} - ${l.text || ""}
      </div>
    `;
  });
}

/* =========================
   打席移動
========================= */
function nextAtBat(){
  if(currentAtBat < gameData.at_bats.length-1){
    currentAtBat++;
    renderAll();
  }
}

function prevAtBat(){
  if(currentAtBat > 0){
    currentAtBat--;
    renderAll();
  }
}

function jumpTo(inning){
  const index = gameData.at_bats.findIndex(a=>a.inning===inning);
  if(index>=0){
    currentAtBat = index;
    renderAll();
  }
}

/* ========================= */
loadGame();
