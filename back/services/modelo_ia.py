# services/modelo_ia.py
from xml.parsers.expat import model
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import io
import json
import os

class ModeloIA:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(base_dir, "model", "class_names.json")
        
        # Cargar clases
        with open(json_path, "r") as f:
            self.class_names = json.load(f)

        # Modelo
        self.model = self._cargar_modelo()

        # Transformaciones
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])

    def _cargar_modelo(self):
        model = torch.hub.load('pytorch/vision', 'resnet18', pretrained=False)
        model.fc = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, len(self.class_names))
        )
        
        # Ruta completa al modelo
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pth_path = os.path.join(base_dir, "model", "modelo_resnet18_v2.pth")
        
        model.load_state_dict(torch.load(pth_path, map_location=torch.device('cpu')))
        model.eval()
        return model

    
    

    def predecir(self, imagen_bytes):
        imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
        tensor = self.transform(imagen).unsqueeze(0)
        with torch.no_grad():
            outputs = self.model(tensor)
            _, pred = torch.max(outputs, 1)
            return self.class_names[pred.item()]
