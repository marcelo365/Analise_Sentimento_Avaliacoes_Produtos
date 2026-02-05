from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
from datetime import datetime
from sklearn.preprocessing import label_binarize
from sklearn.metrics import precision_recall_curve, average_precision_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import numpy as np

app = Flask(__name__)
CORS(app)

model = joblib.load("./modelo_logistic_regression.joblib")
vectorizer = joblib.load("./count_vectorizer.joblib")

LABELS = {0: "Negativa", 1: "Neutra", 2: "Positiva"}

# ==========================================
# CACHE GLOBAL DO ÚLTIMO RESULTADO
# ==========================================
LAST_RESULT = None

# =====================================================
# PREVISÃO DE TEXTO ÚNICO
# =====================================================
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

# =====================================================
# PREVISÃO DE FICHEIRO (CSV / XLSX) + PR CURVE
# =====================================================
@app.route("/predict-file", methods=["POST"])
def predict_file():
    global LAST_RESULT
    if "file" not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400

    file = request.files["file"]

    # Ler ficheiro
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

    X = vectorizer.transform(df["text"])
    y_true = df["label"].astype(int)
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)

    df["pred"] = [LABELS[int(p)] for p in y_pred]
    df["confidence"] = np.max(y_proba, axis=1) * 100

    # Confiança média por classe prevista
    confidence_by_class = (
        df.groupby("pred")["confidence"]
        .mean()
        .round(2)
        .reset_index()
    )
    confidence_by_class_data = [
        {"class": row["pred"], "avg_confidence": float(row["confidence"])}
        for _, row in confidence_by_class.iterrows()
    ]

    # Métricas globais
    metrics = {
        "accuracy": round(accuracy_score(y_true, y_pred) * 100, 2),
        "precision": round(precision_score(y_true, y_pred, average="weighted") * 100, 2),
        "recall": round(recall_score(y_true, y_pred, average="weighted") * 100, 2),
        "f1": round(f1_score(y_true, y_pred, average="weighted") * 100, 2),
    }

    # Distribuição das classes
    distribution = df["pred"].value_counts().to_dict()

    # Métricas por classe
    report = classification_report(
        y_true,
        y_pred,
        target_names=[LABELS[0], LABELS[1], LABELS[2]],
        output_dict=True
    )
    per_class_metrics = [
        {
            "class": label,
            "precision": round(report[label]["precision"] * 100, 2),
            "recall": round(report[label]["recall"] * 100, 2),
            "f1": round(report[label]["f1-score"] * 100, 2)
        }
        for label in LABELS.values()
    ]

    # Matriz de confusão
    cm = confusion_matrix(y_true, y_pred)
    confusion = {"labels": list(LABELS.values()), "matrix": cm.tolist()}

    # Pré-visualização
    preview = df[["text", "pred", "confidence"]].copy()
    preview["confidence"] = preview["confidence"].round(2)
    preview_data = preview.to_dict(orient="records")

    # ==========================================
    # PRECISION-RECALL CURVE
    # ==========================================
    y_true_bin = label_binarize(y_true, classes=list(LABELS.keys()))
    pr_curves = {}

    for i, label_name in LABELS.items():
        precision, recall, _ = precision_recall_curve(
            y_true_bin[:, i],
            y_proba[:, i]
        )
        ap = average_precision_score(
            y_true_bin[:, i],
            y_proba[:, i]
        )
        pr_curves[label_name] = {
            "precision": precision.tolist(),
            "recall": recall.tolist(),
            "ap": round(float(ap), 3)
        }

    # Salvar resultado
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    OUTPUT_DIR = os.path.join(BASE_DIR, "resultados")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_name = f"resultados_{timestamp}.{file_type}"
    output_path = os.path.join(OUTPUT_DIR, output_name)

    if file_type == "csv":
        df.to_csv(output_path, index=False)
    else:
        df.to_excel(output_path, index=False)

    # Guardar no cache global
    LAST_RESULT = {
        "metrics": metrics,
        "distribution": distribution,
        "per_class_metrics": per_class_metrics,
        "confidence_by_class": confidence_by_class_data,
        "confusion_matrix": confusion,
        "preview": preview_data,
        "saved_file": output_name,
        "pr_curves": pr_curves  
    }

    return jsonify(LAST_RESULT)

# =====================================================
# RETORNAR ÚLTIMO RESULTADO (para o HTML de gráficos)
# =====================================================
@app.route("/last-results", methods=["GET"])
def last_results():
    if LAST_RESULT is None:
        return jsonify({"error": "Nenhum ficheiro foi analisado ainda"}), 404
    return jsonify(LAST_RESULT)

if __name__ == "__main__":
    app.run(port=5000, debug=True)


if __name__ == "__main__":
    app.run(debug=True)
