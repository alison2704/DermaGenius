from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from back.routes import image_routes, product_routes
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Modelo IA",
    description="API para predecir edad, afecciones y tipo de piel a partir de imagen facial",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost:5173",  # frontend en desarrollo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Configurar archivos estáticos para servir imágenes
static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

#app.include_router(basic_routes.router)
#app.include_router(get_resources.router)
app.include_router(image_routes.router)
app.include_router(product_routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
