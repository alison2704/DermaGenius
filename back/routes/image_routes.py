# routes/image_routes.py
from fastapi import APIRouter, UploadFile, File
from back.services.modelo_ia import ModeloIA
from back.routes.product_routes import cargar_productos


router = APIRouter(prefix="/imagen", tags=["Predicción Imagen"])
modelo = ModeloIA()

def recomendar_productos_inteligente(prediccion):
    """
    Función auxiliar para recomendar productos basándose en los 3 modelos
    """
    productos = cargar_productos()
    productos_puntuados = []
    
    # Extraer etiquetas de la predicción
    etiquetas_detalladas = prediccion.get("etiquetas_detalladas", {})
    edad = etiquetas_detalladas.get("edad")
    tipo_piel = etiquetas_detalladas.get("tipo_piel")
    afecciones = etiquetas_detalladas.get("afecciones", [])
    
    for producto in productos:
        puntuacion = 0
        criterios_cumplidos = []
        
        # Puntuación por edad (peso: 3 puntos)
        if edad and edad in producto["etiquetas"]:
            puntuacion += 3
            criterios_cumplidos.append(f"Edad: {edad}")
        
        # Puntuación por tipo de piel (peso: 4 puntos - más importante)
        if tipo_piel and tipo_piel in producto["etiquetas"]:
            puntuacion += 4
            criterios_cumplidos.append(f"Tipo de piel: {tipo_piel}")
        
        # Puntuación por afecciones detectadas (peso: 2 puntos cada una)
        for afeccion in afecciones:
            if afeccion in producto["etiquetas"]:
                puntuacion += 2
                criterios_cumplidos.append(f"Afección: {afeccion}")
        
        # Solo incluir productos que cumplan al menos un criterio
        if puntuacion > 0:
            productos_puntuados.append({
                "producto": producto,
                "puntuacion": puntuacion,
                "criterios_cumplidos": criterios_cumplidos,
                "porcentaje_compatibilidad": min(100, (puntuacion / 9) * 100)
            })
    
    # Ordenar por puntuación descendente
    productos_puntuados.sort(key=lambda x: x["puntuacion"], reverse=True)
    
    return {
        "productos_recomendados": productos_puntuados,
        "total": len(productos_puntuados),
        "criterios_evaluacion": {
            "edad_detectada": edad,
            "tipo_piel_detectado": tipo_piel,
            "afecciones_detectadas": afecciones
        }
    }

@router.post("/predecir")
async def predecir_imagen(file: UploadFile = File(...)):
    contenido = await file.read()
    prediccion = modelo.predecir(contenido)
      
    # Obtener recomendaciones automáticamente usando los 3 modelos
    recomendaciones = recomendar_productos_inteligente(prediccion)
    prediccion["recomendaciones"] = recomendaciones
    
    return {"resultado": prediccion}
