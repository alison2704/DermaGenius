from pydantic import BaseModel

class ImagenEntrada(BaseModel):
    imagen_base64: str
