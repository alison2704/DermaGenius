# services/modelo_ia.py

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
from ultralytics import YOLO
import io
import json
import os
from torchvision import models

class ModeloIA:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Rutas de modelos YOLO
        self.modelo_edad_path = os.path.join(base_dir, "model", "modelo_edad.pt")
        self.modelo_piel_path = os.path.join(base_dir, "model", "modelo_piel.pt")
        #Ruta modelo tipo de piel
        self.modelo_tipo_piel_path = os.path.join(base_dir, "model", "modelo_tipo_piel.pt")

        # Cargar ambos modelos YOLO
        self.modelo_edad = YOLO(self.modelo_edad_path)
        self.modelo_piel = YOLO(self.modelo_piel_path)

        # ResNet‑18: reconstrucción de la arquitectura y carga de pesos
        self.modelo_tipo_piel = models.resnet18(pretrained=False)
        self.modelo_tipo_piel.fc = nn.Linear(self.modelo_tipo_piel.fc.in_features, 3)
        self.modelo_tipo_piel.load_state_dict(
            torch.load(self.modelo_tipo_piel_path, map_location=torch.device("cpu"))
        )
        self.modelo_tipo_piel.eval()

        # Transformación de validación (igual que transform_val en entrenamiento)
        self.transform_tipo_piel = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

        # Mapeo de índices a etiquetas
        self.etiquetas_tipo_piel = ["seca", "normal", "grasa"]  # mapea dry→seca, normal→normal, oily→grasa
        # Mapeo de etiquetas del modelo a etiquetas de productos
        self.mapeo_edad = {
            # Aquí debes ajustar según las etiquetas que realmente devuelve tu modelo YOLO de edad
            "0-12": "0-12",
            "13-18": "13-18", 
            "19-30": "19-30",
            "31-45": "31-50",  # Si tienes más rangos
            "46+": "60+",
            "61+": "61+",       # Si tienes más rangos
            # Agregar más mapeos según los nombres reales de tu modelo
        }

        self.mapeo_afecciones = {
            # Mapeo de detecciones YOLO a etiquetas de productos
            "acne": "acne",
            "arrugas": "arrugas",
            # Agregar más mapeos según tu modelo YOLO de piel
        }

    
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

        # ResNet‑18 Tipo de piel
        tensor = self.transform_tipo_piel(imagen).unsqueeze(0)
        with torch.no_grad():
            salida = self.modelo_tipo_piel(tensor)
            pred = torch.argmax(salida, dim=1).item()
            etiqueta_tipo = self.etiquetas_tipo_piel[pred]

        # Mapear etiquetas para recomendación de productos
        etiquetas_mapeadas = []
        
        # Mapear edad
        if etiqueta_edad in self.mapeo_edad:
            etiquetas_mapeadas.append(self.mapeo_edad[etiqueta_edad])
        
        # Mapear tipo de piel
        etiquetas_mapeadas.append(etiqueta_tipo)
        
        # Mapear afecciones de piel
        for etiqueta in etiquetas_piel:
            if etiqueta.lower() in self.mapeo_afecciones:
                etiquetas_mapeadas.append(self.mapeo_afecciones[etiqueta.lower()])

        # Eliminar duplicados manteniendo el orden
        etiquetas_mapeadas = list(dict.fromkeys(etiquetas_mapeadas))

        return {
            "clasificacion": etiqueta_edad,
            "deteccion": etiquetas_piel,
            "tipo_piel": etiqueta_tipo,
            "etiquetas_productos": etiquetas_mapeadas  # Nuevas etiquetas para recomendación
        }
