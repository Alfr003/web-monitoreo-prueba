// =================== Config API (Render) ===================
const API_BASE = "https://api-monitoreo-nube.onrender.com";
const ZONA = "Z1";

// cada cuánto refrescar (1 min)
const REFRESH_MS = 60_000;

// cuántos puntos (ej: 60 = 1 hora si llega cada minuto)
const N_PUNTOS = 60;

// =================== Helpers ===================
function obtenerHoraLocal(ts) {
  // ts puede ser ISO: "2026-01-28T11:19:35.489761" o "YYYY-MM-DD HH:MM:SS"
  if (!ts) return "--:--";

  // Normaliza a algo que Date entienda
  const iso = ts.includes("T") ? ts : ts.replace(" ", "T");
  const d = new Date(iso);

  // Si no parseó bien, fallback al recorte
  if (isNaN(d.getTime())) return ts.slice(11, 16);

  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function setAnalisis(texto) {
  const el = document.getElementById("analisis");
  if (el) el.innerText = texto;
}

// =================== Charts ===================
const ctxTemp = document.getElementById("graficaTempZ1").getContext("2d");
const ctxHum = document.getElementById("graficaHumZ1").getContext("2d");

const labels = [];
const dataTemp = [];
const dataHum = [];

const chartTemp = new Chart(ctxTemp, {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Temperatura (°C)",
      data: dataTemp,
      tension: 0.25
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { ticks: { callback: (v) => `${v}` } } }
  }
});

const chartHum = new Chart(ctxHum, {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Humedad (%)",
      data: dataHum,
      tension: 0.25
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { ticks: { callback: (v) => `${v}` } } }
  }
});

// =================== Cargar datos reales ===================
async function actualizarGraficas() {
  try {
    const url = `${API_BASE}/api/historial?n=${N_PUNTOS}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arr = await res.json();

    // Filtra por zona y quédate con los más recientes
    const datosZ1 = (arr || [])
      .filter(x => (x.zona || "Z1") === ZONA)
      .slice(-N_PUNTOS);

    // Vacía arreglos manteniendo referencia (Chart.js)
    labels.length = 0;
    dataTemp.length = 0;
    dataHum.length = 0;

    // Queremos ver el tiempo en orden (viejo->nuevo)
    datosZ1.forEach(d => {
      const ts = d.ts_server || d.timestamp || "";
      labels.push(obtenerHoraLocal(ts));
      dataTemp.push(Number(d.temperatura));
      dataHum.push(Number(d.humedad));
    });

    chartTemp.update();
    chartHum.update();

    // Resumen
    const last = datosZ1[datosZ1.length - 1];
    if (last) {
      const t = Number(last.temperatura);
      const h = Number(last.humedad);

      let msg = `Última lectura Z1: ${t.toFixed(2)} °C | ${h.toFixed(2)} %`;

      // regla simple (ajústala si quieres)
      if (t >= 30) msg += " — ⚠️ Temperatura alta.";
      else if (t <= 15) msg += " — ⚠️ Temperatura baja.";
      else msg += " — ✅ Temperatura normal.";

      if (h >= 85) msg += " ⚠️ Humedad alta.";
      else if (h <= 55) msg += " ⚠️ Humedad baja.";
      else msg += " ✅ Humedad normal.";

      setAnalisis(msg);
    } else {
      setAnalisis("Aún no hay datos suficientes en historial para graficar.");
    }
  } catch (err) {
    console.error("Error actualizando gráficas:", err);
    setAnalisis("Error cargando datos (revisa que la API esté en línea y que exista historial).");
  }
}

actualizarGraficas();
setInterval(actualizarGraficas, REFRESH_MS);
