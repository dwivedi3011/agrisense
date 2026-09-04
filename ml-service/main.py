from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from PIL import Image
import numpy as np
import json
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = tf.keras.models.load_model("model/tomato_disease_model.keras")

with open("model/class_names.json") as f:
    class_names = json.load(f)

IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.6


@app.get("/health")
def health():
    return {"status": "ok", "message": "AgriSense ML service is running", "classes": len(class_names)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMG_SIZE)

    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)
    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_index])
    predicted_class = class_names[predicted_index]

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "status": "low_confidence",
            "message": "Unclear photo — please retake with better lighting and a closer view of the affected leaf.",
            "confidence": round(confidence, 3),
        }

    is_healthy = "healthy" in predicted_class.lower()

    return {
        "status": "ok",
        "predictedClass": predicted_class,
        "confidence": round(confidence, 3),
        "isHealthy": is_healthy,
    }