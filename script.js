let xp = 0;
let level = 1;
let xpMax = 100;
let points = 0;

// =======================
// CRIAR HORÁRIOS
// =======================
const schedule = document.getElementById("schedule");

for (let i = 00; i <= 24; i++) {
  let row = document.createElement("div");
  row.className = "row";

  row.innerHTML = `
    <div class="time">${i}:00</div>
    <input class="activity">
  `;

  schedule.appendChild(row);
}

// =======================
// AUTO SAVE (TUDO)
// =======================
document.addEventListener("input", () => {
  saveData();
});

// =======================
// XP
// =======================
function gainXP(amount) {

  // ✅ CORREÇÃO: somar pontos corretamente
  points += amount;
  if (points < 0) {
    points = 0;
  }

  // ✅ CORREÇÃO: impedir XP negativo
  xp += amount;
  if (xp < 0) {
    xp = 0;
  }

  if (xp >= xpMax) {
    xp -= xpMax;
    level++;
    xpMax += 50;
  }

  updateXP();
  saveData();
}

function updateXP() {
  document.getElementById("level").innerText = level;
  document.getElementById("points").innerText = points;
  document.getElementById("xpFill").style.width = (xp / xpMax * 100) + "%";
}

// =======================
// CRIAR OBJETO
// =======================
function buildDataObject() {
  return {
    xp, level, xpMax, points,
    tasks: document.getElementById("taskList").innerHTML,
    daily: document.getElementById("dailyList").innerHTML,
    notes: document.getElementById("notes").value,

    goals: Array.from(document.querySelectorAll(".goal-input")).map(i => i.value),
    schedule: Array.from(document.querySelectorAll(".activity")).map(i => i.value)
  };
}

// =======================
// APLICAR DADOS
// =======================
function applyData(data) {
  if (!data) return;

  xp = data.xp || 0;
  level = data.level || 1;
  xpMax = data.xpMax || 100;
  points = data.points || 0;

  document.getElementById("taskList").innerHTML = data.tasks || "";
  document.getElementById("dailyList").innerHTML = data.daily || "";
  document.getElementById("notes").value = data.notes || "";

  document.querySelectorAll(".goal-input").forEach((input, i) => {
    input.value = data.goals?.[i] || "";
  });

  document.querySelectorAll(".activity").forEach((input, i) => {
    input.value = data.schedule?.[i] || "";
  });

  updateXP();
}

// =======================
// RESET
// =======================
function resetAll() {
  if (!confirm("Tem certeza que quer apagar tudo?")) return;

  localStorage.removeItem("plannerData");

  xp = 0;
  level = 1;
  xpMax = 100;
  points = 0;

  document.getElementById("taskList").innerHTML = "";
  document.getElementById("dailyList").innerHTML = "";
  document.getElementById("notes").value = "";

  document.querySelectorAll(".goal-input").forEach(i => i.value = "");
  document.querySelectorAll(".activity").forEach(i => i.value = "");

  updateXP();
}

// =======================
// EXPORTAR
// =======================
function exportData() {
  const data = buildDataObject();

  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "planner_backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

// =======================
// IMPORTAR
// =======================
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    applyData(data);
    saveData();
  };

  reader.readAsText(file);
}

// =======================
// TAREFAS
// =======================
function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  if (!input.value.trim()) return;

  let li = document.createElement("li");

  li.innerHTML = `
    <span contenteditable="true">${input.value}</span>
    <div class="actions">
      <button onclick="completeTask(this)">✔️</button>
      <button onclick="failTask(this)">❌</button>
    </div>
  `;

  list.appendChild(li);
  input.value = "";
  saveData();
}

function completeTask(btn) {
  gainXP(20);
  btn.closest("li").remove();
  saveData();
}

function failTask(btn) {
  gainXP(-10);
  btn.closest("li").remove();
  saveData();
}

