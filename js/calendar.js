let games = [];

const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

fetch("data/games.json")  // ← game.htmlから見て正しい
  .then(res => res.json())
  .then(data => {
    games = data;
    renderCalendar(currentYear, currentMonth);
  });

function renderCalendar(year, month) {

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  document.getElementById("currentMonth").textContent =
    `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div class="day-cell"></div>`;
  }

  for (let day = 1; day <= lastDate; day++) {

    const dateStr =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayGames = games.filter(g => g.date === dateStr);

    let gameHTML = "";

    dayGames.forEach(game => {
      gameHTML += `
        <div class="game-card">
          <img src="${game.opponent_logo}">
          <div>${game.opponent}</div>
          <div>${game.stadium}</div>
          <div>${game.time} ${game.home_away}</div>
          ${game.status === "finished" ? `<div>結果: ${game.result}</div>` : ""}
        </div>
      `;
    });

    calendar.innerHTML += `
      <div class="day-cell">
        <strong>${day}</strong>
        ${gameHTML}
      </div>
    `;
  }
}

document.getElementById("prevMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
};

document.getElementById("nextMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
};
