import React, { useState } from 'react';
import { Camera, ShoppingCart, Heart, Shield, Star, X, Plus, Minus, ArrowLeft } from 'lucide-react';
import './App.css';

import { useRef, useEffect } from 'react';

// Tipos de datos
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Datos mock de productos
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Crema Hidratante Facial",
    price: 29.99,
    description: "Crema hidratante con ácido hialurónico para piel seca",
    image: "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Hidratante"
  },
  {
    id: 2,
    name: "Protector Solar SPF 50",
    price: 24.99,
    description: "Protección solar avanzada para todo tipo de piel",
    image: "https://images.pexels.com/photos/7755295/pexels-photo-7755295.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Protección"
  },
  {
    id: 3,
    name: "Serum Vitamina C",
    price: 39.99,
    description: "Serum antioxidante con vitamina C para luminosidad",
    image: "https://images.pexels.com/photos/7755315/pexels-photo-7755315.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Tratamiento"
  },
  {
    id: 4,
    name: "Limpiador Facial Suave",
    price: 19.99,
    description: "Limpiador facial para piel sensible",
    image: "https://images.pexels.com/photos/5069394/pexels-photo-5069394.jpeg?auto=compress&cs=tinysrgb&w=300",
    category: "Limpieza"
  }
];

function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'diagnosis' | 'cart'>('welcome');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [analisisResultado, setAnalisisResultado] = useState<string>("");


  // Inicializa la cámara al cargar la pantalla de diagnóstico
  useEffect(() => {
  let localStream: MediaStream | null = null;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      localStream = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
    }
  };

  if (currentScreen === 'diagnosis') {
    startCamera();
  }

  return () => {
    // Detener cámara al salir
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
}, [currentScreen]);


