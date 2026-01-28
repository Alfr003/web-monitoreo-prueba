// =================== Config API (Render) ===================
const API_BASE = "https://api-monitoreo-nube.onrender.com";
const ZONA = "Z1";

// Para "cargar más"
let LIMITE = 500;   // empieza con 500 filas
const PASO = 500;   // cada click suma 500

// =================== DOM ===================
const selMes = document.getElementById("filtroMes");
const selDia = document.getElementById("filtroDia");
const inpHora = document.getElementById("filtroHora");

const btnAplicar = document.getElementById("btnAplicar");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnExcelTodo = document.getElementById("btnExcelTodo");
const btnExcelMes = document.getElementById("btnExcelMes");
const btnCargarMas = document.getElementById("btnCargarMas");

const estado = document.getElementById("estado");
const tbody = document.querySelector("#tablaHistoricos tbody");

let DIAS_POR_MES = {}; // lo llena /api/historial_resumen

// =================== Helpers ===================
function setEstado(msg) {
  if (estado) estado.textContent = msg || "";
}

function limpiarTabla() {
  tbody.innerHTML = "";
}

function addRow(r) {
  const tr = document.createElement("tr");

  const t = (r.temperatura === null || r.temperatura === undefined) ? "" : Number(r.temperatura).toFixed(2);
  const h = (r.humedad === null || r.humedad === undefined) ? "" : Number(r.humedad).toFixed(2);

  tr.innerHTML = `
    <td>${r.fecha || ""}</td>
    <td>${r.hora || ""}</td>
    <td>${t}</td>
    <td>${h}</td>
    <td>${r.zona || "Z1"}</td>
  `;
  tbody.appendChild(tr);
}

// "HH:MM" -> "HH" (porque tu backend filtra por hora en formato HH)
function horaToHH(timeValue) {
  if (!timeValue) return "";
  return String(timeValue).slice(0, 2);
}

// =================== Resumen Mes/Día ===================
async function cargarResumen() {
  setEstado("Cargando meses disponibles...");
  try {
    const url = `${API_BASE}/api/historial_resumen?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const meses = data.meses || [];
    DIAS_POR_MES = data.dias_por_mes || {};

    // llena meses
    selMes.innerHTML = `<option value="">Todos</option>`;
    meses.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      selMes.appendChild(opt);
    });

    // día deshabilitado si no hay mes
    selDia.innerHTML = `<option value="">Todos</option>`;
    selDia.disabled = true;

    btnExcelMes.disabled = true;

    setEstado(meses.length ? "" : "Aún no hay historial guardado.");
  } catch (e) {
    console.error(e);
    setEstado("Error cargando meses/días. Revisa consola (F12).");
  }
}

function actualizarDiasPorMes() {
  const mes = selMes.value;

  selDia.innerHTML = `<option value="">Todos</option>`;

  if (!mes) {
    selDia.disabled = true;
    btnExcelMes.disabled = true;
    return;
  }

  const dias = DIAS_POR_MES[mes] || [];
  dias.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;        // "YYYY-MM-DD"
    opt.textContent = d;
    selDia.appendChild(opt);
  });

  selDia.disabled = false;
  btnExcelMes.disabled = false;
}

// =================== Cargar tabla ===================
async function cargarTabla() {
  const mes = selMes.value || "";
  const dia = selDia.value || "";
  const hora = horaToHH(inpHora.value); // API usa HH

  setEstado("Cargando tabla...");
  limpiarTabla();

  try {
    const params = new URLSearchParams();
    params.set("zona", ZONA);
    if (mes) params.set("mes", mes);
    if (dia) params.set("dia", dia);
    if (hora) params.set("hora", hora);
    params.set("n", String(LIMITE));
    params.set("t", String(Date.now()));

    const url = `${API_BASE}/api/historial_filtro?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      setEstado("No hay registros con esos filtros.");
      btnCargarMas.style.display = "none";
      return;
    }

    rows.forEach(addRow);

    setEstado(`Mostrando ${rows.length} registros (límite actual: ${LIMITE}).`);
    btnCargarMas.style.display = (rows.length >= LIMITE) ? "inline-block" : "none";
  } catch (e) {
    console.error(e);
    setEstado("Error cargando tabla. Revisa consola (F12).");
    btnCargarMas.style.display = "none";
  }
}

// =================== Descargas ===================
function descargarTodo() {
  const url = `${API_BASE}/api/historial_export?zona=${encodeURIComponent(ZONA)}&t=${Date.now()}`;
  window.open(url, "_blank");
}

function descargarMes() {
  const mes = selMes.value;
  if (!mes) return;
  const url = `${API_BASE}/api/historial_export?zona=${encodeURIComponent(ZONA)}&mes=${encodeURIComponent(mes)}&t=${Date.now()}`;
  window.open(url, "_blank");
}

// =================== Eventos ===================
selMes.addEventListener("change", () => {
  actualizarDiasPorMes();
});

btnAplicar.addEventListener("click", () => {
  LIMITE = 500;
  cargarTabla();
});

btnLimpiar.addEventListener("click", () => {
  selMes.value = "";
  actualizarDiasPorMes();
  selDia.value = "";
  inpHora.value = "";
  LIMITE = 500;
  cargarTabla();
});

btnExcelTodo.addEventListener("click", descargarTodo);
btnExcelMes.addEventListener("click", descargarMes);

btnCargarMas.addEventListener("click", () => {
  LIMITE += PASO;
  cargarTabla();
});

// =================== Init ===================
(async function init() {
  await cargarResumen();
  await cargarTabla();
})();
