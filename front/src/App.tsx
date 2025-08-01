import React, { useState } from 'react';
import { Camera, ShoppingCart, Heart, Shield, Star, X, Plus, Minus, ArrowLeft } from 'lucide-react';
import './App.css';

import { useRef, useEffect } from 'react';

// Tipos de datos
interface Product {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
  imagen: string;
  etiquetas: string[];
}

interface CartItem extends Product {
  quantity: number;
}

// Datos mock de productos (fallback)
const mockProducts: Product[] = [
  {
    id: 1,
    nombre: "GEL LIMPIADOR DE TE VERDE",
    precio: 28.00,
    descripcion: "Gel ligero enriquecido con té verde que limpia y purifica la piel dejándola libre de grasa e impurezas.",
    imagen: "/static/images/ID1.png",
    etiquetas: ["0-12","13-18", "19-30", "grasa", "acne"]
  },
  {
    id: 2,
    nombre: "GEL ANTI-ACNÉ",
    precio: 32.00,
    descripcion: "Antiacné es un tratamiento nocturno.",
    imagen: "/static/images/ID2.png",
    etiquetas: ["acne"]
  }
];

// Puedes agregar este componente dentro de DiagnosisScreen, antes del video
const InstruccionesPrevias = () => (
  <div
    className="pre-capture-instructions"
    style={{
      background: 'rgba(255,255,255,0.15)', // igual que .general-tips
      borderRadius: '1rem',
      padding: '2rem',
      marginBottom: '2rem',
      color: '#222',
      width: '100%',
      boxSizing: 'border-box',
    }}
  >
    <h4 style={{ color: '#059669', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
      📸 Instrucciones para la foto
    </h4>
    <ul style={{ paddingLeft: '1rem', fontSize: '1rem', lineHeight: 1.7 }}>
      <li>😊 <b>Colócate frente a la cámara</b> y asegúrate de que tu rostro esté bien iluminado.</li>
      <li>🧼 <b>Limpia tu rostro</b> antes de tomar la foto para mejores resultados.</li>
      <li>👓 <b>Evita accesorios</b> como lentes, gorros o mascarillas.</li>
      <li>🌟 <b>Mantén una expresión neutra</b> y mira hacia el frente.</li>
      <li>📱 <b>Evita fondos oscuros</b> o muy brillantes.</li>
    </ul>
    <div style={{ marginTop: '1rem', color: '#059669', fontWeight: 500 }}>
      ¡Listo para comenzar tu análisis!
    </div>
  </div>
);

function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'diagnosis' | 'cart'>('welcome');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [analisisResultado, setAnalisisResultado] = useState<string>("");
  const [productosRecomendados, setProductosRecomendados] = useState<Product[]>([]);
  const [cajasDeteccion, setCajasDeteccion] = useState<any[]>([]);


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
  formData.append("file", blob, "foto.jpg");

  try {
    const response = await fetch("http://localhost:8000/imagen/predecir", {
      method: "POST",
      body: formData
    });

    console.log("📡 status:", response.status, response.statusText);

    const text = await response.text();
    console.log("💬 raw response body:", text);

    // intenta parsear JSON sólo si es JSON válido
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.error("❌ No es JSON válido:", e);
      throw new Error("Respuesta no JSON");
    }

    if (!response.ok) {
      console.error("❌ response.ok === false, data:", data);
      throw new Error("Error en la respuesta del servidor");
    }

    console.log("✅ data:", data);
    return data.resultado;
  } catch (error) {
    console.error("🚨 enviarImagenAlBackend error:", error);
    return null;
  }
};

