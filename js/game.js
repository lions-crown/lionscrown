let gameData;
let currentPAIndex = 0;

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(location.search);
  const date = (params.get("date") || "").trim();
  const team = (params.get("team") || "").trim();
  const gameId = params.get("game") || `${date}_${team}`;

  if (!gameId) {
    alert("gameパラメータがありません");
    return;
  }

  fetch(`live/${gameId}.json?${Date.now()}`)
    .then(res => {
      if(!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(data => {
      gameData = data;
      init();
    })
    .catch(err => {
      console.error("JSON取得失敗:", err);
    });

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
