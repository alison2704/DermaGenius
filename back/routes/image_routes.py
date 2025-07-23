# routes/image_routes.py
from fastapi import APIRouter, UploadFile, File
from back.services.modelo_ia import ModeloIA

router = APIRouter(prefix="/imagen", tags=["Predicción Imagen"])
modelo = ModeloIA()

@router.post("/predecir")
async def predecir_imagen(file: UploadFile = File(...)):
    contenido = await file.read()
    prediccion = modelo.predecir(contenido)
    return {"resultado": prediccion}
