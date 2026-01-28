# lector_bluetooth.py para Windows usando COM
import serial
import json
import time
from datetime import datetime

# Puerto COM del sensor Bluetooth (ajusta si es necesario)
PUERTO_BT = "/dev/rfcomm0"  # ← Usa el COM6 que aparece en tu administrador
BAUDIOS = 9600
ARCHIVO_JSON = "datos1.json"

def leer_datos_sensor(bt):
    try:
        linea = bt.readline().decode().strip()
        if linea:
            partes = linea.split(",")
            if len(partes) == 2:
                temperatura = float(partes[0])
                humedad = float(partes[1])
                hora = datetime.now().strftime("%H:%M")
                fecha = datetime.now().strftime("%Y-%m-%d")
                return {
                    "hora": hora,
                    "fecha": fecha,
                    "temperatura": temperatura,
                    "humedad": humedad
                }
    except Exception as e:
        print("Error al leer del Bluetooth:", e)
    return None

def cargar_datos():
    try:
        with open(ARCHIVO_JSON, "r") as f:
            return json.load(f)
    except:
        return {"ultimas_mediciones": [], "historico": {}}

def guardar_datos(datos):
    with open(ARCHIVO_JSON, "w") as f:
        json.dump(datos, f, indent=2)

def actualizar_json(nuevo_dato):
    datos = cargar_datos()

    # Tabla por minuto (últimas 5)
    ultimas = datos.get("ultimas_mediciones", [])
    ultimas.insert(0, {
        "hora": nuevo_dato["hora"],
        "temperatura": nuevo_dato["temperatura"],
        "humedad": nuevo_dato["humedad"]
    })
    datos["ultimas_mediciones"] = ultimas[:5]

    # Tabla histórica (cada 2h por día, máx 10 entradas por día)
    fecha = nuevo_dato["fecha"]
    hora = nuevo_dato["hora"]
    if fecha not in datos["historico"]:
        datos["historico"][fecha] = []

    historial = datos["historico"][fecha]
    if len(historial) == 0 or historial[-1]["hora"] != hora:
        historial.append({
            "hora": hora,
            "temperatura": nuevo_dato["temperatura"],
            "humedad": nuevo_dato["humedad"]
        })
        if len(historial) > 10:
            historial.pop(0)

    datos["historico"][fecha] = historial

    # Mantener solo 5 días
    fechas = list(datos["historico"].keys())
    if len(fechas) > 5:
        fechas.sort()
        for f in fechas[:-5]:
            del datos["historico"][f]

    guardar_datos(datos)

def main():
    try:
        bt = serial.Serial(PUERTO_BT, BAUDIOS)
        print(f"Conectado a {PUERTO_BT}")
    except Exception as e:
        print(f"Error al conectar a {PUERTO_BT}: {e}")
        return

    while True:
        nuevo = leer_datos_sensor(bt)
        if nuevo:
            print("Dato recibido:", nuevo)
            actualizar_json(nuevo)
        time.sleep(60)  # Esperar 1 minuto

if __name__ == "__main__":
    main()
