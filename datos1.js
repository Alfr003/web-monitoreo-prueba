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


// ========== 2. Llenar tablaDatos desde API en Render (autosync cada 5s) ==========

const API_BASE = "https://api-monitoreo-nube.onrender.com";

async function actualizarTablaDatos() {
  try {
    const res = await fetch(`${API_BASE}/api/historial?n=12`, { cache: "no-store" });
    const data = await res.json();

    const tbody = document.querySelector("#tablaDatos tbody");
    tbody.innerHTML = "";

    data.reverse().forEach(d => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${d.timestamp?.slice(11,16) || "--:--"}</td>
        <td>${d.temperatura} °C</td>
        <td>${d.humedad} %</td>
      `;

      tbody.appendChild(fila);
    });

  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

actualizarTablaDatos();
setInterval(actualizarTablaDatos, 5000);

// ========== 3. Tabla histórica (últimos 5 días reales desde API) ==========
async function actualizarTablaHistorica() {
  try {
    const res = await fetch(`${API_BASE}/api/historicos?zona=Z1`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // data: { dias, horas, celdas }
    const tabla = document.getElementById("tablaHistorica");
    const thead = tabla.querySelector("thead");
    const tbody = tabla.querySelector("tbody");

    // 1) Encabezados (días reales)
    // Encabezado: Hora | 5 días | Valores Recomendados
    const dias = data.dias; // ej: ["Vie. 05","Sáb. 06",...]
    thead.innerHTML = `
      <tr>
        <th>Hora</th>
        ${dias.map(d => `<th>${d}</th>`).join("")}
        <th>Valores Recomendados</th>
      </tr>
    `;

    // 2) Cuerpo (12 horas)
    tbody.innerHTML = "";

    data.horas.forEach(hora => {
      const fila = document.createElement("tr");

      // primera columna Hora
      const tdHora = document.createElement("td");
      tdHora.textContent = hora;
      fila.appendChild(tdHora);

      // 5 columnas de días
      const row = data.celdas[hora] || [];
      row.forEach((celda) => {
        const td = document.createElement("td");

        if (!celda) {
          td.textContent = ""; // vacío si aún no hay dato en ese bloque
        } else {
          // Si quieres barras luego, aquí es donde se meten.
          // Por ahora dejamos texto simple (TEMP | HUM) o (HUM | TEMP) como gustes.
          td.title = `Temp: ${celda.t}°C | Hum: ${celda.h}%`;
          td.innerHTML = `<div style="font-weight:bold;">${celda.t.toFixed(1)}°C</div>
                          <div style="opacity:.9;">${celda.h.toFixed(1)}%</div>`;
        }

        fila.appendChild(td);
      });

      // última columna recomendado (puedes ajustar valores reales)
      const tdRec = document.createElement("td");
      tdRec.className = "recomendado";
      tdRec.textContent = "Temp 23–26°C | Hum 65–75%";
      fila.appendChild(tdRec);

      tbody.appendChild(fila);
    });

  } catch (err) {
    console.error("Error tabla histórica:", err);
  }
}

// Llamada inicial + refresco cada 60s (o 30s si quieres)
actualizarTablaHistorica();
setInterval(actualizarTablaHistorica, 60000);


// ========== 4. Efecto scroll para secciones ==========
document.addEventListener("DOMContentLoaded", () => {
  const secciones = document.querySelectorAll(".seccion-estudio-blanco, .seccion-estudio-gris");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("seccion-visible");
      }
    });
  }, {
    threshold: 0.2
  });

  secciones.forEach(sec => observer.observe(sec));
});




