let games = [];

const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
const weekdays = ["月", "火", "水", "木", "金", "土", "日"];

document.addEventListener("DOMContentLoaded", () => {

  renderWeekdays();              // 曜日は必ず描画
  renderCalendar(currentYear, currentMonth); // JSON前に初期カレンダー描画

  // JSON読み込み
  fetch("data/games.json")
    .then(res => {
      if (!res.ok) throw new Error("games.json 読み込み失敗");
      return res.json();
    })
    .then(data => {
      games = data;
      renderCalendar(currentYear, currentMonth); // JSON取得後に再描画
    })
    .catch(err => console.error(err));

  // 月切り替え
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
});

function renderWeekdays() {
  const top = document.getElementById("calendarTopDays");
  const bottom = document.getElementById("calendarBottomDays");
  if (!top || !bottom) return;

  top.innerHTML = "";
  bottom.innerHTML = "";

  weekdays.forEach((day, index) => {
    let className = "";
    if (index === 5) className = "saturday";
    if (index === 6) className = "sunday";

    top.innerHTML += `<div class="${className}">${day}</div>`;
    bottom.innerHTML += `<div class="${className}">${day}</div>`;
  });
}

function renderCalendar(year, month) {
  const calendar = document.getElementById("calendar");
  if (!calendar) return;

  calendar.innerHTML = "";
  document.getElementById("currentMonth").textContent =
    `${year}年 ${month + 1}月`;

  // 月曜始まり
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay + 6) % 7;

  const lastDate = new Date(year, month + 1, 0).getDate();
  const totalCells = 42;
  let dayCounter = 1;

  for (let i = 0; i < totalCells; i++) {

    if (i < firstDay || dayCounter > lastDate) {
      calendar.innerHTML += `<div class="day-cell empty"></div>`;
      continue;
    }

    const dateStr =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(dayCounter).padStart(2, "0")}`;

    const dayGames = games.filter(g => g.date === dateStr);
    let gameHTML = "";

    dayGames.forEach(game => {
      const resultHTML = game.status === "finished"
        ? `<div class="result">結果: ${game.result}</div>`
        : "";

      gameHTML += `
        <div class="game-card">
          <img src="${game.opponent_logo}" alt="">
          <div>${game.opponent}</div>
          <div>${game.stadium}</div>
          <div>${game.time} ${game.home_away}</div>
          ${resultHTML}
        </div>
      `;
    });

    let todayClass = "";
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      dayCounter === today.getDate()
    ) {
      todayClass = "today";
    }

    calendar.innerHTML += `
      <div class="day-cell ${todayClass}">
        <strong>${dayCounter}</strong>
        ${gameHTML}
      </div>
    `;

    dayCounter++;
  }
}
