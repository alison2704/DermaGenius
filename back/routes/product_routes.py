# routes/product_routes.py
from fastapi import APIRouter, Body
import json
import os
from typing import List

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