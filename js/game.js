let gameData = null;
let currentIndex = 0;
let autoPlay = null;

/* ========================= */
async function loadGame() {
  const params = new URLSearchParams(location.search);
  const date = params.get("date");
  const team = params.get("team");

  if (!date || !team) {
    alert("URLパラメータが不足しています");
    return;
  }

  try {
    const res = await fetch(`data/${date}_${team}.json`);
    if (!res.ok) throw new Error("JSON not found");
    gameData = await res.json();

    currentIndex = 0;
    renderAll();
    // startAutoPlay(); // オート再生機能があればここで呼ぶ
  } catch (err) {
    console.error(err);
    alert("データが読み込めませんでした");
  }
}

/* ========================= */
function renderAll() {
  if (!gameData) return;

  const ab = gameData.at_bats[currentIndex];
  renderScoreBar(ab);
  renderScoreboard();
  renderField();
  renderBases();
  renderCount(ab);
  renderZone(ab);
  renderLog(ab);
  renderLineups();
}

/* ========================= */
function renderScoreBar(ab){
  document.getElementById("awayName").innerText=gameData.game_info.away_team;
  document.getElementById("homeName").innerText=gameData.game_info.home_team;

  const awayR=gameData.scoreboard.away.reduce((a,b)=>a+b,0);
  const homeR=gameData.scoreboard.home.reduce((a,b)=>a+b,0);

  document.getElementById("awayScore").innerText=awayR;
  document.getElementById("homeScore").innerText=homeR;

  document.getElementById("inningInfo").innerText=
    `${ab.inning}回${ab.half==="top"?"表":"裏"} ${ab.outs}アウト`;
}

/* ========================= */
function renderScoreboard() {
  const sb = gameData.scoreboard;
  const gi = gameData.game_info;

  document.getElementById("scorebar").innerHTML = `
    <div class="scorebar-inner">
      <div>${gi.away_team}</div>
      <div>${sb.away.join(" ")}</div>
      <div>${sb.away_hits}H ${sb.away_errors}E</div>
      <div>VS</div>
      <div>${gi.home_team}</div>
      <div>${sb.home.join(" ")}</div>
      <div>${sb.home_hits}H ${sb.home_errors}E</div>
    </div>
  `;
}

/* ========================= */
function renderField() {
  const ab = gameData.at_bats[currentIndex];
  if (!ab.field) return;

  const f = ab.field;

  document.getElementById("field").innerHTML = `
    <div class="pos p">${f.P}</div>
    <div class="pos c">${f.C}</div>
    <div class="pos fb">${f["1B"]}</div>
    <div class="pos sb">${f["2B"]}</div>
    <div class="pos tb">${f["3B"]}</div>
    <div class="pos ss">${f.SS}</div>
    <div class="pos lf">${f.LF}</div>
    <div class="pos cf">${f.CF}</div>
    <div class="pos rf">${f.RF}</div>
  `;
}

/* ========================= */
function renderBases() {
  const ab = gameData.at_bats[currentIndex];
  const b = ab.bases || {};

  document.getElementById("bases").innerHTML = `
    1塁: ${b.first || "-"}<br>
    2塁: ${b.second || "-"}<br>
    3塁: ${b.third || "-"}
  `;
}

/* ========================= */
function renderCount(ab){
  const c = ab.count || {b:0,s:0,o:0};
  document.getElementById("countBoard").innerHTML=
  `<div class="ball ${c.b>=1?'on':''}"></div>
   <div class="ball ${c.b>=2?'on':''}"></div>
   <div class="ball ${c.b>=3?'on':''}"></div>
   <div class="strike ${c.s>=1?'on':''}"></div>
   <div class="strike ${c.s>=2?'on':''}"></div>
   <div class="out ${c.o>=1?'on':''}"></div>
   <div class="out ${c.o>=2?'on':''}"></div>
   <div class="out ${c.o>=3?'on':''}"></div>`;
}

/* ========================= */
function renderZone(ab){
  const zone=document.getElementById("zone");
  zone.innerHTML="";
  ab.pitches?.forEach((p,i)=>{
    const div=document.createElement("div");
    div.className="pitch";
    div.style.left=`${p.x*30}px`;
    div.style.top=`${p.y*30}px`;
    div.innerText=i+1;
    zone.appendChild(div);
  });
}

/* ========================= */
function renderLog(ab){
  let html="";
  ab.log?.forEach(l=>{
    html+=`<div>${l.time} ${l.text}</div>`;
  });
  document.getElementById("timeline").innerHTML=html;
}

/* ========================= */
function renderLineups(){
  const lu=gameData.lineups;

  document.getElementById("lineupAway").innerHTML=
    "<b>西武 先発</b><br>"+
    lu.away.starting.map(p=>`${p.pos} ${p.name}`).join("<br>");

  document.getElementById("benchAway").innerHTML=
    "<b>ベンチ</b><br>"+
    lu.away.bench.map(p=>p.name).join("<br>");

  document.getElementById("lineupHome").innerHTML=
    "<b>ソフトバンク 先発</b><br>"+
    lu.home.starting.map(p=>`${p.pos} ${p.name}`).join("<br>");

  document.getElementById("benchHome").innerHTML=
    "<b>ベンチ</b><br>"+
    lu.home.bench.map(p=>p.name).join("<br>");
}

/* ========================= */
/* 前後送り */
function nextAtBat(){
  if(currentIndex<gameData.at_bats.length-1){
    currentIndex++; renderAll();
  }
}
function prevAtBat(){
  if(currentIndex>0){
    currentIndex--; renderAll();
  }
}
function goLive(){
  currentIndex=gameData.at_bats.length-1;
  renderAll();
}

/* ========================= */
/* 検索 */
function searchPlayer(){
  const name=document.getElementById("playerSearch").value.trim();
  const mode=document.getElementById("searchMode").value;

  const results=gameData.at_bats.filter(ab=>{
    if(mode==="batter") return ab.batter?.name===name;
    if(mode==="pitcher") return ab.pitcher?.name===name;
    return ab.players_involved?.includes(name);
  });

  renderSearchResults(results);
}

function renderSearchResults(list){
  const container=document.getElementById("searchResults");
  container.innerHTML="";

  list.slice(0,25).forEach(ab=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=
     `${ab.inning}回${ab.half==="top"?"表":"裏"}<br>
      打者:${ab.batter?.name}<br>
      結果:${ab.result}`;

    div.onclick=()=>{
      currentIndex=gameData.at_bats.indexOf(ab);
      renderAll();
      window.scrollTo(0,0);
    };

    container.appendChild(div);
  });
}

/* ========================= */
loadGame();
