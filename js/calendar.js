let games = [];
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
const weekdays = ["月","火","水","木","金","土","日"];
let currentTeam = "1軍";

// 検索条件
let filterOpponent = "";
let filterStadium = "";
let filterHomeAway = "";
let filterDate = "";

document.addEventListener("DOMContentLoaded", () => {

  renderWeekdays();
  renderCalendar(currentYear, currentMonth);

  // 軍切り替え
  document.querySelectorAll(".filter-bar button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".filter-bar button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentTeam = btn.dataset.team;
      renderCalendar(currentYear,currentMonth);
    });
  });

  // 検索ボタン
  document.getElementById("searchBtn").addEventListener("click",()=>{
    filterOpponent = document.getElementById("searchOpponent").value.trim();
    filterStadium = document.getElementById("searchStadium").value.trim();
    filterHomeAway = document.getElementById("searchHomeAway").value;
    filterDate = document.getElementById("searchDate").value;
    renderCalendar(currentYear,currentMonth);
  });

  // クリアボタン
  document.getElementById("clearBtn").addEventListener("click",()=>{
    document.getElementById("searchOpponent").value="";
    document.getElementById("searchStadium").value="";
    document.getElementById("searchHomeAway").value="";
    document.getElementById("searchDate").value="";

    filterOpponent="";
    filterStadium="";
    filterHomeAway="";
    filterDate="";

    renderCalendar(currentYear,currentMonth);
  });

  // JSON読み込み
  fetch("/lionscrown/data/games.json")
    .then(res=>{
      if(!res.ok) throw new Error("games.json 読み込み失敗");
      return res.json();
    })
    .then(data=>{
      games = data;
      renderCalendar(currentYear,currentMonth);
    })
    .catch(err=>console.error(err));

  // 月切り替え
  document.getElementById("prevMonth").onclick = ()=>{
    currentMonth--;
    if(currentMonth<0){
      currentMonth=11;
      currentYear--;
    }
    renderCalendar(currentYear,currentMonth);
  };

  document.getElementById("nextMonth").onclick = ()=>{
    currentMonth++;
    if(currentMonth>11){
      currentMonth=0;
      currentYear++;
    }
    renderCalendar(currentYear,currentMonth);
  };

});

// 曜日描画
function renderWeekdays(){
  const top=document.getElementById("calendarTopDays");
  const bottom=document.getElementById("calendarBottomDays");
  if(!top||!bottom) return;

  top.innerHTML="";
  bottom.innerHTML="";
  weekdays.forEach((day,index)=>{
    let className="";
    if(index===5) className="saturday";
    if(index===6) className="sunday";
    top.innerHTML+=`<div class="${className}">${day}</div>`;
    bottom.innerHTML+=`<div class="${className}">${day}</div>`;
  });
}

// カレンダー描画
function renderCalendar(year,month){
  const calendar=document.getElementById("calendar");
  if(!calendar) return;
  calendar.innerHTML="";
  document.getElementById("currentMonth").textContent=`${year}年 ${month+1}月`;

  let firstDay=new Date(year,month,1).getDay();
  firstDay=(firstDay+6)%7;
  const lastDate=new Date(year,month+1,0).getDate();
  const totalCells=42;
  let dayCounter=1;

  for(let i=0;i<totalCells;i++){
    if(i<firstDay||dayCounter>lastDate){
      calendar.innerHTML+=`<div class="day-cell empty"></div>`;
      continue;
    }

    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayCounter).padStart(2,"0")}`;

    // フィルタ適用
    const dayGames=games
      .filter(g=>g.team===currentTeam)
      .filter(g=>{
        if(filterDate && g.date!==filterDate) return false;
        if(filterOpponent && !g.opponent.includes(filterOpponent)) return false;
        if(filterStadium && !g.stadium.includes(filterStadium)) return false;
        if(filterHomeAway && g.home_away!==filterHomeAway) return false;
        return g.date===dateStr;
      });

    let gameHTML="";
    dayGames.forEach(game=>{
      const resultHTML=game.status==="finished"?`<div class="result">結果: ${game.result}</div>`:"";
      gameHTML += `
       <a href="game_detail.html?date=${game.date}&team=${encodeURIComponent(game.team)}" class="game-card">
        <img src="${game.opponent_logo}" alt="${game.opponent}">
        <div>${game.opponent}</div>
        <div>${game.stadium}</div>
        <div>${game.time} ${game.home_away}</div>
        ${resultHTML}
       </a>
      `;
    });

    let todayClass="";
    if(year===today.getFullYear() && month===today.getMonth() && dayCounter===today.getDate()){
      todayClass="today";
    }

    calendar.innerHTML+=`
      <div class="day-cell ${todayClass}">
        <strong>${dayCounter}</strong>
        ${gameHTML}
      </div>
    `;

    dayCounter++;
  }
}
