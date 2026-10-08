/* ==========================================================
   INVITACIÓN 55 AÑOS — script.js
   ========================================================== */

/* ----------------------------------------------------------
   CONFIGURACIÓN DE SUPABASE
   Solo se usan la URL del proyecto y la clave PÚBLICA (anon).
   NUNCA pegues aquí la clave "service_role".
   ---------------------------------------------------------- */
const SUPABASE_URL = "https://lpmjpudbfsmeshtfmjtt.supabase.co"; // ← reemplazar
const SUPABASE_ANON_KEY = "sb_publishable_zsCNrNIumhjiFPG91eIYQQ_-BlkSKp0"; // ← reemplazar

/* ----------------------------------------------------------
   ¿Mostrar a los invitados el contador "YA CONFIRMARON"?
   true  = lo ven todos los invitados
   false = se oculta; solo tú ves los totales en admin.html
   ---------------------------------------------------------- */
const SHOW_PUBLIC_COUNTER = false;

/* ----------------------------------------------------------
   UTILIDADES
   ---------------------------------------------------------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const supabaseReady =
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  !SUPABASE_ANON_KEY.includes("TU_SUPABASE");

const db = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ----------------------------------------------------------
   IMÁGENES FALTANTES
   Si aún no colocas un archivo en /assets/, se oculta sin romper nada.
   ---------------------------------------------------------- */
$$("img").forEach((img) => {
  const markMissing = () => img.classList.add("is-missing");
  img.addEventListener("error", markMissing);
  if (img.complete && img.naturalWidth === 0) markMissing();
});

/* ----------------------------------------------------------
   SECUENCIA DE ANIMACIÓN
   Para añadir un elemento nuevo a la secuencia, agrega una fila:
   { selector: ".mi-clase", delay: ms_de_espera_antes }
   El orden de este arreglo ES el orden de aparición.
   ---------------------------------------------------------- */
const SEQUENCE = [
  { selector: ".background", delay: 0 }, //      1. Fondo (1.2 s)
  { selector: ".wood-circle", delay: 900 }, //   2. Círculo gris (1.2 s)
  { selector: ".flowers-top", delay: 900 }, //   3. Flores superiores
  { selector: ".flowers-bottom", delay: 120 }, // 3. Flores inferiores
  { selector: ".invitation-card", delay: 800 }, // 4. Tarjeta (1.4 s)
  { selector: ".photo-container", delay: 900 }, // 5. Fotografía (1.2 s)
];

const TEXT_GAP = 210; // ms entre cada texto (150–250 ms)

async function startInvitation() {
  const hero = $("#hero");
  window.scrollTo(0, 0);

  try {
    // Fases 1 a 5: fondo, círculo, flores, tarjeta, fotografía
    for (const step of SEQUENCE) {
      await wait(prefersReducedMotion ? Math.min(step.delay, 250) : step.delay);
      $$(step.selector).forEach((el) => el.classList.add("show"));
    }

    // Fase 6: textos, uno por uno, en el orden del HTML.
    // Los divisores se muestran junto al texto que les sigue.
    await wait(prefersReducedMotion ? 250 : 800);

    const steps = [];
    let pendingDividers = [];
    $$(".invitation-content .reveal-text").forEach((el) => {
      if (el.classList.contains("divider")) {
        pendingDividers.push(el);
      } else {
        steps.push({ el, extras: pendingDividers });
        pendingDividers = [];
      }
    });

    for (const { el, extras } of steps) {
      extras.forEach((d) => d.classList.add("show"));
      el.classList.add("show");
      await wait(el.classList.contains("anniversary-number") ? 420 : TEXT_GAP);
    }

    // Fase 7: brillo final (una sola vez) y flores flotando
    await wait(prefersReducedMotion ? 300 : 1100);
    $(".card-shine").classList.add("play");
    hero.classList.add("settled");
    await wait(prefersReducedMotion ? 0 : 600);
  } finally {
    // Fase 8: se libera el scroll para llegar a la sección de confirmación
    document.body.classList.remove("no-scroll");
  }
}

/* ----------------------------------------------------------
   MÚSICA DE FONDO (assets/cancion.mp3)
   ---------------------------------------------------------- */
const music = $("#bgMusic");
const musicBtn = $("#musicToggle");
const MUSIC_VOLUME = 0.6; // 0 a 1
let musicWanted = false; //   el invitado quiere música (no la silenció)

function setMusicUI(playing) {
  musicBtn.classList.toggle("is-playing", playing);
  musicBtn.setAttribute("aria-pressed", String(playing));
  musicBtn.setAttribute(
    "aria-label",
    playing ? "Silenciar música" : "Activar música"
  );
}

async function startMusic() {
  musicWanted = true;
  musicBtn.classList.add("visible");
  setMusicUI(true);
  try {
    // Entrada suave
    music.volume = 0;
    await music.play();
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await wait(60);
      if (!musicWanted) return;
      music.volume = (MUSIC_VOLUME * i) / steps;
    }
  } catch (err) {
    console.warn("No se pudo reproducir la música:", err.message);
    setMusicUI(false);
  }
}

musicBtn.addEventListener("click", async () => {
  if (music.paused) {
    musicWanted = true;
    setMusicUI(true);
    try {
      music.volume = MUSIC_VOLUME;
      await music.play();
    } catch (err) {
      setMusicUI(false);
    }
  } else {
    musicWanted = false;
    music.pause();
    setMusicUI(false);
  }
});

