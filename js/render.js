function renderSummary(){
  const g = gameData.meta;
  document.getElementById("gameSummary").innerHTML =
    `${g.date} ${g.away} vs ${g.home} (${g.stadium})`;
}

function renderScoreboard(){
  const sb = gameData.scoreboard;
  let html = "<tr><th></th>";
  sb.innings.forEach(i => html += `<th>${i.inning}</th>`);
  html += "<th>R</th><th>H</th><th>E</th></tr>";

  html += "<tr><td>AWAY</td>";
  sb.innings.forEach(i => html += `<td>${i.away}</td>`);
  html += `<td>${sb.total.away.R}</td><td>${sb.total.away.H}</td><td>${sb.total.away.E}</td></tr>`;

  html += "<tr><td>HOME</td>";
  sb.innings.forEach(i => html += `<td>${i.home}</td>`);
  html += `<td>${sb.total.home.R}</td><td>${sb.total.home.H}</td><td>${sb.total.home.E}</td></tr>`;

  document.getElementById("scoreboard").innerHTML = html;
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
  const pas = [...new Set(gameData.pitches.map(p => p.pa_id))];
  const currentId = pas[currentPAIndex];
  const pitches = gameData.pitches.filter(p => p.pa_id === currentId);

  document.querySelectorAll(".zoneCell").forEach(c=>c.innerHTML="");

  pitches.forEach(p=>{
    const cell = document.getElementById(`zone_${p.zone.x}_${p.zone.y}`);
    const mark = document.createElement("div");
    mark.className = "pitchMarker " + p.result;
    cell.appendChild(mark);
  });

  document.getElementById("pitchLog").innerHTML =
    pitches.map(p=>`${p.pitch_type} ${p.velocity}km/h ${p.result}`).join("<br>");
}
