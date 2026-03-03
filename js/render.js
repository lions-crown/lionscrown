function renderSummary(){
  const g = gameData.meta;
  document.getElementById("gameSummary").innerHTML =
    `${g.date} ${g.away} vs ${g.home} (${g.stadium})`;
}

function renderScoreboard() {
  const sb = gameData.scoreboard;
  console.log("scoreboard:", sb);

  if (!sb || !sb.home || !sb.away) {
    console.error("scoreboard構造が想定と違う");
    return;
  }

  let html = "<table><tr><th></th>";

  sb.innings.forEach(i => html += `<th>${i}</th>`);
  html += "<th>R</th><th>H</th><th>E</th></tr>";

  ["away","home"].forEach(team => {
    html += `<tr><td>${sb[team].team}</td>`;
    sb[team].runs.forEach(r => html += `<td>${r}</td>`);
    html += `<td>${sb[team].total}</td>`;
    html += `<td>${sb[team].hits}</td>`;
    html += `<td>${sb[team].errors}</td></tr>`;
  });

  html += "</table>";
  document.getElementById("scoreboard").innerHTML = html;
}

function renderLineups(){
  const home = gameData.lineups?.home || [];
  const away = gameData.lineups?.away || [];

  const homeDiv = document.getElementById("homeLineup");
  const awayDiv = document.getElementById("awayLineup");

  homeDiv.innerHTML = "<h3>HOME</h3>" +
    home.map(p => `${p.name} (${p.position})`).join("<br>");

  awayDiv.innerHTML = "<h3>AWAY</h3>" +
    away.map(p => `${p.name} (${p.position})`).join("<br>");
}

function renderZoneGrid(){
  const grid = document.getElementById("zoneGrid");
  grid.innerHTML = "";

  for(let y=1;y<=5;y++){
    for(let x=1;x<=5;x++){
      const div = document.createElement("div");
      div.className = "zoneCell";
      if(x>=2 && x<=4 && y>=2 && y<=4){
        div.classList.add("strikeZone");
      }
      div.id = `zone_${x}_${y}`;
      grid.appendChild(div);
    }
  }
}

function renderCurrentPA(){
  if(!gameData?.pitches?.length) return;

  const pas = [...new Set(gameData.pitches.map(p => p.pa_id))];
  const currentId = pas[window.currentPAIndex];
  const pitches = gameData.pitches.filter(p => p.pa_id === currentId);

  document.querySelectorAll(".zoneCell").forEach(c=>c.innerHTML="");

  pitches.forEach(p=>{
    const cell = document.getElementById(`zone_${p.zone.x}_${p.zone.y}`);
    if(cell){
      const mark = document.createElement("div");
      mark.className = "pitchMarker " + p.result;
      cell.appendChild(mark);
    }
  });

  document.getElementById("pitchLog").innerHTML =
    pitches.map(p=>`${p.pitch_type} ${p.velocity}km/h ${p.result}`).join("<br>");
}
