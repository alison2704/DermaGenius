# routes/image_routes.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from back.services.modelo_ia import ModeloIA
from back.routes.product_routes import cargar_productos
import cv2
import numpy as np


router = APIRouter(prefix="/imagen", tags=["Predicción Imagen"])
modelo = ModeloIA()

# Cargar el modelo Haar Cascade para detección de rostros
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

def contiene_rostro(imagen_bytes):
    npimg = np.frombuffer(imagen_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        return False
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
    return len(faces) > 0

@router.post("/predecir")
async def predecir_imagen(file: UploadFile = File(...)):
    contenido = await file.read()
    # Verificar si la imagen contiene un rostro antes de predecir
    if not contiene_rostro(contenido):
        raise HTTPException(status_code=400, detail="No se detectó un rostro en la imagen. Por favor, sube una foto clara de tu cara.")
    prediccion = modelo.predecir(contenido)
      
    # Obtener recomendaciones de productos automáticamente
    if "etiquetas_productos" in prediccion:
        productos = cargar_productos()
        productos_recomendados = []
        
        for producto in productos:
            # Verificar si alguna etiqueta del producto coincide con las etiquetas de predicción
            if any(etiqueta in producto["etiquetas"] for etiqueta in prediccion["etiquetas_productos"]):
                productos_recomendados.append(producto)
        
        prediccion["productos_recomendados"] = productos_recomendados
        prediccion["total_productos"] = len(productos_recomendados)
    
    return {"resultado": prediccion}
