/* =========================
   GLOBAL STATE
========================= */

let gameData = null;
let currentIndex = 0;

/* =========================
   LOAD GAME
========================= */

async function loadGame(){
  try{
    const params = new URLSearchParams(location.search);
    const date = params.get("date");
    const team = params.get("team");

    if(!date || !team){
      console.error("URLパラメータ不足");
      return;
    }

    const res = await fetch(`live/${date}_${team}.json`);
    if(!res.ok){
      console.error("JSON取得失敗");
      return;
    }

    gameData = await res.json();
    currentIndex = 0;

    renderAll();

  }catch(e){
    console.error("loadGameエラー", e);
  }
}

/* =========================
   SAFE RENDER
========================= */

function renderAll(){

  if(!gameData) return;
  if(!gameData.at_bats) return;
  if(gameData.at_bats.length === 0) return;

  if(currentIndex < 0) currentIndex = 0;
  if(currentIndex >= gameData.at_bats.length){
    currentIndex = gameData.at_bats.length - 1;
  }

  const ab = gameData.at_bats[currentIndex];
  if(!ab) return;

  renderGameInfo();
  renderScoreboard();
  renderField(ab);
  renderCount(ab);
  renderZone(ab);
  renderLog(ab);
}

/* =========================
   GAME INFO
========================= */

function renderGameInfo(){
  const info = gameData.game_info || {};
  document.getElementById("gameInfo").innerText =
    `${info.away_team || ""} vs ${info.home_team || ""}
     ${info.stadium || ""} ${info.date || ""}`;
}

/* =========================
   SCOREBOARD
========================= */

function renderScoreboard(){
  const sb = gameData.scoreboard || {};
  const innings = 9;

  let html = "<tr><th></th>";

  for(let i=1;i<=innings;i++){
    html += `<th>${i}</th>`;
  }

  html += "<th>R</th><th>H</th><th>E</th></tr>";

  html += "<tr><td>Away</td>";
  for(let i=0;i<innings;i++){
    html += `<td>${sb.away?.[i] ?? "-"}</td>`;
  }
  html += `<td>${sum(sb.away)}</td>
           <td>${sb.away_hits ?? 0}</td>
           <td>${sb.away_errors ?? 0}</td></tr>`;

  html += "<tr><td>Home</td>";
  for(let i=0;i<innings;i++){
    html += `<td>${sb.home?.[i] ?? "-"}</td>`;
  }
  html += `<td>${sum(sb.home)}</td>
           <td>${sb.home_hits ?? 0}</td>
           <td>${sb.home_errors ?? 0}</td></tr>`;

  document.getElementById("scoreboard").innerHTML = html;
}

function sum(arr){
  if(!arr) return 0;
  return arr.reduce((a,b)=>a+(b||0),0);
}

/* =========================
   COUNT BOARD
========================= */

function renderCount(ab){
  const c = ab.count || {b:0,s:0,o:0};

  document.getElementById("countBoard").innerHTML =
  `
  <div class="ball ${c.b>=1?'on':''}"></div>
  <div class="ball ${c.b>=2?'on':''}"></div>
  <div class="ball ${c.b>=3?'on':''}"></div>

  <div class="strike ${c.s>=1?'on':''}"></div>
  <div class="strike ${c.s>=2?'on':''}"></div>

  <div class="out ${c.o>=1?'on':''}"></div>
  <div class="out ${c.o>=2?'on':''}"></div>
  <div class="out ${c.o>=3?'on':''}"></div>
  `;
}

/* =========================
   FIELD
========================= */

function renderField(ab){

  const bases = ab.bases || {};
  const field = ab.field || {};

  document.getElementById("firstBase").innerText = bases.first || "";
  document.getElementById("secondBase").innerText = bases.second || "";
  document.getElementById("thirdBase").innerText = bases.third || "";

  for(const pos in field){
    const el = document.getElementById(pos);
    if(el) el.innerText = field[pos];
  }
}

/* =========================
   PITCH ZONE
========================= */

function renderZone(ab){
  const zone = document.getElementById("zone");
  zone.innerHTML = "";

  if(!ab.pitches) return;

  ab.pitches.forEach((p,i)=>{
    const div = document.createElement("div");
    div.className = "pitch";
    div.style.left = `${p.x*20}px`;
    div.style.top = `${p.y*20}px`;
    div.innerText = i+1;
    zone.appendChild(div);
  });
}

/* =========================
   LOG
========================= */

function renderLog(ab){
  const log = ab.log || [];
  let html = "";
  log.forEach(l=>{
    html += `<div>${l.time} ${l.text}</div>`;
  });
  document.getElementById("timeline").innerHTML = html;
}

loadGame();