// Si el archivo no existe, se quita el botón y la página sigue normal
music.addEventListener("error", () => musicBtn.remove());

// Pausa al cambiar de pestaña o bloquear el celular, y retoma al volver
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    music.pause();
  } else if (musicWanted) {
    music.play().catch(() => setMusicUI(false));
  }
});

/* ----------------------------------------------------------
   PANTALLA DE BIENVENIDA
   ---------------------------------------------------------- */
const intro = $("#intro-screen");

$("#openInvitation").addEventListener("click", async () => {
  startMusic(); // el clic es el permiso que el navegador necesita para el sonido
  intro.classList.add("hide");
  setTimeout(() => (intro.style.display = "none"), 1000);
  await wait(500);
  startInvitation();
});

/* ----------------------------------------------------------
   INTERSECTION OBSERVER (secciones que aparecen al hacer scroll)
   ---------------------------------------------------------- */
let rsvpRevealed = false;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);

      if (entry.target.closest("#rsvp")) {
        rsvpRevealed = true;
        if (confirmedTotal !== null) renderCounter(confirmedTotal);
      }
    });
  },
  { threshold: 0.2 }
);

$$("[data-observe]").forEach((el) => revealObserver.observe(el));

/* ----------------------------------------------------------
   CONTADOR REAL (suma de cantidad_personas desde Supabase)
   ---------------------------------------------------------- */
const counterEl = $("#guestCount");
const labelEl = $("#guestLabel");

let confirmedTotal = null; // valor real traído de Supabase
let shownTotal = 0; //       valor mostrado actualmente

function animateNumber(from, to) {
  if (prefersReducedMotion || from === to) {
    counterEl.textContent = to;
    return;
  }
  const duration = 1100;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counterEl.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderCounter(total) {
  if (total === shownTotal && counterEl.textContent === String(total)) return;

  animateNumber(shownTotal, total);
  labelEl.textContent = total === 1 ? "PERSONA" : "PERSONAS";

  // Pulso scale 1 → 1.15 → 1
  counterEl.classList.remove("bump");
  void counterEl.offsetWidth; // reinicia la animación
  counterEl.classList.add("bump");
  counterEl.addEventListener(
    "animationend",
    () => counterEl.classList.remove("bump"),
    { once: true }
  );

  shownTotal = total;
}

async function fetchTotal() {
  if (!db) return null;
  // La función SQL total_personas() suma cantidad_personas (ver supabase.sql)
  const { data, error } = await db.rpc("total_personas");
  if (error) {
    console.error("No se pudo leer el contador:", error.message);
    return null;
  }
  return Number(data) || 0;
}

async function refreshCounter() {
  const total = await fetchTotal();
  if (total === null) return;
  confirmedTotal = total;
  if (rsvpRevealed) renderCounter(total);
}

if (SHOW_PUBLIC_COUNTER) {
  refreshCounter();
} else {
  $(".attendance-counter").remove();
  $("#successCount").remove();
}

/* ----------------------------------------------------------
   MODAL
   ---------------------------------------------------------- */
const modal = $("#rsvpModal");
const form = $("#rsvpForm");
const successBox = $("#successMessage");
const errorEl = $("#formError");
const submitBtn = $("#submitBtn");
let lastFocused = null;

function openModal() {
  lastFocused = document.activeElement;
  form.hidden = false;
  successBox.classList.remove("show");
  errorEl.textContent = "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  setTimeout(() => $("#nombre").focus(), 350);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocused) lastFocused.focus();
}

$("#rsvpButton").addEventListener("click", openModal);
$("#closeModal").addEventListener("click", closeModal);
$("#successClose").addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

/* ----------------------------------------------------------
   VALIDACIÓN Y ENVÍO A SUPABASE
   ---------------------------------------------------------- */
function validate(values) {
  if (values.nombre.length < 3) {
    return "Escribe tu nombre completo.";
  }
  if (
    !Number.isInteger(values.cantidad) ||
    values.cantidad < 1 ||
    values.cantidad > 20
  ) {
    return "Indica entre 1 y 20 personas.";
  }
  return "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const values = {
    nombre: $("#nombre").value.trim().replace(/\s+/g, " "),
    cantidad: parseInt($("#cantidad").value, 10),
  };

  const problem = validate(values);
  if (problem) {
    errorEl.textContent = problem;
    return;
  }

  if (!db) {
    errorEl.textContent =
      "La confirmación aún no está conectada. Configura Supabase en script.js.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "ENVIANDO...";

  const { error } = await db.from("rsvp").insert([
    {
      nombre: values.nombre,
      cantidad_personas: values.cantidad,
    },
  ]);

  submitBtn.disabled = false;
  submitBtn.textContent = "CONFIRMAR MI ASISTENCIA";

  if (error) {
    console.error("Error al guardar:", error.message);
    errorEl.textContent =
      "No pudimos guardar tu confirmación. Revisa tu conexión e inténtalo de nuevo.";
    return;
  }

  // Éxito: actualizar contador real y mostrar mensaje
  form.reset();
  $("#cantidad").value = 1;
  form.hidden = true;
  successBox.classList.add("show");

  const total = SHOW_PUBLIC_COUNTER ? await fetchTotal() : null;
  if (total !== null) {
    confirmedTotal = total;
    const successCount = $("#successCount");
    if (successCount) successCount.textContent =
      total === 1
        ? "1 persona ha confirmado"
        : `${total} personas han confirmado`;
    renderCounter(total);
  }
});