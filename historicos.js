// Fechas disponibles (últimos 5 días)
const fechasDisponibles = [
  "2025-09-05",
  "2025-09-06",
  "2025-09-07",
  "2025-09-08",
  "2025-09-09"
];

// Horas de muestreo
const horas = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];

// Generar datos simulados por fecha
const datosPorFecha = {};

fechasDisponibles.forEach(fecha => {
  datosPorFecha[fecha] = horas.map(hora => {
    const temperatura = (20 + Math.random() * 8).toFixed(1);
    const humedad = Math.floor(60 + Math.random() * 30);
    return { hora, temperatura, humedad };
  });
});

// Llenar el select con fechas
const selectFecha = document.getElementById("fechaFiltro");

fechasDisponibles.forEach(fecha => {
  const opcion = document.createElement("option");
  opcion.value = fecha;
  opcion.textContent = fecha;
  selectFecha.appendChild(opcion);
});

// Función para mostrar los datos en la tabla
function mostrarDatos(fechaSeleccionada) {
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  cuerpoTabla.innerHTML = ""; // Limpiar tabla

  const datos = datosPorFecha[fechaSeleccionada];

  datos.forEach(dato => {
    const fila = document.createElement("tr");

    const celdaHora = document.createElement("td");
    celdaHora.textContent = dato.hora;
    fila.appendChild(celdaHora);

    const celdaTemp = document.createElement("td");
    celdaTemp.textContent = `${dato.temperatura} °C`;
    fila.appendChild(celdaTemp);

    const celdaHum = document.createElement("td");
    celdaHum.textContent = `${dato.humedad} %`;
    fila.appendChild(celdaHum);

    cuerpoTabla.appendChild(fila);
  });
}

// Mostrar la primera fecha por defecto
mostrarDatos(fechasDisponibles[0]);

// Escuchar cambios en el filtro
selectFecha.addEventListener("change", (e) => {
  mostrarDatos(e.target.value);
});
