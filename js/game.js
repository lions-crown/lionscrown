let gameData = null;
let currentIndex = 0;
let autoPlay = null;

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
    startAutoPlay();
  } catch (err) {
    console.error(err);
    alert("データが読み込めませんでした");
  }
}

function renderAll(){
 if(!gameData || !gameData.at_bats?.length) return;
 const ab=gameData.at_bats[currentIndex];

 renderScoreBar(ab);
 renderScoreboard();
 renderCount(ab);
 renderZone(ab);
 renderLog(ab);
 renderLineups();
}

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

function renderScoreboard(){
 const sb=gameData.scoreboard;
 let html="<tr><th></th>";
 for(let i=1;i<=9;i++) html+=`<th>${i}</th>`;
 html+="<th>R</th><th>H</th><th>E</th></tr>";

 html+="<tr><td>Away</td>";
 for(let i=0;i<9;i++) html+=`<td>${sb.away[i]??"-"}</td>`;
 html+=`<td>${sb.away.reduce((a,b)=>a+b,0)}</td>
 <td>${sb.away_hits}</td>
 <td>${sb.away_errors}</td></tr>`;

 html+="<tr><td>Home</td>";
 for(let i=0;i<9;i++) html+=`<td>${sb.home[i]??"-"}</td>`;
 html+=`<td>${sb.home.reduce((a,b)=>a+b,0)}</td>
 <td>${sb.home_hits}</td>
 <td>${sb.home_errors}</td></tr>`;

 document.getElementById("scoreboard").innerHTML=html;
}

function renderCount(ab){
 const c=ab.count;
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

function renderLog(ab){
 let html="";
 ab.log?.forEach(l=>{
  html+=`<div>${l.time} ${l.text}</div>`;
 });
 document.getElementById("timeline").innerHTML=html;
}

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

loadGame();
