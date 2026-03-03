function applyFilter(){
  const inning = document.getElementById("inningFilter").value;
  const batter = document.getElementById("batterFilter").value;
  const bases = document.getElementById("baseFilter").value;

  let filtered = gameData.pitches;

  if(inning) filtered = filtered.filter(p=>p.inning==inning);
  if(batter) filtered = filtered.filter(p=>p.batter_id==batter);
  if(bases) filtered = filtered.filter(p=>p.bases==bases);

  document.getElementById("pitchLog").innerHTML =
    filtered.map(p=>`${p.inning}回 ${p.pitch_type} ${p.result}`).join("<br>");
}
