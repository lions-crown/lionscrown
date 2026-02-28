let games = [];
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
const weekdays = ["月","火","水","木","金","土","日"];
let currentTeam = "1";

let filterDate="";
let filterOpponent=[];
let filterStadium="";
let filterHomeAway="";

document.addEventListener("DOMContentLoaded",()=>{

  renderWeekdays();

  fetch("/lionscrown/data/games.json")
    .then(res=>res.json())
    .then(data=>{
      games=data;
      renderCalendar(currentYear,currentMonth);
    });

  document.querySelectorAll(".filter-bar button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".filter-bar button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentTeam = btn.dataset.team;
      renderCalendar(currentYear,currentMonth);
      renderSearchResults();
    });
  });

  document.getElementById("searchBtn").addEventListener("click",()=>{
    filterDate=document.getElementById("searchDate").value;
    filterStadium=document.getElementById("searchStadium").value.trim();
    filterHomeAway=document.getElementById("searchHomeAway").value;

    filterOpponent = Array.from(
      document.querySelectorAll(".opponent-box input:checked")
    ).map(cb=>cb.value);

    renderCalendar(currentYear,currentMonth);
    renderSearchResults();
  });

  document.getElementById("prevMonth").onclick=()=>{
    currentMonth--;
    if(currentMonth<0){currentMonth=11; currentYear--;}
    renderCalendar(currentYear,currentMonth);
  };

  document.getElementById("nextMonth").onclick=()=>{
    currentMonth++;
    if(currentMonth>11){currentMonth=0; currentYear++;}
    renderCalendar(currentYear,currentMonth);
  };
});

function renderWeekdays(){
  const top=document.getElementById("calendarTopDays");
  const bottom=document.getElementById("calendarBottomDays");
  top.innerHTML=""; bottom.innerHTML="";
  weekdays.forEach(day=>{
    top.innerHTML+=`<div>${day}</div>`;
    bottom.innerHTML+=`<div>${day}</div>`;
  });
}

function matchFilter(g){
  if(g.team!==currentTeam) return false;
  if(filterDate && g.date!==filterDate) return false;
  if(filterOpponent.length>0 && !filterOpponent.includes(g.opponent)) return false;
  if(filterStadium && !g.stadium.includes(filterStadium)) return false;
  if(filterHomeAway && g.home_away!==filterHomeAway) return false;
  return true;
}

function renderCalendar(year,month){
  const calendar=document.getElementById("calendar");
  calendar.innerHTML="";
  document.getElementById("currentMonth").textContent=`${year}年 ${month+1}月`;

  let firstDay=new Date(year,month,1).getDay();
  firstDay=(firstDay+6)%7;
  const lastDate=new Date(year,month+1,0).getDate();
  let dayCounter=1;

  const isFiltering = filterDate || filterOpponent.length>0 || filterStadium || filterHomeAway;

  for(let i=0;i<42;i++){

    if(i<firstDay||dayCounter>lastDate){
      calendar.innerHTML+=`<div class="day-cell empty"></div>`;
      continue;
    }

    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayCounter).padStart(2,"0")}`;

    const gamesToday = games.filter(g=>g.date===dateStr && g.team===currentTeam);
    const displayGames = isFiltering ? gamesToday.filter(matchFilter) : gamesToday;

    if(isFiltering && displayGames.length===0){
      calendar.innerHTML+=`<div class="day-cell empty"></div>`;
      dayCounter++;
      continue;
    }

    let html="";

    displayGames.forEach(game=>{
      const resultText = game.status==="finished" ? game.result : "";

      html+=`
        <a href="game_detail.html?date=${game.date}&team=${encodeURIComponent(game.team)}"
           class="mini-card">
          <img src="${game.opponent_logo}">
          <div class="mini-op">${game.opponent}</div>
          <div class="mini-time">${game.time} ${game.home_away}</div>
          ${resultText ? `<div class="mini-result">${resultText}</div>` : ""}
        </a>
      `;
    });

    calendar.innerHTML+=`
      <div class="day-cell ${displayGames.length>0 ? "highlight":""}">
        <strong>${dayCounter}</strong>
        ${html}
      </div>
    `;

    dayCounter++;
  }
}

function renderSearchResults(){
  const container=document.getElementById("searchResults");
  container.innerHTML="";

  const results=games.filter(matchFilter);

  if(results.length===0){
    container.innerHTML="<p>該当する試合はありません</p>";
    return;
  }

  results.forEach(game=>{
    const resultHTML=game.status==="finished"?game.result:"未試合";

    container.innerHTML+=`
      <a href="game_detail.html?date=${game.date}&team=${encodeURIComponent(game.team)}"
         class="result-row">
        <img src="${game.opponent_logo}" class="row-logo">
        <span>${game.date}</span>
        <span>${game.team}</span>
        <span>${game.opponent}</span>
        <span>${game.stadium}</span>
        <span>${game.home_away}</span>
        <span class="result">${resultHTML}</span>
      </a>
    `;
  });
}
