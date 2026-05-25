import { auth, db, provider } from "./firebase-config.js";
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, query, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =====================================================
//  DONNÉES INITIALES (importées au premier login)
// =====================================================

const INITIAL_DATA = {
  // UID Google de Thomas → à remplir après premier login (voir README)
  "THOMAS_UID": {
    displayName: "Thomas",
    goal: 75,
    weights: [
      { date: "2024-08-01", value: 104.5 },
      { date: "2024-09-10", value: 99.7  },
      { date: "2024-09-20", value: 97.2  },
      { date: "2024-09-28", value: 96.8  },
      { date: "2024-10-07", value: 94.7  },
      { date: "2024-10-18", value: 93.3  },
      { date: "2024-11-01", value: 91.5  },
      { date: "2024-11-22", value: 90.3  },
      { date: "2024-11-29", value: 89.5  },
      { date: "2024-12-20", value: 88.0  },
      { date: "2025-01-25", value: 86.4  },
      { date: "2025-02-09", value: 85.5  },
      { date: "2025-02-27", value: 84.5  },
      { date: "2025-03-28", value: 84.5  },
      { date: "2025-04-10", value: 83.5  },
      { date: "2025-04-28", value: 82.5  },
      { date: "2025-05-18", value: 81.5  },
    ],
    mensur: []
  },

  // UID Google d'Anna → à remplir après premier login
  "ANNA_UID": {
    displayName: "Anna",
    goal: 65,
    weights: [
      { date: "2024-08-01", value: 86.0  },
      { date: "2024-09-20", value: 82.1  },
      { date: "2024-10-18", value: 79.9  },
      { date: "2024-11-01", value: 78.8  },
      { date: "2024-11-22", value: 77.8  },
      { date: "2024-12-20", value: 75.6  },
      { date: "2025-01-17", value: 74.6  },
      { date: "2025-01-26", value: 72.9  },
      { date: "2025-02-13", value: 72.9  },
      { date: "2025-02-27", value: 72.4  },
      { date: "2025-03-27", value: 71.3  },
      { date: "2025-04-10", value: 70.9  },
      { date: "2025-04-27", value: 70.9  },
      { date: "2025-05-18", value: 70.5  },
    ],
    mensur: [
      {
        date: "2024-10-18",
        data: { Poitrine: 109, Taille: 91, Hanches: 105, Fesses: 112, "Cuisse G": 66, "Cuisse D": 66, "Bras G": 32, "Bras D": 32 }
      },
      {
        date: "2024-11-01",
        data: { Poitrine: 108, Taille: 89, Hanches: 104, Fesses: 111, "Cuisse G": 64, "Cuisse D": 65, "Bras G": 31, "Bras D": 31 }
      },
      {
        date: "2024-11-22",
        data: { Poitrine: 106, Taille: 86, Hanches: 102, Fesses: 110, "Cuisse G": 63, "Cuisse D": 63, "Bras G": 31, "Bras D": 31 }
      },
      {
        date: "2024-12-20",
        data: { Poitrine: 104, Taille: 85, Hanches: 98, Fesses: 107, "Cuisse G": 62, "Cuisse D": 62, "Bras G": 30.5, "Bras D": 30 }
      },
      {
        date: "2025-01-17",
        data: { Poitrine: 101, Taille: 82, Hanches: 98, Fesses: 107, "Cuisse G": 61, "Cuisse D": 61, "Bras G": 30, "Bras D": 30 }
      },
      {
        date: "2025-02-14",
        data: { Poitrine: 97, Taille: 81, Hanches: 97, Fesses: 106, "Cuisse G": 61, "Cuisse D": 61, "Bras G": 29, "Bras D": 29 }
      },
      {
        date: "2025-04-10",
        data: { Poitrine: 99, Taille: 78, Hanches: 93, Fesses: 104, "Cuisse G": 61, "Cuisse D": 61, "Bras G": 29, "Bras D": 29 }
      }
    ]
  }
};

// Couleurs des zones de mesure
const ZONE_COLORS = {
  "Poitrine":  "#b8f0a0",
  "Taille":    "#4fd1c5",
  "Hanches":   "#ffb664",
  "Fesses":    "#e879f9",
  "Cuisse G":  "#a78bfa",
  "Cuisse D":  "#c4b5fd",
  "Bras G":    "#f87171",
  "Bras D":    "#fca5a5",
};

// Ordre d'affichage
const ZONE_ORDER = ["Poitrine","Taille","Hanches","Fesses","Cuisse G","Cuisse D","Bras G","Bras D"];

// =====================================================
//  ÉTAT
// =====================================================
let currentUser = null;
let userData    = { weights: [], mensur: [], goal: null };
let weightChart = null;
let selMensurIdx = -1;

// =====================================================
//  ÉLÉMENTS DOM
// =====================================================
const $ = id => document.getElementById(id);

