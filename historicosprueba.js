const API_BASE = "https://api-monitoreo-nube.onrender.com";
const ZONA = "Z1";

const selMes = document.getElementById("filtroMes");
const selDia = document.getElementById("filtroDia");
const inpHora = document.getElementById("filtroHora");

const btnAplicar = document.getElementById("btnAplicar");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnExcelTodo = document.getElementById("btnExcelTodo");
const btnExcelMes = document.getElementById("btnExcelMes");

const tbody = document.getElementById("tablaBody");
const estado = document.getElementById("estado");

let DIAS_POR_MES = {};

function setEstado(msg) {
  estado.textContent = msg || "";
}

function limpiarTabla() {
  tbody.innerHTML = "";
}

function addRow(r) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${r.fecha}</td>
    <td>${r.hora}</td>
    <td>${r.temperatura}</td>
    <td>${r.humedad}</td>
    <td>${r.zona}</td>
  `;
  tbody.appendChild(tr);
}

function horaToHH(val) {
  if (!val) return "";
  return val.slice(0, 2); // "11:30" -> "11"
}

// ================== Cargar resumen ==================
async function cargarResumen() {
  setEstado("Cargando meses...");
  try {
    const res = await fetch(`${API_BASE}/api/historial_resumen`);
    const data = await res.json();

    selMes.innerHTML = `<option value="">Mes (todos)</option>`;
    DIAS_POR_MES = data.dias_por_mes || {};

    (data.meses || []).forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      selMes.appendChild(opt);
    });

    setEstado("Resumen cargado");
  } catch (e) {
    console.error(e);
    setEstado("Error cargando resumen");
  }
}

selMes.addEventListener("change", () => {
  const mes = selMes.value;
  selDia.innerHTML = `<option value="">Día (todos)</option>`;

  if (!mes) {
    selDia.disabled = true;
    btnExcelMes.disabled = true;
    return;
  }

  (DIAS_POR_MES[mes] || []).forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    selDia.appendChild(opt);
  });

  selDia.disabled = false;
  btnExcelMes.disabled = false;
});

// ================== Cargar tabla ==================
async function cargarTabla() {
  limpiarTabla();
  setEstado("Cargando datos...");

  const params = new URLSearchParams();
  params.set("zona", ZONA);
  if (selMes.value) params.set("mes", selMes.value);
  if (selDia.value) params.set("dia", selDia.value);
  if (inpHora.value) params.set("hora", horaToHH(inpHora.value));

  const url = `${API_BASE}/api/historial_filtro?${params.toString()}`;

  try {
    const res = await fetch(url);
    const rows = await res.json();

    if (!rows.length) {
      setEstado("No hay registros");
      return;
    }

    rows.forEach(addRow);
    setEstado(`Registros mostrados: ${rows.length}`);
  } catch (e) {
    console.error(e);
    setEstado("Error cargando datos");
  }
}

// ================== Descargas ==================
btnExcelTodo.addEventListener("click", () => {
  window.open(`${API_BASE}/api/historial_export?zona=${ZONA}`, "_blank");
});

btnExcelMes.addEventListener("click", () => {
  if (!selMes.value) return;
  window.open(`${API_BASE}/api/historial_export?zona=${ZONA}&mes=${selMes.value}`, "_blank");
});

// ================== Botones ==================
btnAplicar.addEventListener("click", cargarTabla);

btnLimpiar.addEventListener("click", () => {
  selMes.value = "";
  selDia.innerHTML = `<option value="">Día (todos)</option>`;
  selDia.disabled = true;
  inpHora.value = "";
  btnExcelMes.disabled = true;
  cargarTabla();
});

// ================== INIT ==================
(async function init() {
  await cargarResumen();
  await cargarTabla();
})();
