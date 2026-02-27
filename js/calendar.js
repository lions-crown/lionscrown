let games = [];

/* =========================
   初期設定
========================= */

const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

// 月曜始まり
const weekdays = ["月", "火", "水", "木", "金", "土", "日"];

/* =========================
   JSON読み込み
========================= */

fetch("data/games.json")
  .then(res => res.json())
  .then(data => {
    games = data;
    renderWeekdays();
    renderCalendar(currentYear, currentMonth);
  });

/* =========================
   曜日表示（上下）
========================= */

function renderWeekdays() {

  const top = document.getElementById("calendarTopDays");
  const bottom = document.getElementById("calendarBottomDays");

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

/* =========================
   カレンダー描画
========================= */

function renderCalendar(year, month) {

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  document.getElementById("currentMonth").textContent =
    `${year}年 ${month + 1}月`;

  // 月曜始まり補正
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay + 6) % 7;

  const lastDate = new Date(year, month + 1, 0).getDate();

  const totalCells = 42; // 6週固定

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

      const resultHTML =
        game.status === "finished"
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

    // 今日判定
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

/* =========================
   月切り替え
========================= */

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