const obtenerRecomendaciones = async (etiquetas: string[]) => {
  try {
    const response = await fetch("http://localhost:8000/productos/recomendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(etiquetas)
    });

    if (!response.ok) {
      throw new Error("Error al obtener recomendaciones");
    }

    const data = await response.json();
    console.log("✅ Productos recomendados:", data);
    return data.productos || [];
  } catch (error) {
    console.error("🚨 Error al obtener recomendaciones:", error);
    return mockProducts; // Fallback a productos mock
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
      const { clasificacion, deteccion, tipo_piel, cajas_deteccion } = resultado;

      const detecciones = deteccion.length > 0
        ? deteccion.join(", ")
        : "ninguna anomalía detectada";

      setAnalisisResultado(  
        `🔍 Edad estimada: ${clasificacion}.\n` +
        `🩺 Análisis de piel: ${detecciones}.\n` +
        `💧 Tipo de piel: ${tipo_piel}.`
      );

      // Guardar las cajas de detección para mostrarlas en la imagen
      setCajasDeteccion(cajas_deteccion || []);

      // Obtener recomendaciones basadas en las etiquetas de detección
      const etiquetas = [...deteccion, tipo_piel, clasificacion];
      const recomendaciones = await obtenerRecomendaciones(etiquetas);
      setProductosRecomendados(recomendaciones);
    } else {
      setAnalisisResultado("❌ No se pudo realizar la predicción.");
      setProductosRecomendados(mockProducts); // Fallback
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
    return cart.reduce((total, item) => total + (item.precio * item.quantity), 0);
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

  const recomendacionesGenerales = [
  "Lava tu rostro dos veces al día con un limpiador suave.",
  "Usa protector solar todos los días, incluso en interiores.",
  "Evita tocarte la cara con las manos sucias.",
  "Mantén una dieta equilibrada y bebe suficiente agua.",
  "No olvides hidratar tu piel según tu tipo de piel.",
  "Evita productos abrasivos y consulta a un dermatólogo si tienes dudas.",
];

// Pantalla de Diagnóstico
const DiagnosisScreen = () => (
  <div className="diagnosis-screen">
    <div className="diagnosis-header" style={{
      background: '#111',
      borderRadius: 'none',
      padding: '1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: 'none',
    }}>
      <button
        className="back-button"
        onClick={() => setCurrentScreen('welcome')}
        style={{
          background: '#bbb',
          color: '#222',
          border: 'none',
          borderRadius: '2rem',
          padding: '0.5rem 1.2rem',
          fontWeight: 'bold',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
        Volver
    </button>
    <h2 style={{
      fontSize: '1.7rem',
      fontWeight: 'bold',
      color: '#fff',
      margin: 0,
      letterSpacing: '1px'
    }}>
      Análisis Dermatológico
    </h2>
  </div>

    <div className="diagnosis-content" style={{ display: 'flex', gap: '2rem' }}>
      {/* Columna izquierda: cámara y resultados */}
      <div className="camera-section" style={{ flex: 1 }}>
        <div className="camera-container">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Captura tu imagen
          </h3>
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
                  setCajasDeteccion([]);
                  startCamera();
                }}
              >
                Tomar Nueva Foto
              </button>
            </div>
          )}

          {/* Estado y resultados debajo de la cámara */}
          <div className="analysis-status" style={{ marginTop: '2rem' }}>
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
                <div className="diagnosis-summary analysis-completed">
                  <h4 style={{ marginBottom: '1rem' }}>
                    Análisis Completado
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {(() => {
                      const lines = analisisResultado.split('\n');
                      return lines.map((line, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          fontSize: '1.1rem'
                        }}>
                          {line.includes('Edad estimada') && (
                            <span style={{ marginRight: '0.5rem' }}>🔍</span>
                          )}
                          {line.includes('Análisis de piel') && (
                            <span style={{ marginRight: '0.5rem' }}>🩺</span>
                          )}
                          {line.includes('Tipo de piel') && (
                            <span style={{ marginRight: '0.5rem' }}>💧</span>
                          )}
                          <span>{line.replace(/^[^:]+:\s*/, '')}</span>
                        </li>
                      ));
                    })()}
                  </ul>
                </div>
                
                {/* Resumen de detecciones YOLO */}
                {cajasDeteccion.length > 0 && (
                  <div className="detection-summary" style={{
                    background: '#fff',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginTop: '1rem',
                    border: '2px solid #ff4444'
                  }}>
                    <h4 style={{ 
                      color: '#ff4444', 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🎯 Detecciones de Afecciones
                    </h4>
                    
                    {/* Imagen única con todos los boxes */}
                    <div className="detection-main-image">
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={capturedImage ?? ''} 
                          alt="Detección de afecciones"
                          style={{ 
                            width: '200px', 
                            height: '200px', 
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }} 
                        />
                        {/* Todos los boxes en una sola imagen */}
                        {cajasDeteccion.map((caja, index) => (
                          <div
                            key={index}
                            className="detection-box-main"
                            style={{
                              left: `${(caja.x1 / 256) * 100}%`,
                              top: `${(caja.y1 / 256) * 100}%`,
                              width: `${((caja.x2 - caja.x1) / 256) * 100}%`,
                              height: `${((caja.y2 - caja.y1) / 256) * 100}%`
                            }}
                          >
                            <div className="detection-label-main">
                              {caja.etiqueta}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Lista de detecciones individuales */}
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                      {cajasDeteccion.map((caja, index) => (
                        <div key={index} className="detection-item">
                          <div className="detection-info">
                            <span style={{ fontWeight: 'bold', color: '#ff4444' }}>
                              {caja.etiqueta}
                            </span>
                            <span className="detection-confidence">
                              {(caja.confianza * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ 
                      marginTop: '1rem', 
                      fontSize: '0.9rem', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Las cajas rojas en la imagen indican las áreas donde se detectaron afecciones de piel.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha: recomendaciones */}
      <div className="recommendations-section" style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Recomendaciones
        </h3>
        {!diagnosisComplete ? (
          <>
            <InstruccionesPrevias />
            <div className="general-tips"
              style={{
                background: '#fff',
                borderRadius: '1rem',
                padding: '2rem',
                color: '#222',
                marginBottom: '2rem'
              }}>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                Consejos para cuidar tu piel
              </h4>
              <ul style={{ textAlign: 'left', marginTop: '1rem' }}>
                <li style={{ marginBottom: '0.75rem' }}>Lava tu rostro dos veces al día con un limpiador suave. 🧼</li>
                <li style={{ marginBottom: '0.75rem' }}>Usa protector solar todos los días, incluso en interiores. 🌞</li>
                <li style={{ marginBottom: '0.75rem' }}>Evita tocarte la cara con las manos sucias. 🙅‍♂️</li>
                <li style={{ marginBottom: '0.75rem' }}>Mantén una dieta equilibrada y bebe suficiente agua. 💧</li>
                <li style={{ marginBottom: '0.75rem' }}>No olvides hidratar tu piel según tu tipo de piel. 🧴</li>
                <li style={{ marginBottom: '0.75rem' }}>Evita productos abrasivos y consulta a un dermatólogo si tienes dudas. 🩺</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="product-recommendations">
            <h4>Productos Recomendados</h4>
            <div className="products-grid">
              {productosRecomendados.map(product => (
                <div key={product.id} className="product-card">
                  <img src={`http://localhost:8000/static/images/${product.imagen}`} alt={product.nombre} />
                  <div className="product-info">
                    <h5>{product.nombre}</h5>
                    <p className="product-description">{product.descripcion}</p>
                    <div className="product-footer">
                      <span className="price">${product.precio}</span>
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
            <div className="go-to-cart" style={{ marginTop: '2rem' }}>
              <button
                className="cart-button"
                onClick={() => setCurrentScreen('cart')}
              >
                <ShoppingCart size={20} />
                Ver Carrito ({cart.length})
              </button>
            </div>
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
                    <img src={`http://localhost:8000/static/images/${item.imagen}`} alt={item.nombre} />
                    <div className="item-details">
                      <h4>{item.nombre}</h4>
                      <p className="item-category">{item.etiquetas.join(", ")}</p>
                      <p className="item-description">{item.descripcion}</p>
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
                        ${(item.precio * item.quantity).toFixed(2)}
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