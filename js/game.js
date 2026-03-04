let gameData;
let currentAtBatIndex = 0;

/* ===============================
   JSON読み込み（軍別対応）
================================= */
async function loadGame() {

  const params = new URLSearchParams(window.location.search);
  const date = params.get("date") || "2026-03-01";
  const team = params.get("team") || "1";

  const file = `live/${date}_${team}.json`;

  try{
    const res = await fetch(file);
    gameData = await res.json();
    renderAll();
  }catch(e){
    alert("データ取得エラー");
    console.error(e);
  }
}

/* ===============================
   全描画
================================= */
function renderAll(){
  renderGameInfo();
  renderScoreboard();
  renderMatchup();
  renderLineups();
  renderZone();
  renderData();
}

/* ===============================
   試合概要
================================= */
function renderGameInfo(){
  const g = gameData.game_info;
  document.getElementById("game-info").innerHTML = `
    <h2>${g.away_team} vs ${g.home_team}</h2>
    <p>${g.stadium} / ${g.start_time}</p>
    <p>審判：${g.umpires.plate} (球審)</p>
  `;
}

/* ===============================
   スコアボード
================================= */
function renderScoreboard(){
  const s = gameData.scoreboard;
  let innings = s.away.length;

  let header = "<tr><th></th>";
  for(let i=1;i<=innings;i++){
    header += `<th class="inning-link" onclick="jumpToInning(${i})">${i}</th>`;
  }
  header += "<th>R</th><th>H</th><th>E</th></tr>";

  let awayRow = `<tr><td>${gameData.game_info.away_team}</td>`;
  s.away.forEach(r=> awayRow+=`<td>${r}</td>`);
  awayRow+=`<td>${s.away_total}</td><td>${s.away_hits}</td><td>${s.away_errors}</td></tr>`;

  let homeRow = `<tr><td>${gameData.game_info.home_team}</td>`;
  s.home.forEach(r=> homeRow+=`<td>${r}</td>`);
  homeRow+=`<td>${s.home_total}</td><td>${s.home_hits}</td><td>${s.home_errors}</td></tr>`;

  document.getElementById("scoreboard").innerHTML =
    `<table>${header}${awayRow}${homeRow}</table>`;
}

function jumpToInning(inning){
  const index = gameData.at_bats.findIndex(a=>a.inning===inning);
  if(index>=0){
    currentAtBatIndex = index;
    renderZone();
  }
}

/* ===============================
   投手・打者
================================= */
function renderMatchup(){
  const atbat = gameData.at_bats[currentAtBatIndex];
  document.getElementById("matchup").innerHTML =
    `投手: ${atbat.pitcher}　vs　打者: ${atbat.batter}`;
}

/* ===============================
   ラインナップ
================================= */
function renderLineups(){
  const l = gameData.lineups;

  document.getElementById("team1-name").innerText =
    gameData.game_info.away_team;
  document.getElementById("team2-name").innerText =
    gameData.game_info.home_team;

  renderPlayers("team1-starters", l.away.starting);
  renderPlayers("team1-bench", l.away.bench);
  renderPlayers("team2-starters", l.home.starting);
  renderPlayers("team2-bench", l.home.bench);
}

function renderPlayers(id,list){
  let html="";
  list.forEach(p=>{
    html+=`
      <div class="player">
        <a href="${p.link}">${p.name}</a>
        <span>${p.avg || p.era || ""}</span>
      </div>
    `;
  });
  document.getElementById(id).innerHTML = html;
}

/* ===============================
   ゾーン描画
================================= */
function renderZone(){

  renderMatchup();

  const grid = document.getElementById("zone-grid");
  grid.innerHTML="";

  for(let y=1;y<=5;y++){
    for(let x=1;x<=5;x++){
      const cell = document.createElement("div");
      cell.className="zone-cell";

      if(x>=2 && x<=4 && y>=2 && y<=4){
        cell.classList.add("strike-zone");
      }

      grid.appendChild(cell);
    }
  }

  const atbat = gameData.at_bats[currentAtBatIndex];

  atbat.pitches.forEach(p=>{
    const index = (p.y-1)*5 + (p.x-1);
    const cell = grid.children[index];

    const dot = document.createElement("div");
    dot.className="pitch-dot";

    if(p.result==="strike") dot.style.background="yellow";
    if(p.result==="ball") dot.style.background="green";
    if(p.result==="hit") dot.style.background="blue";
    if(p.result==="out") dot.style.background="red";

    cell.appendChild(dot);
  });

  document.getElementById("pitch-info").innerText =
    `結果: ${atbat.result}`;
}

/* ===============================
   前後移動
================================= */
function prevAtBat(){
  if(currentAtBatIndex>0){
    currentAtBatIndex--;
    renderZone();
  }
}
function nextAtBat(){
  if(currentAtBatIndex < gameData.at_bats.length-1){
    currentAtBatIndex++;
    renderZone();
  }
}

/* ===============================
   各種データ（簡易版）
================================= */
function renderData(){
  document.getElementById("pitcher-data").innerHTML =
    "<h3>投手データ</h3>球種割合など（計算実装可）";

  document.getElementById("batter-data").innerHTML =
    "<h3>打者データ</h3>球種別打率など（計算実装可）";
}

loadGame();
