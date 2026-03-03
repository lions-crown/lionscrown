let gameData;
let currentPAIndex = 0;

const params = new URLSearchParams(location.search);
const gameId = params.get("game");

fetch(`live/${gameId}.json?${Date.now()}`)
  .then(res => res.json())
  .then(data => {
    gameData = data;
    init();
  });

function init(){
  renderSummary();
  renderScoreboard();
  renderLineups();
  renderZoneGrid();
  renderCurrentPA();
}

function prevPA(){
  if(currentPAIndex > 0){
    currentPAIndex--;
    renderCurrentPA();
  }
}

function nextPA(){
  const pas = [...new Set(gameData.pitches.map(p => p.pa_id))];
  if(currentPAIndex < pas.length-1){
    currentPAIndex++;
    renderCurrentPA();
  }
}
