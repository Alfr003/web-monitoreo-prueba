from flask import Flask, jsonify, send_file
import json

app = Flask(__name__)

# Ruta principal: cargar el archivo HTML directamente desde el mismo folder
@app.route("/")
def pagina_principal():
    return send_file("datos1.html")

# Ruta API: envía los datos del sensor en formato JSON
@app.route("/api/datos")
def obtener_datos():
    with open("datos1.json", "r") as archivo:
        datos = json.load(archivo)
    return jsonify(datos["ultimas_mediciones"])

if __name__ == "_main_":
    app.run(host="0.0.0.0", port=5000)