let gameData = {};
let currentAtBat = 0;

/* ========================= */
async function loadGame(){

  const params = new URLSearchParams(location.search);
  const date = params.get("date") || "2026-03-04";
  const team = params.get("team") || "1";

  const file = `live/${date}_${team}.json`;

  try{
    const res = await fetch(file);
    if(!res.ok) throw new Error("JSON取得失敗");

    gameData = await res.json();

    // データ補正（undefined防止）
    gameData.game_info ??= {};
    gameData.scoreboard ??= {away:[],home:[],away_hits:0,home_hits:0,away_errors:0,home_errors:0};
    gameData.lineups ??= {away:{starting:[],bench:[]},home:{starting:[],bench:[]}};
    gameData.at_bats ??= [];

    renderAll();

  }catch(e){
    alert("JSON読み込み失敗: "+e.message);
    console.error(e);
  }
}

/* ========================= */
function renderAll(){
  renderGameInfo();
  renderScoreboard();
  renderLineups();
  renderMatchup();
  renderZone();
  renderAnalytics();
}

/* ========================= */
function renderGameInfo(){

  const g = gameData.game_info;

  const away = g.away_team || "AWAY";
  const home = g.home_team || "HOME";

  document.getElementById("game-info").innerHTML = `
    <h2>${away} vs ${home}</h2>
  `;
}

/* ========================= */
function renderScoreboard(){

  const s = gameData.scoreboard;

  const innings = Math.max(
    s.away?.length || 0,
    s.home?.length || 0
  );

  let html="<table class='score-table'><tr><th></th>";

  for(let i=1;i<=innings;i++){
    html+=`<th class='inning-link' onclick='jumpTo(${i})'>${i}</th>`;
  }

  html+="<th>R</th><th>H</th><th>E</th></tr>";

  /* AWAY */
  html+=`<tr><td>${gameData.game_info.away_team || "AWAY"}</td>`;
  for(let i=0;i<innings;i++){
    html+=`<td>${s.away?.[i] ?? 0}</td>`;
  }
  html+=`<td>${(s.away||[]).reduce((a,b)=>a+b,0)}</td>
         <td>${s.away_hits ?? 0}</td>
         <td>${s.away_errors ?? 0}</td></tr>`;

  /* HOME */
  html+=`<tr><td>${gameData.game_info.home_team || "HOME"}</td>`;
  for(let i=0;i<innings;i++){
    html+=`<td>${s.home?.[i] ?? 0}</td>`;
  }
  html+=`<td>${(s.home||[]).reduce((a,b)=>a+b,0)}</td>
         <td>${s.home_hits ?? 0}</td>
         <td>${s.home_errors ?? 0}</td></tr></table>`;

  document.getElementById("scoreboard").innerHTML=html;
}

/* ========================= */
function renderLineups(){

  const l = gameData.lineups;

  document.getElementById("team1-name").innerText=
    gameData.game_info.away_team || "AWAY";

  document.getElementById("team2-name").innerText=
    gameData.game_info.home_team || "HOME";

  renderPlayers("team1-starters", l.away?.starting || []);
  renderPlayers("team1-bench", l.away?.bench || []);
  renderPlayers("team2-starters", l.home?.starting || []);
  renderPlayers("team2-bench", l.home?.bench || []);
}

function renderPlayers(id,list){

  let html="";

  list.forEach(p=>{
    html+=`
      <div class="player">
        <a href="${p.link || '#'}" target="_blank">${p.name || "-"}</a>
        <span>${p.avg || ""}</span>
      </div>
    `;
  });

  document.getElementById(id).innerHTML=html;
}

/* ========================= */
function renderMatchup(){

  if(!gameData.at_bats.length){
    document.getElementById("matchup").innerHTML="打席データなし";
    return;
  }

  const ab = gameData.at_bats[currentAtBat];

  document.getElementById("matchup").innerHTML=
    `投手: ${ab.pitcher?.name || "-"} 
     vs 打者: ${ab.batter?.name || "-"}
     / ${ab.inning || "-"}回${ab.half==="top"?"表":"裏"}
     / ${ab.outs ?? 0}アウト`;
}

/* ========================= */
function renderZone(){

  const grid=document.getElementById("zone-grid");
  if(!grid) return;

  grid.innerHTML="";

  for(let y=1;y<=5;y++){
    for(let x=1;x<=5;x++){
      const cell=document.createElement("div");
      cell.className="zone-cell";
      if(x>=2&&x<=4&&y>=2&&y<=4)
        cell.classList.add("strike-zone");
      grid.appendChild(cell);
    }
  }

  if(!gameData.at_bats.length) return;

  const ab=gameData.at_bats[currentAtBat];

  (ab.pitches||[]).forEach((p,i)=>{

    const index=(p.y-1)*5+(p.x-1);
    const cell=grid.children[index];
    if(!cell) return;

    const dot=document.createElement("div");
    dot.className="pitch-dot";

    if(p.result==="strike") dot.style.background="yellow";
    else if(p.result==="ball") dot.style.background="green";
    else if(p.result==="hit") dot.style.background="blue";
    else if(p.result==="out") dot.style.background="red";
    else dot.style.background="gray";

    dot.innerText=i+1; // 球数表示

    cell.appendChild(dot);
  });

  document.getElementById("pitch-summary").innerText=
    "打席結果: "+(ab.result || "-");
}

/* ========================= */
function renderAnalytics(){

  if(!gameData.at_bats.length) return;

  const ab = gameData.at_bats[currentAtBat];
  const pitcher=ab.pitcher?.name;
  const batter=ab.batter?.name;

  let allPitches=[];

  gameData.at_bats.forEach(a=>{
    if(a.pitcher?.name===pitcher)
      allPitches=allPitches.concat(a.pitches||[]);
  });

  const typeCount={};
  allPitches.forEach(p=>{
    typeCount[p.type]=(typeCount[p.type]||0)+1;
  });

  let html="<h3>投手データ</h3>";
  for(const t in typeCount){
    html+=`${t}: ${typeCount[t]}球<br>`;
  }

  document.getElementById("pitcher-data").innerHTML=html;

  document.getElementById("batter-data").innerHTML=
    `<h3>打者</h3>${batter || "-"}`;
}

/* ========================= */
function prevAtBat(){
  if(currentAtBat>0){
    currentAtBat--;
    renderAll();
  }
}

function nextAtBat(){
  if(currentAtBat<gameData.at_bats.length-1){
    currentAtBat++;
    renderAll();
  }
}

function jumpTo(inning){
  const index=gameData.at_bats.findIndex(a=>a.inning===inning);
  if(index>=0){
    currentAtBat=index;
    renderAll();
  }
}

loadGame();