// =======================
// DIÁRIAS
// =======================
function addDaily() {
  const input = document.getElementById("dailyInput");
  const list = document.getElementById("dailyList");

  if (!input.value.trim()) return;

  let li = document.createElement("li");

  li.innerHTML = `
    <span contenteditable="true">${input.value}</span>
    <div class="actions">
      <button onclick="toggleDaily(this)">✔</button>
      <button onclick="failDaily(this)">✖</button>
      <button onclick="removeDaily(this)">🗑</button>
    </div>
  `;

  list.appendChild(li);
  input.value = "";
  saveData();
}


function removeDaily(btn) {
  const li = btn.closest("li");

  if (!confirm("Remover essa tarefa?")) return;

  li.remove();
  saveData();
}

function removeDaily(btn) {
  const li = btn.closest("li");

  li.style.opacity = "0.5";

  setTimeout(() => {
    if (confirm("Remover essa tarefa?")) {
      li.remove();
      saveData();
    } else {
      li.style.opacity = "1";
    }
  }, 200);
}


// 🔥 MARCAR / DESMARCAR
function toggleDaily(btn) {
  const li = btn.closest("li");
  const text = li.querySelector("span");

  if (li.classList.contains("done")) {
    li.classList.remove("done");
    text.style.textDecoration = "none";
    text.style.color = "Black";
  } else {
    li.classList.add("done");
    text.style.textDecoration = "line-through";
    text.style.color = "blue";
    gainXP(10);
  }

  saveData();
}

// ❌ NÃO FEITA
function failDaily(btn) {
  gainXP(-10);
  
  const li = btn.closest("li");
  const text = li.querySelector("span");
  
  li.classList.add("failed");
  
   if (text) {
    text.style.color = "red";
    text.style.textDecoration = "line-through";
  }
  
  
  saveData();
}

// 🔥 DESMARCAR DIÁRIAS AUTOMATICAMENTE
function checkDailyUncheck() {
  const today = new Date().toDateString();
  const lastDay = localStorage.getItem("lastDay");

  if (lastDay !== today) {
    uncheckDailies();
    localStorage.setItem("lastDay", today);
  }
}

// 🔥 DESMARCA SEM APAGAR
function uncheckDailies() {
  document.querySelectorAll("#dailyList li").forEach(li => {
    
    li.classList.remove("done");

    li.classList.remove("failed");

    const span = li.querySelector("span");
    
    if (span) {
      span.style.textDecoration = "none"; // tira risco
      span.style.color = "Black"; // volta cor normal
    }
    
  });

  saveData();
}

// 🔥 DATA ATUAL + DIA DA SEMANA
function setTodayDate() {
  const dateInput = document.getElementById("dateInput");
  const today = new Date();

  const formatted = today.toISOString().split("T")[0];
  dateInput.value = formatted;

  highlightDay(today.getDay());
}

// 🔥 DESTACAR DIA DA SEMANA
function highlightDay(dayIndex) {
  const days = document.querySelectorAll(".week span");

  days.forEach((el, i) => {
    el.style.background = "transparent";
    el.style.color = "white";
  });

  if (days[dayIndex]) {
    days[dayIndex].style.background = "#f4c542";
    days[dayIndex].style.color = "#000";
    days[dayIndex].style.borderRadius = "50%";
    days[dayIndex].style.padding = "3px 6px";
  }
}

//note//
const notes = document.getElementById("notes");

function autoGrow(element) {
  element.style.height = "auto";
  element.style.height = element.scrollHeight + "px";
}

// crescer enquanto digita
notes.addEventListener("input", () => {
  autoGrow(notes);
});

// =======================
// SALVAR
// =======================
function saveData() {
  localStorage.setItem("plannerData", JSON.stringify(buildDataObject()));
}

// =======================
// CARREGAR
// =======================
function loadData() {
  
  setTimeout(() => {
  autoGrow(document.getElementById("notes"));
  }, 0);
  
  
  const data = JSON.parse(localStorage.getItem("plannerData"));
  if (!data) return;
  applyData(data);
}

loadData();
checkDailyUncheck();
setTodayDate();
updateXP();
