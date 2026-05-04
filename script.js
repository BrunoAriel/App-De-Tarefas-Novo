let xp = 0;
let level = 1;
let xpMax = 100;
let points = 0;

// =======================
// CRIAR HORÁRIOS
// =======================
const schedule = document.getElementById("schedule");

for (let i = 4; i <= 22; i++) {
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
  xp += amount;
  points += amount;

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
      <button onclick="completeTask(this)">✔</button>
      <button onclick="failTask(this)">✖</button>
    </div>
  `;

  list.appendChild(li);
  input.value = "";
  saveData();
}

function completeTask(btn) {
  gainXP(10);
  btn.closest("li").remove();
  saveData();
}

function failTask(btn) {
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
    </div>
  `;

  list.appendChild(li);
  input.value = "";
  saveData();
}

// 🔥 MARCAR / DESMARCAR
function toggleDaily(btn) {
  const li = btn.closest("li");
  const text = li.querySelector("span");

  if (li.classList.contains("done")) {
    // DESMARCAR
    li.classList.remove("done");
    text.style.textDecoration = "none";
  } else {
    // MARCAR
    li.classList.add("done");
    text.style.textDecoration = "line-through";

    gainXP(5); // só ganha quando marca
  }

  saveData();
}

// ❌ NÃO FEITA
function failDaily(btn) {
  const li = btn.closest("li");
  li.remove();
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


///notificaçãoi 
function agendarNotificacoesDoDia() {
  if (Notification.permission !== "granted") return;

  const atividades = document.querySelectorAll(".activity");

  atividades.forEach((input, index) => {
    const texto = input.value.trim();
    if (!texto) return;

    const hora = 4 + index; // começa às 4:00

    const agora = new Date();
    const alvo = new Date();

    alvo.setHours(hora);
    alvo.setMinutes(0);
    alvo.setSeconds(0);

    let tempo = alvo - agora;

    if (tempo < 0) return; // já passou

    setTimeout(() => {
      new Notification("⏰ Hora da atividade", {
        body: texto
      });
    }, tempo);
  });
}
function ativarNotificacao() {
  Notification.requestPermission().then(p => {
    if (p === "granted") {
      agendarNotificacoesDoDia();
    }
  });
}

// 🔥 DESMARCA SEM APAGAR
function uncheckDailies() {
  document.querySelectorAll("#dailyList li").forEach(li => {
    li.classList.remove("done");

    const span = li.querySelector("span");
    if (span) span.style.textDecoration = "none";
  });

  saveData();
}

// 🔔 INICIAR PUSH
async function iniciarPush() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Permissão negada!");
    return;
  }

  const messaging = firebase.messaging();

  const token = await messaging.getToken({
    vapidKey: "SUA_VAPID_KEY"
  });

  console.log("TOKEN:", token);

  // salvar token (opcional)
  localStorage.setItem("pushToken", token);
}

// 🔥 DATA ATUAL + DIA DA SEMANA
function setTodayDate() {
  const dateInput = document.getElementById("dateInput");
  const today = new Date();

  // formato YYYY-MM-DD (input date precisa disso)
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
  const data = JSON.parse(localStorage.getItem("plannerData"));
  if (!data) return;
  applyData(data);
}

agendarNotificacoesDoDia();
loadData();
checkDailyUncheck();
setTodayDate(); // 🔥 aqui
updateXP();