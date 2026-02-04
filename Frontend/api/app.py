from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
from datetime import datetime
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = Flask(__name__)
CORS(app)

model = joblib.load("./modelo_logistic_regression.joblib")
vectorizer = joblib.load("./count_vectorizer.joblib")

LABELS = {
    0: "Negativa",
    1: "Neutra",
    2: "Positiva"
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Texto não fornecido"}), 400

    text = data["text"]
    X = vectorizer.transform([text])

    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]

    return jsonify({
        "text": text,
        "predicted": LABELS[int(pred)],
        "confidence": round(float(max(proba)) * 100, 2)
    })

@app.route("/predict-file", methods=["POST"])
def predict_file():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400

    file = request.files["file"]

    # ===============================
    # DIRETÓRIO FORA DO FRONTEND
    # ===============================
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    OUTPUT_DIR = os.path.join(BASE_DIR, "resultados")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ===============================
    # LER FICHEIRO
    # ===============================
    if file.filename.endswith(".csv"):
        df = pd.read_csv(file)
        file_type = "csv"
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(file)
        file_type = "xlsx"
    else:
        return jsonify({"error": "Formato inválido"}), 400

    if "text" not in df.columns or "label" not in df.columns:
        return jsonify({"error": "O ficheiro deve conter colunas 'text' e 'label'"}), 400

    # ===============================
    # PREVISÕES
    # ===============================
    X = vectorizer.transform(df["text"])
    y_true = df["label"]
    y_pred = model.predict(X)

    df["pred"] = [LABELS[int(p)] for p in y_pred]

    # ===============================
    # MÉTRICAS
    # ===============================
    metrics = {
        "accuracy": round(accuracy_score(y_true, y_pred) * 100, 2),
        "precision": round(precision_score(y_true, y_pred, average="weighted") * 100, 2),
        "recall": round(recall_score(y_true, y_pred, average="weighted") * 100, 2),
        "f1": round(f1_score(y_true, y_pred, average="weighted") * 100, 2),
    }

    # ===============================
    # SALVAR RESULTADO
    # ===============================
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_name = f"resultados_{timestamp}.{file_type}"
    output_path = os.path.join(OUTPUT_DIR, output_name)

    if file_type == "csv":
        df.to_csv(output_path, index=False)
    else:
        df.to_excel(output_path, index=False)

    return jsonify({
        "metrics": metrics,
        "saved_file": output_name
    })


if __name__ == "__main__":
    app.run(debug=True)
