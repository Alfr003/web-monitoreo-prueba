from flask import Flask, jsonify
import json

app = Flask(__name__)

@app.route("/api/datos")
def obtener_datos():
    with open("datos1.json", "r") as archivo:
        datos = json.load(archivo)
    return jsonify(datos["ultimas_mediciones"])

if __name__ == "_main_":
    app.run(host="0.0.0.0", port=5000)