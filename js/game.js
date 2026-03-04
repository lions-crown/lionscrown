let gameData;
let currentAtBatIndex = 0;
let atBats = [];

/* ===============================
   JSON読み込み
================================= */
async function loadGame() {

  const params = new URLSearchParams(window.location.search);
  const date = params.get("date") || "2026-03-04";
  const team = params.get("team") || "1";

  const file = `live/${date}_${team}.json`;

  try{
    const res = await fetch(file);

    if(!res.ok){
      throw new Error("JSONが見つかりません: " + file);
    }

    gameData = await res.json();
    console.log("読み込み成功:", gameData);

    generateAtBats();   // pitches → 打席生成
    renderAll();

  }catch(e){
    console.error(e);
    document.body.innerHTML =
      `<h2 style="color:red;">データ読み込み失敗</h2><p>${e.message}</p>`;
  }
}

/* ===============================
   pitches → 打席生成
================================= */
function generateAtBats(){

  const grouped = {};

  gameData.pitches.forEach(p => {
    const key = `${p.inning}_${p.half}_${p.batter}`;
    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  atBats = Object.values(grouped);
}

/* ===============================
   全描画
================================= */
function renderAll(){
  renderGameInfo();
  renderScoreboard();
  renderMatchup();
  renderZone();
}

/* ===============================
   試合概要（meta対応）
================================= */
function renderGameInfo(){

  const m = gameData.meta;

  document.getElementById("game-info").innerHTML = `
    <h2>${m.away_team} vs ${m.home_team}</h2>
    <p>日付: ${m.date}</p>
    <p>状態: ${m.status}</p>
    <p>最終更新: ${m.last_updated}</p>
  `;
}

/* ===============================
   スコア（live用簡易）
================================= */
function renderScoreboard(){

  const s = gameData.scoreboard;

  document.getElementById("scoreboard").innerHTML = `
    <h3>スコア</h3>
    <p>${gameData.meta.away_team} ${s.away_score}
    - ${s.home_score} ${gameData.meta.home_team}</p>
    <p>${s.inning}回 ${s.half === "top" ? "表" : "裏"} /
       ${s.outs}アウト</p>
  `;
}

/* ===============================
   投手 vs 打者
================================= */
function renderMatchup(){

  if(atBats.length === 0) return;

  const pitches = atBats[currentAtBatIndex];
  const lastPitch = pitches[pitches.length - 1];

  document.getElementById("matchup").innerHTML =
    `投手: ${lastPitch.pitcher}　
     vs　
     打者: ${lastPitch.batter}`;
}

/* ===============================
   ゾーン描画（仮）
================================= */
function renderZone(){

  if(atBats.length === 0) return;

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

  const pitches = atBats[currentAtBatIndex];

  pitches.forEach(p=>{

    const cellIndex = Math.floor(Math.random()*25); // 座標未定義のため仮
    const cell = grid.children[cellIndex];

    const dot = document.createElement("div");
    dot.className="pitch-dot";

    if(p.result==="strike") dot.style.background="yellow";
    else if(p.result==="ball") dot.style.background="green";
    else if(p.result==="foul") dot.style.background="orange";
    else dot.style.background="gray";

    cell.appendChild(dot);
  });
}

/* ===============================
   前後移動
================================= */
function prevAtBat(){
  if(currentAtBatIndex > 0){
    currentAtBatIndex--;
    renderZone();
  }
}

function nextAtBat(){
  if(currentAtBatIndex < atBats.length - 1){
    currentAtBatIndex++;
    renderZone();
  }
}

loadGame();
