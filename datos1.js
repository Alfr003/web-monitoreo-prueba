// ========== 1. Mapa Interactivo ==========
const mapa = L.map('mapaSensor').setView([10.0777, -84.4857], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

L.marker([10.0777, -84.4857])
  .addTo(mapa)
  .bindPopup('Estación de Monitoreo')
  .openPopup();

L.circle([10.0777, -84.4857], {
  color: '#2196f3',
  fillColor: '#2196f3',
  fillOpacity: 0.2,
  radius: 10
}).addTo(mapa);


// ✅ tu API en Render (UNA SOLA VEZ)
const API_BASE = "http://10.80.205.28:5000";


// ========== 2. Llenar tablaDatos desde API en Render (autosync cada 5s) ==========
async function actualizarTablaDatos() {
  try {
    const res = await fetch(`${API_BASE}/api/historial?n=12`, { cache: "no-store" });
    const data = await res.json();

    const tbody = document.querySelector("#tablaDatos tbody");
    tbody.innerHTML = "";

    // API regresa historial (viejo->nuevo o nuevo->viejo depende),
    // aquí lo forzamos a mostrar más reciente arriba:
    data.reverse().forEach(d => {
      const fila = document.createElement("tr");

      // 👇 usa ts_server (porque en tu app.py estás guardando ts_server)
      const ts = d.ts_server || d.timestamp || "";
      const hora = ts ? ts.slice(11,16) : "--:--";

      fila.innerHTML = `
        <td>${hora}</td>
        <td>${(d.temperatura ?? "-")} °C</td>
        <td>${(d.humedad ?? "-")} %</td>
      `;

      tbody.appendChild(fila);
    });

  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

actualizarTablaDatos();
setInterval(actualizarTablaDatos, 5000);


// ================== 3) Tabla Histórica REAL (últimos 5 días) desde API ==================
const HIST_INTERVAL_MS = 30000; // 30s
const ZONA = "Z1";

// helper: convierte {t,h} a "hum | temp"
function formatoHumTemp(celdaObj) {
  const t = Number(celdaObj.t).toFixed(2);
  const h = Number(celdaObj.h).toFixed(2);
  return `${h} | ${t}`;
}

function crearContenedorCelda(texto, tooltip) {
  const contenedor = document.createElement("div");
  contenedor.style.display = "flex";
  contenedor.style.justifyContent = "center";
  contenedor.style.alignItems = "center";
  contenedor.style.height = "100%";
  contenedor.style.width = "100%";
  contenedor.style.backdropFilter = "blur(4px)";
  contenedor.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  contenedor.style.borderRadius = "6px";
  contenedor.style.fontSize = "0.75rem";
  contenedor.style.fontWeight = "bold";
  contenedor.style.color = "white";
  contenedor.title = tooltip || "";

  const span = document.createElement("span");
  span.innerText = texto;
  contenedor.appendChild(span);

  return contenedor;
}

function pintarTablaHistorica(payload) {
  const tabla = document.getElementById("tablaHistorica");
  if (!tabla) return;

  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");
  if (!thead || !tbody) return;

  // 1) headers (días)
  const headerRow = thead.querySelector("tr");
  if (headerRow) {
    const ths = headerRow.querySelectorAll("th");
    for (let i = 0; i < 5; i++) {
      if (ths[1 + i]) ths[1 + i].innerText = payload.dias?.[i] ?? `Día ${i + 1}`;
    }
  }

  // 2) body
  tbody.innerHTML = "";

  const horas = payload.horas || [];
  const celdas = payload.celdas || {};

  horas.forEach((hora) => {
    const fila = document.createElement("tr");

    // Hora
    const tdHora = document.createElement("td");
    tdHora.innerText = hora;
    fila.appendChild(tdHora);

    // 5 días
    for (let d = 0; d < 5; d++) {
      const td = document.createElement("td");
      const celdaObj = celdas?.[hora]?.[d] ?? null;

      if (celdaObj) {
        const texto = formatoHumTemp(celdaObj);
        const tooltip = `Temp: ${celdaObj.t}°C | Hum: ${celdaObj.h}%\n${celdaObj.ts || ""}`;
        td.appendChild(crearContenedorCelda(texto, tooltip));
      } else {
        td.innerHTML = "";
      }

      fila.appendChild(td);
    }

    // Recomendado
    const tdRec = document.createElement("td");
    tdRec.appendChild(crearContenedorCelda("70 | 24", "Recomendado: Temp 23-26°C | Hum 65-75%"));
    fila.appendChild(tdRec);

    tbody.appendChild(fila);
  });
}

async function actualizarTablaHistorica() {
  try {
    const url = `${API_BASE}/api/historicos?zona=${encodeURIComponent(ZONA)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    pintarTablaHistorica(payload);
  } catch (err) {
    console.error("Error /api/historicos:", err);
  }
}

actualizarTablaHistorica();
setInterval(actualizarTablaHistorica, HIST_INTERVAL_MS);


// ========== 4. Efecto scroll para secciones ==========
document.addEventListener("DOMContentLoaded", () => {
  const secciones = document.querySelectorAll(".seccion-estudio-blanco, .seccion-estudio-gris");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("seccion-visible");
      }
    });
  }, { threshold: 0.2 });

  secciones.forEach(sec => observer.observe(sec));
});

