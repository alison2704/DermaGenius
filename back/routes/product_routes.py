# routes/product_routes.py
from fastapi import APIRouter, Body
import json
import os
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/productos", tags=["Productos"])

def cargar_productos():
    """Carga los productos desde el archivo JSON"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    productos_path = os.path.join(base_dir, "productos.json")
    
    with open(productos_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/recomendar")
async def recomendar_productos(etiquetas: List[str] = Body(...)):
    """
    Recomienda productos basándose en las etiquetas de predicción
    """
    productos = cargar_productos()
    productos_recomendados = []
    
    for producto in productos:
        # Verificar si alguna etiqueta del producto coincide con las etiquetas de predicción
        if any(etiqueta in producto["etiquetas"] for etiqueta in etiquetas):
            productos_recomendados.append(producto)
    
    return {
        "productos": productos_recomendados,
        "total": len(productos_recomendados)
    }

@router.post("/recomendar-inteligente")
async def recomendar_productos_inteligente(prediccion: dict = Body(...)):
    """
    Recomienda productos basándose en los 3 modelos con sistema de puntuación
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
                "porcentaje_compatibilidad": min(100, (puntuacion / 9) * 100)  # Max 9 puntos posibles
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

@router.post("/recomendar-simple")
async def recomendar_productos_simple(
    edad: str = Body(None),
    tipo_piel: str = Body(None), 
    afecciones: List[str] = Body([])
):
    """
    Recomienda productos con parámetros simples
    Ejemplo de uso:
    {
        "edad": "31-45",
        "tipo_piel": "normal",
        "afecciones": ["arrugas"]
    }
    """
    productos = cargar_productos()
    productos_puntuados = []
    
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

class RecomendacionRequest(BaseModel):
    edad: Optional[str] = None
    tipo_piel: Optional[str] = None
    afecciones: List[str] = []

@router.post("/recomendar-v2")
async def recomendar_productos_v2(request: RecomendacionRequest):
    """
    Endpoint con validación de tipos usando Pydantic
    Ejemplo de uso:
    {
        "edad": "31-45",
        "tipo_piel": "normal",
        "afecciones": ["arrugas"]
    }
    """
    productos = cargar_productos()
    productos_puntuados = []
    
    for producto in productos:
        puntuacion = 0
        criterios_cumplidos = []
        
        # Puntuación por edad (peso: 3 puntos)
        if request.edad and request.edad in producto["etiquetas"]:
            puntuacion += 3
            criterios_cumplidos.append(f"Edad: {request.edad}")
        
        # Puntuación por tipo de piel (peso: 4 puntos - más importante)
        if request.tipo_piel and request.tipo_piel in producto["etiquetas"]:
            puntuacion += 4
            criterios_cumplidos.append(f"Tipo de piel: {request.tipo_piel}")
        
        # Puntuación por afecciones detectadas (peso: 2 puntos cada una)
        for afeccion in request.afecciones:
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
            "edad_detectada": request.edad,
            "tipo_piel_detectado": request.tipo_piel,
            "afecciones_detectadas": request.afecciones
        }
    }

@router.get("/todos")
async def obtener_todos_productos():
    """
    Obtiene todos los productos (para debugging)
    """
    productos = cargar_productos()
    return {
        "productos": productos,
        "total": len(productos)
    }

@router.get("/{producto_id}")
async def obtener_producto_por_id(producto_id: int):
    """
    Obtiene un producto específico por su ID
    """
    productos = cargar_productos()
    for producto in productos:
        if producto["id"] == producto_id:
            return producto
    return {"error": "Producto no encontrado"}

@router.get("/")
async def obtener_productos():
    """
    Obtiene todos los productos (endpoint principal)
    """
    productos = cargar_productos()
    return {
        "productos": productos,
        "total": len(productos)
    } 