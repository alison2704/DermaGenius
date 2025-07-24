# services/modelo_ia.py

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
from ultralytics import YOLO
import io
import json
import os

class ModeloIA:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Rutas de modelos YOLO
        self.modelo_edad_path = os.path.join(base_dir, "model", "modelo_edad.pt")
        self.modelo_piel_path = os.path.join(base_dir, "model", "modelo_piel.pt")

        # Cargar ambos modelos YOLO
        self.modelo_edad = YOLO(self.modelo_edad_path)
        self.modelo_piel = YOLO(self.modelo_piel_path)
    
    def predecir(self, imagen_bytes):
        imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")

        # Modelo YOLO para edad
        resultado_edad = self.modelo_edad(imagen)[0]
        if len(resultado_edad.boxes.cls) > 0:
            clases_edad = resultado_edad.boxes.cls.tolist()
            confs_edad = resultado_edad.boxes.conf.tolist()
            # Seleccionamos la clase con mayor confianza
            idx_mayor = confs_edad.index(max(confs_edad))
            clase_edad = int(clases_edad[idx_mayor])
            etiqueta_edad = resultado_edad.names[clase_edad]
        else:
            etiqueta_edad = "desconocida"

        # Modelo YOLO para piel
        resultado_piel = self.modelo_piel(imagen)[0]
        etiquetas_piel = [resultado_piel.names[int(cls)] for cls in resultado_piel.boxes.cls]
        etiquetas_piel = list(set(etiquetas_piel))  # Quitar duplicados

        return {
            "clasificacion": etiqueta_edad,
            "deteccion": etiquetas_piel
        }

