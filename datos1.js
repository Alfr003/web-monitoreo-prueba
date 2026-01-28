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

// ========== 3. Tabla histórica con datos simulados ==========
const horasHist = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];
const dias = ["Vie. 5", "Sáb. 6", "Dom. 7", "Lun. 8", "Mar. 9"];

const datosHistoricos = {};
const humedadesHistoricas = {};

horasHist.forEach(hora => {
  datosHistoricos[hora] = [];
  humedadesHistoricas[hora] = [];
  for (let i = 0; i < 5; i++) {
    const temp = Math.floor(20 + Math.random() * 10);
    const hum = Math.floor(60 + Math.random() * 25);
    datosHistoricos[hora].push(temp);
    humedadesHistoricas[hora].push(hum);
  }
});

const tablaHist = document.getElementById("tablaHistorica").getElementsByTagName("tbody")[0];

horasHist.forEach(hora => {
  const fila = tablaHist.insertRow();
  fila.insertCell(0).innerText = hora;

  for (let i = 0; i < 5; i++) {
    const temp = datosHistoricos[hora][i];
    const hum = humedadesHistoricas[hora][i];

    const celda = fila.insertCell();
    celda.className = "celda-doble";

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
    contenedor.title = `Temp: ${temp}°C | Hum: ${hum}%`;

    const texto = document.createElement("span");
    texto.innerText = `${hum} | ${temp}`;

    contenedor.appendChild(texto);
    celda.appendChild(contenedor);
  }

  // Columna final: valores recomendados
  const celdaRec = fila.insertCell();
  const contenedorRec = document.createElement("div");
  contenedorRec.style.display = "flex";
  contenedorRec.style.justifyContent = "center";
  contenedorRec.style.alignItems = "center";
  contenedorRec.style.height = "100%";
  contenedorRec.style.width = "100%";
  contenedorRec.style.backdropFilter = "blur(4px)";
  contenedorRec.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  contenedorRec.style.borderRadius = "6px";
  contenedorRec.style.fontSize = "0.75rem";
  contenedorRec.style.fontWeight = "bold";
  contenedorRec.style.color = "white";
  contenedorRec.title = "Recomendado: Temp 23-26°C | Hum 65-75%";

  const textoRec = document.createElement("span");
  textoRec.innerText = "70 | 24";

  contenedorRec.appendChild(textoRec);
  celdaRec.appendChild(contenedorRec);
});


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