const loginScreen   = $("loginScreen");
const appEl         = $("app");
const googleLoginBtn= $("googleLoginBtn");
const logoutBtn     = $("logoutBtn");
const userAvatarEl  = $("userAvatar");
const userNameEl    = $("userName");

const tabButtons    = document.querySelectorAll(".tab");
const tabPoids      = $("tabPoids");
const tabMensur     = $("tabMensur");

const kpiCurrent    = $("kpiCurrent");
const kpiGoal       = $("kpiGoal");
const kpiLost       = $("kpiLost");
const chartCurrentVal = $("chartCurrentVal");
const goalInput     = $("goalInput");

const addWeightBtn  = $("addWeightBtn");
const addMensurBtn  = $("addMensurBtn");

const modalWeight   = $("modalWeight");
const weightDate    = $("weightDate");
const weightVal     = $("weightVal");
const cancelWeightBtn  = $("cancelWeightBtn");
const confirmWeightBtn = $("confirmWeightBtn");

const modalMensur   = $("modalMensur");
const mensurDate    = $("mensurDate");
const mensurFields  = $("mensurFields");
const cancelMensurBtn  = $("cancelMensurBtn");
const confirmMensurBtn = $("confirmMensurBtn");

// =====================================================
//  AUTH
// =====================================================
googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    showToast("Erreur de connexion : " + e.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    loginScreen.classList.add("hidden");
    appEl.classList.remove("hidden");
    userAvatarEl.src  = user.photoURL || "";
    userNameEl.textContent = user.displayName?.split(" ")[0] || "Moi";
    await loadOrInitUser(user);
    renderAll();
  } else {
    currentUser = null;
    loginScreen.classList.remove("hidden");
    appEl.classList.add("hidden");
  }
});

// =====================================================
//  FIRESTORE — CHARGEMENT / INIT
// =====================================================
async function loadOrInitUser(user) {
  const uid = user.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Vérifie si des données initiales existent pour cet UID
    const preset = INITIAL_DATA[uid];
    const base = {
      displayName: user.displayName,
      email: user.email,
      goal: preset ? preset.goal : null,
      createdAt: Timestamp.now()
    };
    await setDoc(userRef, base);

    // Import données initiales si présentes
    if (preset) {
      const wCol = collection(db, "users", uid, "weights");
      for (const w of preset.weights) {
        await addDoc(wCol, { date: w.date, value: w.value, createdAt: Timestamp.now() });
      }
      const mCol = collection(db, "users", uid, "mensur");
      for (const m of preset.mensur) {
        await addDoc(mCol, { date: m.date, data: m.data, createdAt: Timestamp.now() });
      }
    }
  }

  // Lecture
  const freshSnap = await getDoc(userRef);
  const base = freshSnap.data();
  userData.goal = base.goal;

  const wSnap = await getDocs(query(collection(db, "users", uid, "weights"), orderBy("date")));
  userData.weights = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const mSnap = await getDocs(query(collection(db, "users", uid, "mensur"), orderBy("date")));
  userData.mensur = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  selMensurIdx = userData.mensur.length - 1;
}

// =====================================================
//  RENDU GLOBAL
// =====================================================
function renderAll() {
  renderPoids();
  renderMensur();
}

// =====================================================
//  ONGLET POIDS
// =====================================================
function renderPoids() {
  const weights = userData.weights;
  if (!weights.length) {
    kpiCurrent.textContent = "—";
    kpiGoal.textContent    = userData.goal ? userData.goal + " kg" : "Définir";
    kpiLost.textContent    = "—";
    chartCurrentVal.textContent = "";
    return;
  }

  // Trier par date
  const sorted = [...weights].sort((a,b) => a.date.localeCompare(b.date));
  const first  = sorted[0].value;
  const last   = sorted[sorted.length - 1].value;
  const lost   = (first - last).toFixed(1);

  kpiCurrent.textContent = last + " kg";
  kpiLost.textContent    = "−" + lost + " kg";
  kpiGoal.textContent    = userData.goal ? userData.goal + " kg" : "Définir";
  chartCurrentVal.innerHTML = `${last} kg <small>${formatDate(sorted[sorted.length-1].date)}</small>`;

  // Filtrer sur les 12 derniers mois
  const now    = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const filtered = sorted.filter(w => new Date(w.date) >= cutoff);

  const labels = filtered.map(w => formatDateShort(w.date));
  const data   = filtered.map(w => w.value);

  buildWeightChart(labels, data, userData.goal);
}

