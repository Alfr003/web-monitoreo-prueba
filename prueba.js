const API_ULTIMO = "https://api-monitoreo-nube.onrender.com/api/datos";
const API_HIST   = "https://api-monitoreo-nube.onrender.com/api/historial?n=200";

// para no repetir líneas
let vistos = new Set();
let primera = true;

function idRegistro(d) {
  return `${d.timestamp}|${d.ts_server}|${d.zona}`;
}

function linea(d) {
  return `${d.timestamp} | ${d.zona} | T=${d.temperatura}°C | H=${d.humedad}% | srv=${d.ts_server}`;
}

function agregarArriba(texto) {
  const hist = document.getElementById("historial");
  const div = document.createElement("div");
  div.textContent = texto;
  hist.prepend(div);

  // límite visual
  while (hist.children.length > 200) hist.removeChild(hist.lastChild);
}

async function cargarUltimo() {
  const ultimo = document.getElementById("ultimo");
  try {
    const r = await fetch(API_ULTIMO, { cache: "no-store" });
    const d = await r.json();
    ultimo.textContent = linea(d);
  } catch (e) {
    ultimo.textContent = "Error consultando /api/datos";
  }
}

async function cargarHistorial() {
  const estado = document.getElementById("estado");
  try {
    estado.textContent = "Actualizando...";
    const r = await fetch(API_HIST, { cache: "no-store" });
    const arr = await r.json();

    // orden por servidor
    arr.sort((a, b) => (a.ts_server || "").localeCompare(b.ts_server || ""));

    let nuevos = 0;

    // primera carga: solo mostramos los últimos 10 para empezar limpio
    if (primera) {
      const ultimos = arr.slice(-10);
      ultimos.forEach(d => {
        vistos.add(idRegistro(d));
        agregarArriba(linea(d));
      });
      primera = false;
      estado.textContent = "Listo";
      return;
    }

    // siguientes ciclos: solo agrega los nuevos
    for (const d of arr) {
      const id = idRegistro(d);
      if (!vistos.has(id)) {
        vistos.add(id);
        agregarArriba(linea(d));
        nuevos++;
      }
    }

    estado.textContent = nuevos > 0 ? `Nuevos: ${nuevos}` : "Sin cambios";
  } catch (e) {
    estado.textContent = "Error consultando /api/historial";
  }
}

// arranque
cargarUltimo();
cargarHistorial();

// cada 5s (igual que tu envío actual)
setInterval(() => {
  cargarUltimo();
  cargarHistorial();
}, 5000);
