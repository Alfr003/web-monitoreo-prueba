// =================== Mostrar secciones con animación ===================
function mostrarSeccionesAlScroll() {
  const secciones = document.querySelectorAll('.seccion-estudio-blanco, .seccion-estudio-gris');
  const triggerBottom = window.innerHeight * 0.85;

  secciones.forEach(seccion => {
    const rect = seccion.getBoundingClientRect().top;
    if (rect < triggerBottom) {
      seccion.classList.add('seccion-visible');
    }
  });
}

window.addEventListener('scroll', mostrarSeccionesAlScroll);
window.addEventListener('load', mostrarSeccionesAlScroll);


// =================== Mapa con dos puntos ===================
const mapa = L.map('mapaSensor').setView([10.075, -84.485], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

L.marker([10.0771, -84.4858]).addTo(mapa).bindPopup('Estación Zona 1').openPopup();
L.circle([10.0771, -84.4858], { color: '#2196f3', fillColor: '#2196f3', fillOpacity: 0.2, radius: 10 }).addTo(mapa);

L.marker([10.0758, -84.4849]).addTo(mapa).bindPopup('Estación Zona 2');
L.circle([10.0758, -84.4849], { color: '#4caf50', fillColor: '#4caf50', fillOpacity: 0.2, radius: 10 }).addTo(mapa);


// =================== Tabla y Gráficas ===================
const tablaConjunta = document.getElementById("tablaConjunta").getElementsByTagName("tbody")[0];
const ctxTemp = document.getElementById("graficaTempZonas").getContext("2d");
const ctxHum = document.getElementById("graficaHumZonas").getContext("2d");

let labels = [];
let dataTempZ1 = [], dataTempZ2 = [];
let dataHumZ1 = [], dataHumZ2 = [];

const chartTemp = new Chart(ctxTemp, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      { label: 'Temp Zona 1', data: dataTempZ1, borderColor: 'red', tension: 0.3 },
      { label: 'Temp Zona 2', data: dataTempZ2, borderColor: 'orange', tension: 0.3 }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: 'top' } } }
});

const chartHum = new Chart(ctxHum, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      { label: 'Hum Zona 1', data: dataHumZ1, borderColor: 'blue', tension: 0.3 },
      { label: 'Hum Zona 2', data: dataHumZ2, borderColor: 'cyan', tension: 0.3 }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: 'top' } } }
});

function generarDatos() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const temp1 = +(22 + Math.random() * 4).toFixed(1);
  const hum1 = Math.floor(65 + Math.random() * 10);
  const temp2 = +(21 + Math.random() * 5).toFixed(1);
  const hum2 = Math.floor(60 + Math.random() * 15);

  // Insertar en tabla
  const fila = tablaConjunta.insertRow(0);
  fila.insertCell(0).innerText = hora;
  fila.insertCell(1).innerText = `${temp1} °C`;
  fila.insertCell(2).innerText = `${hum1} %`;
  fila.insertCell(3).innerText = `${temp2} °C`;
  fila.insertCell(4).innerText = `${hum2} %`;

  // Actualizar gráficas
  if (labels.length >= 10) {
    labels.pop(); dataTempZ1.pop(); dataTempZ2.pop(); dataHumZ1.pop(); dataHumZ2.pop();
  }
  labels.unshift(hora);
  dataTempZ1.unshift(temp1);
  dataTempZ2.unshift(temp2);
  dataHumZ1.unshift(hum1);
  dataHumZ2.unshift(hum2);

  chartTemp.update();
  chartHum.update();

  // Análisis rápido
  const analisis = document.getElementById("analisis");
  if (temp1 > 26 || temp2 > 26) {
    analisis.innerText = "⚠️ Temperatura alta detectada en una de las zonas.";
  } else if (hum1 < 65 || hum2 < 60) {
    analisis.innerText = "⚠️ Niveles de humedad por debajo del ideal.";
  } else {
    analisis.innerText = "✅ Condiciones dentro de los parámetros normales.";
  }
}

// Llenar cada minuto
generarDatos();
setInterval(generarDatos, 60000);


// =================== Tabla histórica por día ===================
const tablaHistorica = document.getElementById("tablaHistorica").getElementsByTagName("tbody")[0];
const horasHistoricas = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];

for (let i = 0; i < horasHistoricas.length; i++) {
  const fila = tablaHistorica.insertRow();
  fila.insertCell(0).innerText = horasHistoricas[i];

  for (let d = 0; d < 5; d++) {
    const temp = Math.floor(22 + Math.random() * 5);
    const hum = Math.floor(60 + Math.random() * 10);

    const celda = fila.insertCell();
    celda.innerText = `${hum}% | ${temp}°C`;
    celda.title = `Humedad: ${hum}%\nTemperatura: ${temp}°C`;
  }

  const celdaRec = fila.insertCell();
  celdaRec.innerText = `65% | 25°C`;
  celdaRec.title = `Humedad: 65%\nTemperatura: 25°C`;
}
