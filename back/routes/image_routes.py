# routes/image_routes.py
from fastapi import APIRouter, UploadFile, File
from back.services.modelo_ia import ModeloIA
from back.routes.product_routes import cargar_productos


router = APIRouter(prefix="/imagen", tags=["Predicción Imagen"])
modelo = ModeloIA()

@router.post("/predecir")
async def predecir_imagen(file: UploadFile = File(...)):
    contenido = await file.read()
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
