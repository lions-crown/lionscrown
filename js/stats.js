function calcPitchTypeRate(pitcherId){
  const arr = gameData.pitches.filter(p=>p.pitcher_id===pitcherId);
  const total = arr.length;
  const map = {};
  arr.forEach(p=>{
    map[p.pitch_type] = (map[p.pitch_type]||0)+1;
  });
  let html="";
  for(let k in map){
    html += `${k}: ${(map[k]/total*100).toFixed(1)}%<br>`;
  }
  document.getElementById("pitcherStats").innerHTML = html;
}
