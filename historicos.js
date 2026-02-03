// =================== API (Render) ===================
const API_BASE = "https://api-monitoreo-nube.onrender.com";
const ZONA = "Z1";

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

// =================== Estado / Datos ===================
let DIAS_POR_MES = {};
let LIMITE = 500;      // paginación simple
const PASO = 500;

// =================== Helpers ===================
function setEstado(msg) {
  if (estado) estado.textContent = msg || "";
}

function limpiarTabla() {
  if (tbody) tbody.innerHTML = "";
}

function addRow(r) {
  if (!tbody) return;

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

// Convierte "HH:MM" -> "HH" (tu backend filtra por HH)
function horaToHH(val) {
  if (!val) return "";
  return String(val).slice(0, 2);
}

// ================== Cargar resumen ==================
async function cargarResumen() {
  setEstado("Cargando meses...");
  try {
    const res = await fetch(`${API_BASE}/api/historial_resumen?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    DIAS_POR_MES = data.dias_por_mes || {};

    // llena meses
    if (selMes) {
      selMes.innerHTML = `<option value="">Todos</option>`;
      (data.meses || []).forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        selMes.appendChild(opt);
      });
    }

    // día deshabilitado al inicio
    if (selDia) {
      selDia.innerHTML = `<option value="">Todos</option>`;
      selDia.disabled = true;
    }

    if (btnExcelMes) btnExcelMes.disabled = true;

    setEstado((data.meses || []).length ? "" : "Aún no hay historial guardado.");
  } catch (e) {
    console.error(e);
    setEstado("Error cargando resumen (mes/día).");
  }
}

function actualizarDiasPorMes() {
  const mes = selMes?.value || "";

  if (!selDia) return;

  selDia.innerHTML = `<option value="">Todos</option>`;

  if (!mes) {
    selDia.disabled = true;
    if (btnExcelMes) btnExcelMes.disabled = true;
    return;
  }

  (DIAS_POR_MES[mes] || []).forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    selDia.appendChild(opt);
  });

  selDia.disabled = false;
  if (btnExcelMes) btnExcelMes.disabled = false;
}

// ================== Cargar tabla ==================
async function cargarTabla() {
  limpiarTabla();
  setEstado("Cargando datos...");

  const params = new URLSearchParams();
  params.set("zona", ZONA);
  params.set("n", String(LIMITE));

  if (selMes?.value) params.set("mes", selMes.value);
  if (selDia?.value) params.set("dia", selDia.value);
  if (inpHora?.value) params.set("hora", horaToHH(inpHora.value));

  params.set("t", String(Date.now()));

  const url = `${API_BASE}/api/historial_filtro?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      setEstado("No hay registros con esos filtros.");
      if (btnCargarMas) btnCargarMas.style.display = "none";
      return;
    }

    rows.forEach(addRow);
    setEstado(`Registros mostrados: ${rows.length} (límite: ${LIMITE})`);

    // mostrar cargar más si parece que hay más
    if (btnCargarMas) {
      btnCargarMas.style.display = (rows.length >= LIMITE) ? "inline-block" : "none";
    }

  } catch (e) {
    console.error(e);
    setEstado("Error cargando datos (revisa consola F12).");
    if (btnCargarMas) btnCargarMas.style.display = "none";
  }
}

// ================== Descargas ==================
function descargarTodo() {
  window.open(`${API_BASE}/api/historial_export?zona=${encodeURIComponent(ZONA)}&t=${Date.now()}`, "_blank");
}

function descargarMes() {
  const mes = selMes?.value || "";
  if (!mes) return;
  window.open(`${API_BASE}/api/historial_export?zona=${encodeURIComponent(ZONA)}&mes=${encodeURIComponent(mes)}&t=${Date.now()}`, "_blank");
}

// ================== Eventos ==================
selMes?.addEventListener("change", () => {
  actualizarDiasPorMes();
});

btnAplicar?.addEventListener("click", () => {
  LIMITE = 500;
  cargarTabla();
});

btnLimpiar?.addEventListener("click", () => {
  if (selMes) selMes.value = "";
  actualizarDiasPorMes();
  if (selDia) selDia.value = "";
  if (inpHora) inpHora.value = "";
  LIMITE = 500;
  cargarTabla();
});

btnExcelTodo?.addEventListener("click", descargarTodo);
btnExcelMes?.addEventListener("click", descargarMes);

btnCargarMas?.addEventListener("click", () => {
  LIMITE += PASO;
  cargarTabla();
});

// ================== Init ==================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarResumen();
  await cargarTabla();
});
