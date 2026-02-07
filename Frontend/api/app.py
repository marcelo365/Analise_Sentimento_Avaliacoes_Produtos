#pip install deepl
#export DEEPL_AUTH_KEY="SUA_CHAVE_AQUI"
# ou no Windows
#set DEEPL_AUTH_KEY=SUA_CHAVE_AQUI
# $env:DEEPL_AUTH_KEY="chave" no powershell



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
import deepl

app = Flask(__name__)
CORS(app)

# ===============================
# MODELO
# ===============================

model = joblib.load("./modelo_logistic_regression.joblib")
vectorizer = joblib.load("./count_vectorizer.joblib")

LABELS = {0: "Negativa", 1: "Neutra", 2: "Positiva"}
LAST_RESULT = None

# ===============================
# DEEPL CONFIG
# ===============================

DEEPL_AUTH_KEY = os.getenv("DEEPL_AUTH_KEY")

if not DEEPL_AUTH_KEY:
    raise RuntimeError("DEEPL_AUTH_KEY não definida nas variáveis de ambiente")

translator = deepl.DeepLClient(DEEPL_AUTH_KEY)


def translate_pt_to_en(texts):
    """
    Recebe string ou lista de strings e retorna tradução EN
    """
    if isinstance(texts, str):
        result = translator.translate_text(
            texts,
            source_lang="PT",
            target_lang="EN-US"
        )
        return result.text

    results = translator.translate_text(
        texts,
        source_lang="PT",
        target_lang="EN-US"
    )
    return [r.text for r in results]


def translate_words_to_pt(top_words_dict):
    translated = {}

    for classe, words in top_words_dict.items():

        # extrair apenas termos EN
        terms_en = [w["word"] for w in words]

        try:
            results = translator.translate_text(
                terms_en,
                source_lang="EN",
                target_lang="PT-PT"
            )

            # DeepL retorna lista quando recebe lista
            terms_pt = [r.text.lower() for r in results]

        except Exception as e:
            print("Erro a traduzir lote:", e)
            terms_pt = terms_en  # fallback

        # reconstruir estrutura original
        new_list = []
        for orig, pt in zip(words, terms_pt):
            new_list.append({
                "word": pt,
                "count": orig["count"]
            })

        translated[classe] = new_list

    return translated


# ==========================================
# TOP PALAVRAS IMPORTANTES
# ==========================================

def get_top_words_per_class(model, vectorizer, top_n=10):
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = model.coef_

    top_words = {}

    for class_index, class_name in LABELS.items():
        coef = coefs[class_index]
        top_idx = np.argsort(coef)[-top_n:][::-1]

        words = [
            {
                "word": feature_names[i],
                "count": float(round(coef[i], 4))
            }
            for i in top_idx
        ]

        top_words[class_name] = words

    return top_words


# ==========================================
# PREVISÃO TEXTO ÚNICO (COM TRADUÇÃO)
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Texto não fornecido"}), 400

    text_pt = data["text"]

    # 🔹 traduz para inglês
    text_en = translate_pt_to_en(text_pt)

    X = vectorizer.transform([text_en])
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]

    return jsonify({
        "text": text_pt,          
        "text_en": text_en,       
        "predicted": LABELS[int(pred)],
        "confidence": round(float(max(proba)) * 100, 2)
    })



# ==========================================
# PREVISÃO FICHEIRO (COM TRADUÇÃO)
# ==========================================

@app.route("/predict-file", methods=["POST"])
def predict_file():
    global LAST_RESULT

    if "file" not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400

    file = request.files["file"]

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file)
        file_type = "csv"
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(file)
        file_type = "xlsx"
    else:
        return jsonify({"error": "Formato inválido"}), 400

    if "text" not in df.columns:
        return jsonify({"error": "O ficheiro deve conter a coluna 'text'"}), 400

    has_label = "label" in df.columns

    # ======================================
    # 🔹 TRADUÇÃO DATASET
    # ======================================

    texts_pt = df["text"].astype(str).tolist()
    texts_en = translate_pt_to_en(texts_pt)

    df["text_en"] = texts_en

    # ======================================
    # PREVISÕES USANDO INGLÊS
    # ======================================

    X = vectorizer.transform(df["text_en"])
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)

    df["pred"] = [LABELS[int(p)] for p in y_pred]
    df["confidence"] = np.max(y_proba, axis=1) * 100

    # ======================================
    # DISTRIBUIÇÃO
    # ======================================

    distribution = df["pred"].value_counts().to_dict()

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

    # ======================================
    # TOP PALAVRAS
    # ======================================

    top_words_en = get_top_words_per_class(model, vectorizer, top_n=12)
    top_words = translate_words_to_pt(top_words_en)

    # ======================================
    # MÉTRICAS SUPERVISIONADAS
    # ======================================

    metrics = None
    per_class_metrics = None
    confusion = None
    pr_curves = None

    if has_label:
        y_true = df["label"].astype(int)

        metrics = {
            "accuracy": round(accuracy_score(y_true, y_pred) * 100, 2),
            "precision": round(precision_score(y_true, y_pred, average="weighted") * 100, 2),
            "recall": round(recall_score(y_true, y_pred, average="weighted") * 100, 2),
            "f1": round(f1_score(y_true, y_pred, average="weighted") * 100, 2),
        }

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

        cm = confusion_matrix(y_true, y_pred)
        confusion = {
            "labels": list(LABELS.values()),
            "matrix": cm.tolist()
        }

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

    # ======================================
    # PREVIEW — MOSTRA TEXTO PT
    # ======================================

    preview = df[["text", "pred", "confidence"]].copy()
    preview["confidence"] = preview["confidence"].round(2)
    preview_data = preview.to_dict(orient="records")

    # ======================================
    # SALVAR RESULTADO
    # ======================================

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

    # ======================================
    # CACHE
    # ======================================

    LAST_RESULT = {
        "has_label": has_label,
        "metrics": metrics,
        "distribution": distribution,
        "per_class_metrics": per_class_metrics,
        "confidence_by_class": confidence_by_class_data,
        "confusion_matrix": confusion,
        "preview": preview_data,
        "saved_file": output_name,
        "pr_curves": pr_curves,
        "top_words": top_words
    }

    return jsonify(LAST_RESULT)


# ==========================================
# LAST RESULTS
# ==========================================

@app.route("/last-results", methods=["GET"])
def last_results():
    if LAST_RESULT is None:
        return jsonify({"error": "Nenhum ficheiro foi analisado ainda"}), 404
    return jsonify(LAST_RESULT)


# ==========================================

if __name__ == "__main__":
    app.run(port=5000, debug=True)