function buildWeightChart(labels, data, goal) {
  const canvas = document.getElementById("weightChart");
  if (weightChart) { weightChart.destroy(); weightChart = null; }

  const ctx = canvas.getContext("2d");
  const color = "#b8f0a0";
  const goalData = goal ? Array(labels.length).fill(goal) : null;

  const datasets = [
    {
      label: "Poids",
      data,
      borderColor: color,
      backgroundColor: (() => {
        const g = ctx.createLinearGradient(0, 0, 0, 220);
        g.addColorStop(0, color + "28");
        g.addColorStop(1, color + "00");
        return g;
      })(),
      fill: true,
      tension: 0.42,
      borderWidth: 2,
      pointRadius: (ctx2) => ctx2.dataIndex === data.length - 1 ? 6 : 3,
      pointBackgroundColor: color,
      pointBorderColor: "#0c0c12",
      pointBorderWidth: 2
    }
  ];

  if (goalData) {
    datasets.push({
      label: "Objectif",
      data: goalData,
      borderColor: "rgba(255,255,255,.15)",
      borderDash: [5, 4],
      borderWidth: 1,
      pointRadius: 0,
      fill: false
    });
  }

  weightChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(12,12,18,.95)",
          borderColor: "rgba(255,255,255,.1)",
          borderWidth: .5,
          titleColor: "rgba(255,255,255,.4)",
          bodyColor: "#f0eee8",
          bodyFont: { family: "DM Sans", size: 14, weight: "600" },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: c => c.datasetIndex === 0 ? ` ${c.parsed.y.toFixed(1)} kg` : null
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.04)", drawBorder: false },
          ticks: {
            color: "rgba(255,255,255,.28)",
            font: { size: 10, family: "DM Sans" },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10
          },
          border: { display: false }
        },
        y: {
          min: Math.floor(Math.min(...data, goal || Infinity)) - 2,
          max: Math.ceil(Math.max(...data)) + 2,
          grid: { color: "rgba(255,255,255,.04)", drawBorder: false },
          ticks: {
            color: "rgba(255,255,255,.28)",
            font: { size: 10, family: "DM Sans" },
            callback: v => v + " kg",
            stepSize: 3
          },
          border: { display: false }
        }
      }
    }
  });
}

// =====================================================
//  ONGLET MENSURATIONS
// =====================================================
function renderMensur() {
  const mensurDataEl = $("mensurData");
  const mensurNoData = $("mensurNoData");

  if (!userData.mensur.length) {
    mensurNoData.classList.remove("hidden");
    mensurDataEl.classList.add("hidden");
    return;
  }

  mensurNoData.classList.add("hidden");
  mensurDataEl.classList.remove("hidden");

  // Sélection courante
  if (selMensurIdx < 0 || selMensurIdx >= userData.mensur.length) {
    selMensurIdx = userData.mensur.length - 1;
  }

  renderDateNav();
  renderMensurRows();
}

function renderDateNav() {
  const nav = $("dateNav");
  nav.innerHTML = userData.mensur.map((m, i) =>
    `<button class="date-pill ${i === selMensurIdx ? "active" : ""}" 
      onclick="window._selectMensur(${i})">${formatDateShort(m.date)}</button>`
  ).join("");
}

window._selectMensur = function(i) {
  selMensurIdx = i;
  renderDateNav();
  renderMensurRows();
};

function renderMensurRows() {
  const m = userData.mensur[selMensurIdx];
  const ref = userData.mensur[0]; // référence = première prise
  const data = m.data;
  const refData = ref.data;

  const summary = $("mensurSummary");
  const rows = $("measureRows");

  // Total cm perdus vs référence
  let total = 0;
  ZONE_ORDER.forEach(k => {
    if (data[k] != null && refData[k] != null) total += data[k] - refData[k];
  });
  summary.innerHTML = `<strong>${total > 0 ? "+" : ""}${total.toFixed(0)} cm</strong> vs. début`;

  // Lignes
  rows.innerHTML = ZONE_ORDER.filter(k => data[k] != null).map(k => {
    const cur  = data[k];
    const start = refData[k];
    const diff  = start != null ? cur - start : null;
    const diffStr = diff === null ? "—" : (diff > 0 ? "+" : "") + diff.toFixed(1) + " cm";
    const cls   = diff === null ? "zero" : diff < 0 ? "good" : diff > 0 ? "bad" : "zero";
    return `<div class="mrow">
      <div class="mname">
        <span class="mdot" style="background:${ZONE_COLORS[k] || "#888"}"></span>${k}
      </div>
      <div class="mval">${cur} cm</div>
      <div style="text-align:right"><span class="mdelta ${cls}">${diffStr}</span></div>
    </div>`;
  }).join("");
}

// =====================================================
//  TABS
// =====================================================
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const t = btn.dataset.tab;
    tabPoids.classList.toggle("active", t === "poids");
    tabPoids.classList.toggle("hidden", t !== "poids");
    tabMensur.classList.toggle("active", t === "mensur");
    tabMensur.classList.toggle("hidden", t !== "mensur");
  });
});

