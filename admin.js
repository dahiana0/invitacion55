/* ==========================================================
   PANEL DE ADMINISTRACIÓN — admin.js
   Usa SOLO la URL y la clave pública (anon). La lista de invitados
   solo se puede leer iniciando sesión con el usuario administrador
   (protegido por RLS, ver supabase.sql).
   ========================================================== */

const SUPABASE_URL = "https://lpmjpudbfsmeshtfmjtt.supabase.co"; // ← reemplazar
const SUPABASE_ANON_KEY = "sb_publishable_zsCNrNIumhjiFPG91eIYQQ_-BlkSKp0"; // ← reemplazar

const $ = (selector) => document.querySelector(selector);

const loginView = $("#loginView");
const dashView = $("#dashView");
const loginMsg = $("#loginMsg");
const dashMsg = $("#dashMsg");

const configured =
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  !SUPABASE_ANON_KEY.includes("TU_SUPABASE");

const db = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function showLogin(message = "") {
  dashView.hidden = true;
  loginView.hidden = false;
  loginMsg.textContent = message;
}

function showDashboard() {
  loginView.hidden = true;
  dashView.hidden = false;
  loadGuests();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function makeCell(text, className, label) {
  const td = document.createElement("td");
  if (label) td.dataset.label = label;
  td.textContent = text || "—"; // textContent evita inyección de HTML
  if (className) td.className = className;
  return td;
}

async function loadGuests() {
  const refreshBtn = $("#refreshBtn");
  refreshBtn.disabled = true;
  dashMsg.textContent = "";

  const { data, error } = await db
    .from("rsvp")
    .select("id, nombre, cantidad_personas, telefono, email, fecha_confirmacion")
    .order("fecha_confirmacion", { ascending: false });

  refreshBtn.disabled = false;

  if (error) {
    dashMsg.textContent =
      "No se pudo leer la lista. Verifica que tu correo sea el autorizado en la política RLS.";
    console.error(error.message);
    return;
  }

  const tbody = $("#guestRows");
  tbody.replaceChildren();

  if (data.length === 0) {
    const tr = document.createElement("tr");
    const td = makeCell("Todavía no hay confirmaciones.", "empty");
    td.colSpan = 5;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  let totalPersonas = 0;

  data.forEach((row) => {
    totalPersonas += row.cantidad_personas;
    const tr = document.createElement("tr");
    tr.appendChild(makeCell(row.nombre, "", "NOMBRE"));
    tr.appendChild(makeCell(String(row.cantidad_personas), "num", "PERSONAS"));
    tr.appendChild(makeCell(row.telefono, "", "TELÉFONO"));
    tr.appendChild(makeCell(row.email, "", "EMAIL"));
    tr.appendChild(makeCell(formatDate(row.fecha_confirmacion), "", "FECHA"));
    tbody.appendChild(tr);
  });

  $("#totalPersonas").textContent = totalPersonas;
  $("#totalReservas").textContent = data.length;
  $("#updatedAt").textContent =
    "Actualizado a las " +
    new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

/* ---------- Eventos ---------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "";

  if (!db) {
    loginMsg.textContent = "Configura SUPABASE_URL y SUPABASE_ANON_KEY en admin.js.";
    return;
  }

  const btn = $("#loginBtn");
  btn.disabled = true;

  const { error } = await db.auth.signInWithPassword({
    email: $("#loginEmail").value.trim(),
    password: $("#loginPassword").value,
  });

  btn.disabled = false;

  if (error) {
    loginMsg.textContent = "Correo o contraseña incorrectos.";
    return;
  }

  $("#loginPassword").value = "";
  showDashboard();
});

$("#refreshBtn").addEventListener("click", loadGuests);

$("#logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  showLogin();
});

/* ---------- Inicio ---------- */
(async function init() {
  if (!db) {
    showLogin("Configura SUPABASE_URL y SUPABASE_ANON_KEY en admin.js.");
    return;
  }
  const { data } = await db.auth.getSession();
  if (data.session) showDashboard();
  else showLogin();
})();