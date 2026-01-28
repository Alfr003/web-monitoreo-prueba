// ====== CONFIG ======
const API_HIST = "https://api-monitoreo-nube.onrender.com/api/historial?n=200";

// si tus datos llegan cada 5s, déjalo en 5000
const REFRESH_MS = 5000;

// límite de filas visibles
const MAX_FILAS = 50;

// ====== ESTADO ======
const vistos = new Set();   // para no duplicar
let primera = true;

// ====== HELPERS ======
function idRegistro(d) {
  // id único simple
  return `${d.timestamp}|${d.ts_server}|${d.zona}`;
}

function extraerHora(ts) {
  // ts viene como "YYYY-MM-DD HH:MM:SS"
  // devolvemos solo "HH:MM:SS"
  if (!ts) return "--:--:--";
  const parts = ts.split(" ");
  return parts.length === 2 ? parts[1] : ts;
}

function fmtTemp(t) {
  if (t === undefined || t === null) return "-";
  return `${Number(t).toFixed(2)} °C`;
}

function fmtHum(h) {
  if (h === undefined || h === null) return "-";
  return `${Number(h).toFixed(2)} %`;
}

function crearFila(d) {
  const tr = document.createElement("tr");

  const tdHora = document.createElement("td");
  tdHora.textContent = extraerHora(d.timestamp);

  const tdTemp = document.createElement("td");
  tdTemp.textContent = fmtTemp(d.temperatura);

  const tdHum = document.createElement("td");
  tdHum.textContent = fmtHum(d.humedad);

  tr.appendChild(tdHora);
  tr.appendChild(tdTemp);
  tr.appendChild(tdHum);

  return tr;
}

function insertarArriba(tr) {
  const tbody = document.getElementById("tbody");
  tbody.prepend(tr);

  // recortar a MAX_FILAS
  while (tbody.children.length > MAX_FILAS) {
    tbody.removeChild(tbody.lastChild);
  }
}

// ====== MAIN ======
async function actualizar() {
  const estadoEl = document.getElementById("estado");

  try {
    estadoEl.textContent = "Actualizando...";

    const r = await fetch(API_HIST, { cache: "no-store" });
    const arr = await r.json();

    // ordenar por ts_server para consistencia
    arr.sort((a, b) => (a.ts_server || "").localeCompare(b.ts_server || ""));

    // primera carga: limpiamos tabla y cargamos últimos MAX_FILAS (sin duplicar)
    if (primera) {
      const tbody = document.getElementById("tbody");
      tbody.innerHTML = "";

      const ultimos = arr.slice(-MAX_FILAS);
      for (const d of ultimos) {
        vistos.add(idRegistro(d));
        insertarArriba(crearFila(d));
      }

      primera = false;
      estadoEl.textContent = "Listo (en vivo)";
      return;
    }

    // cargas siguientes: solo agrega los nuevos
    let nuevos = 0;
    for (const d of arr) {
      const id = idRegistro(d);
      if (!vistos.has(id)) {
        vistos.add(id);
        insertarArriba(crearFila(d));
        nuevos++;
      }
    }

    estadoEl.textContent = nuevos > 0 ? `Nuevos: ${nuevos}` : "Sin cambios";
  } catch (e) {
    console.log(e);
    estadoEl.textContent = "Error consultando el historial";
  }
}

document.getElementById("intervaloTxt").textContent = `cada ${REFRESH_MS / 1000}s`;

actualizar();
setInterval(actualizar, REFRESH_MS);