// =====================================================
//  OBJECTIF ÉDITABLE
// =====================================================
const kpiGoalEl = $("kpiGoal");

kpiGoalEl.parentElement.addEventListener("click", () => {
  goalInput.value = userData.goal || "";
  kpiGoalEl.classList.add("hidden");
  goalInput.classList.remove("hidden");
  goalInput.focus();
});

goalInput.addEventListener("blur",  saveGoal);
goalInput.addEventListener("keydown", e => { if (e.key === "Enter") goalInput.blur(); });

async function saveGoal() {
  const val = parseFloat(goalInput.value);
  goalInput.classList.add("hidden");
  kpiGoalEl.classList.remove("hidden");
  if (!isNaN(val) && val > 0) {
    userData.goal = val;
    await updateDoc(doc(db, "users", currentUser.uid), { goal: val });
    renderPoids();
    showToast("Objectif mis à jour ✓");
  }
}

// =====================================================
//  MODAL PESÉE
// =====================================================
addWeightBtn.addEventListener("click", openWeightModal);

function openWeightModal() {
  weightDate.value = new Date().toISOString().slice(0, 10);
  weightVal.value  = "";
  modalWeight.classList.remove("hidden");
  setTimeout(() => weightVal.focus(), 100);
}

cancelWeightBtn.addEventListener("click", () => modalWeight.classList.add("hidden"));

modalWeight.addEventListener("click", e => {
  if (e.target === modalWeight) modalWeight.classList.add("hidden");
});

confirmWeightBtn.addEventListener("click", async () => {
  const d = weightDate.value;
  const v = parseFloat(weightVal.value);
  if (!d || isNaN(v)) { showToast("Remplis la date et le poids"); return; }

  const ref2 = await addDoc(collection(db, "users", currentUser.uid, "weights"), {
    date: d, value: v, createdAt: Timestamp.now()
  });
  userData.weights.push({ id: ref2.id, date: d, value: v });
  userData.weights.sort((a,b) => a.date.localeCompare(b.date));

  modalWeight.classList.add("hidden");
  renderPoids();
  showToast("Pesée enregistrée ✓");
});

// =====================================================
//  MODAL MENSURATIONS
// =====================================================
addMensurBtn.addEventListener("click", openMensurModal);
const addMensurBtnEmpty = $("addMensurBtnEmpty");
if (addMensurBtnEmpty) addMensurBtnEmpty.addEventListener("click", openMensurModal);

function openMensurModal() {
  mensurDate.value = new Date().toISOString().slice(0, 10);
  // Génère les champs
  mensurFields.innerHTML = ZONE_ORDER.map(k => `
    <div>
      <label class="field-label" style="display:flex;align-items:center;gap:5px">
        <span style="width:7px;height:7px;border-radius:50%;background:${ZONE_COLORS[k]};display:inline-block"></span>
        ${k}
      </label>
      <input type="number" step="0.1" min="0" max="300"
        id="mf_${k.replace(/ /g,'_')}" class="field-input" placeholder="cm"
        value="${getLastMensurVal(k)}" />
    </div>
  `).join("");
  modalMensur.classList.remove("hidden");
}

function getLastMensurVal(zone) {
  if (!userData.mensur.length) return "";
  const last = userData.mensur[userData.mensur.length - 1];
  return last.data[zone] != null ? last.data[zone] : "";
}

cancelMensurBtn.addEventListener("click", () => modalMensur.classList.add("hidden"));

modalMensur.addEventListener("click", e => {
  if (e.target === modalMensur) modalMensur.classList.add("hidden");
});

confirmMensurBtn.addEventListener("click", async () => {
  const d = mensurDate.value;
  if (!d) { showToast("Indique la date"); return; }

  const data = {};
  ZONE_ORDER.forEach(k => {
    const el = document.getElementById("mf_" + k.replace(/ /g,"_"));
    if (el && el.value !== "") data[k] = parseFloat(el.value);
  });

  if (!Object.keys(data).length) { showToast("Saisis au moins une mesure"); return; }

  const ref2 = await addDoc(collection(db, "users", currentUser.uid, "mensur"), {
    date: d, data, createdAt: Timestamp.now()
  });
  userData.mensur.push({ id: ref2.id, date: d, data });
  userData.mensur.sort((a,b) => a.date.localeCompare(b.date));
  selMensurIdx = userData.mensur.length - 1;

  modalMensur.classList.add("hidden");
  renderMensur();
  showToast("Mensurations enregistrées ✓");
});

// =====================================================
//  UTILITAIRES
// =====================================================
function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function formatDateShort(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short"
  });
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2800);
}

// Chart.js via CDN
const chartScript = document.createElement("script");
chartScript.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
chartScript.onload = () => { /* Chart.js prêt */ };
document.head.appendChild(chartScript);