const enviarImagenAlBackend = async (blob: Blob) => {
  const formData = new FormData();
  formData.append("file", blob, "foto.jpg"); // clave esperada por FastAPI

  try {
    const response = await fetch("http://localhost:8000/imagen/predecir", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

    const data = await response.json();
    return data.resultado; // <-- asegúrate que sea "resultado" si en Swagger devuelves eso
  } catch (error) {
    console.error("Error al enviar la imagen:", error);
    return null;
  }
};


const captureImage = async () => {
  if (videoRef.current && canvasRef.current) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = 256;
    canvas.height = 256;

    context?.drawImage(videoRef.current, 0, 0, 256, 256);
    const imageData = canvas.toDataURL("image/jpeg"); // devuelve base64

    setCapturedImage(imageData);
    setIsAnalyzing(true);
    setDiagnosisComplete(false);

    // 👉 Convertir base64 a Blob
    const base64Data = imageData.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    const resultado = await enviarImagenAlBackend(blob);

    if (resultado) {
      const { clasificacion, deteccion } = resultado;

      const detecciones = deteccion.length > 0
        ? deteccion.join(", ")
        : "ninguna anomalía detectada";

      setAnalisisResultado(
        `🔍 Edad estimada: ${clasificacion}. Recomendamos productos para ese grupo de edad.\n🩺 Análisis de piel: ${detecciones}.`
      );
      } else {
        setAnalisisResultado("❌ No se pudo realizar la predicción.");
      }


    setIsAnalyzing(false);
    setDiagnosisComplete(true);
  }
};

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.error("Error al acceder a la cámara:", error);
      });
  };

  // Agregar al carrito
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remover del carrito
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Actualizar cantidad
  const updateQuantity = (productId: number, change: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  // Calcular total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Pantalla de Bienvenida
  const WelcomeScreen = () => (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="logo">
            <Shield className="logo-icon" />
            <span className="logo-text">DermaGenius</span>
          </div>
        </div>

        <h1 className="welcome-title">
          Diagnóstico Dermatológico Inteligente
        </h1>

        <p className="welcome-description">
          Utiliza inteligencia artificial avanzada para analizar tu piel y obtener
          recomendaciones personalizadas de productos dermatológicos.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <Camera className="feature-icon" />
            <h3>Análisis Instantáneo</h3>
            <p>Captura una foto y obtén resultados en segundos</p>
          </div>

          <div className="feature-card">
            <Heart className="feature-icon" />
            <h3>Recomendaciones Personalizadas</h3>
            <p>Productos específicos para tu tipo de piel</p>
          </div>

          <div className="feature-card">
            <Star className="feature-icon" />
            <h3>Productos Verificados</h3>
            <p>Solo productos dermatológicamente probados</p>
          </div>
        </div>

        <button
          className="cta-button"
          onClick={() => setCurrentScreen('diagnosis')}
        >
          Comenzar Análisis
        </button>
      </div>
    </div>
  );

  // Pantalla de Diagnóstico
  const DiagnosisScreen = () => (
    <div className="diagnosis-screen">
      <div className="diagnosis-header">
        <button
          className="back-button"
          onClick={() => setCurrentScreen('welcome')}
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <h2>Análisis Dermatológico</h2>
      </div>

      <div className="diagnosis-content">
        <div className="camera-section">
          <div className="camera-container">
            <h3>Captura tu imagen</h3>
            {!capturedImage ? (
        <div className="camera-preview">
          <video ref={videoRef} autoPlay playsInline width="300" />
          <button className="capture-button" onClick={captureImage}>
            Capturar Imagen
          </button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      ) : (

              <div className="captured-image">
                <img src={capturedImage} alt="Imagen capturada" />
                <button
                  className="retake-button"
                  onClick={() => {
                    setCapturedImage(null);
                    setDiagnosisComplete(false);
                    setIsAnalyzing(false);
                    startCamera(); // <-- reactiva la cámara

                  }}
                >
                  Tomar Nueva Foto
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="recommendations-section">
          <h3>Recomendaciones</h3>

          {!capturedImage && (
            <div className="waiting-analysis">
              <div className="placeholder-content">
                <div className="pulse-animation"></div>
                <p>Esperando imagen para análisis...</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing">
              <div className="spinner"></div>
              <p>Analizando tu piel con IA...</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          )}

          {diagnosisComplete && (
            <div className="diagnosis-results">
              <div className="diagnosis-summary">
                <h4>Análisis Completado</h4>
                <p>{analisisResultado}</p>
              </div>

              <div className="product-recommendations">
                <h4>Productos Recomendados</h4>
                <div className="products-grid">
                  {mockProducts.map(product => (
                    <div key={product.id} className="product-card">
                      <img src={product.image} alt={product.name} />
                      <div className="product-info">
                        <h5>{product.name}</h5>
                        <p className="product-description">{product.description}</p>
                        <div className="product-footer">
                          <span className="price">${product.price}</span>
                          <button
                            className="add-to-cart-btn"
                            onClick={() => addToCart(product)}
                          >
                            <Plus size={16} />
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {diagnosisComplete && (
            <div className="go-to-cart">
              <button
                className="cart-button"
                onClick={() => setCurrentScreen('cart')}
              >
                <ShoppingCart size={20} />
                Ver Carrito ({cart.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Pantalla del Carrito
  const CartScreen = () => (
    <div className="cart-screen">
      <div className="cart-header">
        <button
          className="back-button"
          onClick={() => setCurrentScreen('diagnosis')}
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <h2>Carrito de Compras</h2>
      </div>

      <div className="cart-content">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={64} />
            <h3>Tu carrito está vacío</h3>
            <p>Agrega productos desde la pantalla de diagnóstico</p>
            <button
              className="continue-shopping"
              onClick={() => setCurrentScreen('diagnosis')}
            >
              Continuar Comprando
            </button>
          </div>
        ) : (
          <div className="cart-items">
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-category">{item.category}</p>
                    <p className="item-description">{item.description}</p>
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="total-section">
                <h3>Resumen del Pedido</h3>
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Envío:</span>
                  <span>Gratis</span>
                </div>
                <div className="total-line total">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <button className="checkout-button">
                  Proceder al Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar la pantalla actual
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'diagnosis':
        return <DiagnosisScreen />;
      case 'cart':
        return <CartScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;