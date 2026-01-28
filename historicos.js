// =================== Config API (Render) ===================
const API_BASE = "https://api-monitoreo-nube.onrender.com";
const ZONA = "Z1";

// cuántos registros máximo mostrar en tabla por carga
let LIMITE = 1500;
let offsetVirtual = 0; // (simple) para "cargar más" desde el final

// =================== Helpers ===================
function $(id) {
  return document.getElementById(id);
}

function setEstado(msg) {
  const el = $("estado");
  if (el) el.textContent = msg;
}

function limpiarTabla() {
  const tbody = document.querySelector("#tablaHistoricos tbody");
  if (tbody) tbody.innerHTML = "";
}

function filaTabla({ fecha, hora, temperatura, humedad, zona }) {
  const tr = document.createElement("tr");

  const t = (temperatura === null || temperatura === undefined) ? "" : Number(temperatura).toFixed(2);
  const h = (humedad === null || humedad === undefined) ? "" : Number(humedad).toFixed(2);

  tr.innerHTML = `
    <td>${fecha || ""}</td>
    <td>${hora || ""}</td>
    <td>${t}</td>
    <td>${h}</td>
    <td>${zona || "Z1"}</td>
  `;
  return tr;
}

// arma URL /api/historial_filtrado con filtros del UI
function buildFiltroUrl({ month = "", date = "", hour = "", n = LIMITE } = {}) {
  const qs = new URLSearchParams();
  qs.set("zona", ZONA);
  if (month) qs.set("month", month);
  if (date) qs.set("date", date);
  if (hour) qs.set("hour", hour); // formato "HH:MM"
  qs.set("n", String(n));
  // cache buster
  qs.set("t", String(Date.now()));
  return `${API_BASE}/api/historial_filtrado?${qs.toString()}`;
}

// =================== Carga inicial de opciones ===================
async function cargarOpcionesMes() {
  // Como no tienes endpoint de "resumen", inferimos meses leyendo una muestra grande del historial_filtrado sin filtros.
  // Si prefieres, luego hacemos un endpoint /api/historial_resumen (más eficiente).
  try {
    setEstado("Cargando meses disponibles...");

    const url = buildFiltroUrl({ n: 10000 });
    const res = await fetch(url, { cache: "no-store" });
    const arr = await res.json();

    // extrae meses únicos YYYY-MM de timestamp/fecha
    const mesesSet = new Set();
    const diasPorMes = new Map(); // "YYYY-MM" -> Set("YYYY-MM-DD")

    arr.forEach(x => {
      const fecha = x.fecha || (x.timestamp ? x.timestamp.slice(0, 10) : "");
      if (!fecha || fecha.length < 7) return;
      const ym = fecha.slice(0, 7);
      mesesSet.add(ym);

      if (!diasPorMes.has(ym)) diasPorMes.set(ym, new Set());
      diasPorMes.get(ym).add(fecha);
    });

    const meses = Array.from(mesesSet).sort();
    const selMes = $("filtroMes");
    const selDia = $("filtroDia");

    // guarda para usar al cambiar mes
    window.__diasPorMes = diasPorMes;

    // llena select meses
    if (selMes) {
      selMes.innerHTML = `<option value="">Todos</option>`;
      meses.forEach(m => {
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

    setEstado("Listo. Elige filtros y presiona “Aplicar filtros”.");
  } catch (e) {
    console.error(e);
    setEstado("No se pudieron cargar meses. Aun así puedes usar la tabla.");
  }
}

function onMesChange() {
  const mes = $("filtroMes")?.value || "";
  const selDia = $("filtroDia");
  const btnExcelMes = $("btnExcelMes");

  // habilitar descarga por mes solo si hay mes
  if (btnExcelMes) btnExcelMes.disabled = !mes;

  if (!selDia) return;

  selDia.innerHTML = `<option value="">Todos</option>`;

  if (!mes) {
    selDia.disabled = true;
    return;
  }

  const diasSet = window.__diasPorMes?.get(mes);
  const dias = diasSet ? Array.from(diasSet).sort() : [];

  dias.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    selDia.appendChild(opt);
  });

  selDia.disabled = false;
}

// =================== Pintar tabla desde API ===================
async function cargarTabla({ append = false } = {}) {
  const mes = $("filtroMes")?.value || "";
  const dia = $("filtroDia")?.value || "";
  const hora = $("filtroHora")?.value || ""; // "HH:MM"

  // si hay dia, ya no necesitas month (pero no estorba)
  const url = buildFiltroUrl({
    month: mes,
    date: dia,
    hour: hora,
    n: LIMITE
  });

  try {
    setEstado("Cargando datos...");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arr = await res.json();

    // arr viene viejo->nuevo (así lo dejamos en app.py)
    const tbody = document.querySelector("#tablaHistoricos tbody");
    if (!tbody) return;

    if (!append) {
      limpiarTabla();
      offsetVirtual = 0;
    }

    arr.forEach(row => {
      tbody.appendChild(
        filaTabla({
          fecha: row.fecha,
          hora: row.hora,
          temperatura: row.temperatura,
          humedad: row.humedad,
          zona: row.zona
        })
      );
    });

    setEstado(`Mostrando ${arr.length} registros (zona ${ZONA}).`);

    // Mostrar botón "cargar más" si llegó al límite
    const btnMas = $("btnCargarMas");
    if (btnMas) {
      btnMas.style.display = (arr.length >= LIMITE) ? "inline-block" : "none";
    }
  } catch (e) {
    console.error(e);
    setEstado("Error cargando datos. Revisa que la API esté en línea.");
  }
}

// =================== Descargas Excel ===================
function descargarExcelTodo() {
  const url = `${API_BASE}/api/export.xlsx?zona=${encodeURIComponent(ZONA)}&t=${Date.now()}`;
  window.open(url, "_blank");
}

function descargarExcelMes() {
  const mes = $("filtroMes")?.value || "";
  if (!mes) return;

  const url = `${API_BASE}/api/export.xlsx?zona=${encodeURIComponent(ZONA)}&month=${encodeURIComponent(mes)}&t=${Date.now()}`;
  window.open(url, "_blank");
}

// =================== UI Events ===================
function limpiarFiltros() {
  const selMes = $("filtroMes");
  const selDia = $("filtroDia");
  const inpHora = $("filtroHora");
  const btnExcelMes = $("btnExcelMes");

  if (selMes) selMes.value = "";
  if (selDia) {
    selDia.value = "";
    selDia.disabled = true;
    selDia.innerHTML = `<option value="">Todos</option>`;
  }
  if (inpHora) inpHora.value = "";
  if (btnExcelMes) btnExcelMes.disabled = true;

  cargarTabla();
}

// =================== Init ===================
document.addEventListener("DOMContentLoaded", () => {
  // eventos
  $("filtroMes")?.addEventListener("change", onMesChange);

  $("btnAplicar")?.addEventListener("click", () => cargarTabla());
  $("btnLimpiar")?.addEventListener("click", limpiarFiltros);

  $("btnExcelTodo")?.addEventListener("click", descargarExcelTodo);
  $("btnExcelMes")?.addEventListener("click", descargarExcelMes);

  $("btnCargarMas")?.addEventListener("click", () => {
    // versión simple: aumenta límite y recarga (si quieres paginación real luego lo hacemos)
    LIMITE += 1500;
    cargarTabla();
  });

  // arranque
  cargarOpcionesMes();
  cargarTabla();
});
