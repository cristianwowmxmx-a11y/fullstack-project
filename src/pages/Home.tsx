import { useEffect, useState, useRef } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

function Home() {
  const { isMobile } = useWindowSize();
  const [typedText, setTypedText] = useState("");
  const [showSub, setShowSub] = useState(false);
  const lightRef = useRef<HTMLDivElement>(null);
  const fullText = "Publica tu libro y revista";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowSub(true), 300);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lightRef.current) {
        lightRef.current.style.left = e.clientX + "px";
        lightRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div style={{ background: "#000", color: "white", overflowX: "hidden", minHeight: "100vh" }}>
      <style>{`
        @keyframes blink { 50% { border-color: transparent; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card:hover { transform: translateY(-8px) !important; border-color: #3b82f6 !important; }
        .btn-primary:hover { background: #2563eb !important; }
        .btn-outline:hover { background: #3b82f6 !important; color: white !important; }
        .social-link:hover { transform: scale(1.2) !important; background: #3b82f6 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
      `}</style>

      {/* LUZ DEL MOUSE */}
      <div ref={lightRef} style={{
        position: "fixed", width: 300, height: 300,
        background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)",
        pointerEvents: "none", borderRadius: "50%", zIndex: 0,
        transform: "translate(-50%,-50%)", transition: "left 0.05s, top 0.05s",
      }} />

      {/* FONDO */}
      <div style={{
        position: "fixed", width: "100%", height: "100%", zIndex: -1,
        background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.08), transparent 60%)",
      }} />

      {/* HERO */}
      <section style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        padding: "20px", position: "relative", zIndex: 1, paddingTop: 80,
      }}>
        <div style={{ animation: "fadeIn 1s ease" }}>
          {/* LOGO */}
          <div style={{
            width: isMobile ? 100 : 140, height: isMobile ? 100 : 140,
            borderRadius: "50%", background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 60px rgba(59,130,246,0.4)",
            overflow: "hidden",
          }}>
            <div style={{ fontSize: isMobile ? 50 : 70 }}>📖</div>
          </div>

          <p style={{
            color: "#3b82f6", fontSize: isMobile ? 11 : 13,
            letterSpacing: 4, textTransform: "uppercase", marginBottom: 8,
          }}>
            ASOCIACIÓN DE ESCRITORES
          </p>
          <h2 style={{
            color: "white", fontSize: isMobile ? 20 : 28,
            fontWeight: 700, letterSpacing: 2, marginBottom: 28,
          }}>
            VANGUARDISTAS 3.0
          </h2>

          {/* TYPEWRITER */}
          <h1 style={{
            fontSize: isMobile ? 28 : 52, fontWeight: 700,
            marginBottom: 20, lineHeight: 1.2,
          }}>
            <span>{typedText}</span>
            <span style={{
              borderRight: "3px solid #3b82f6",
              animation: "blink 0.8s infinite", marginLeft: 2,
            }} />
          </h1>

          <p style={{
            color: "#aaa", fontSize: isMobile ? 14 : 18,
            maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.8,
            opacity: showSub ? 1 : 0,
            transform: showSub ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease",
          }}>
            Publicamos libros y revistas con respaldo legal en Bolivia.
            Somos la Asociación de Escritores Vanguardistas 3.0 — El Alto, Bolivia.
          </p>
        </div>
      </section>

      {/* ─── CATÁLOGO DE PRODUCTOS ─────────────────────────────────── */}
      {/* ─── CATÁLOGO DE PRODUCTOS ─────────────────────────────────── */}
<section style={{
  padding: isMobile ? "40px 20px" : "60px 40px",
  maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1,
}}>
  <div style={{ textAlign: "center", marginBottom: 40 }}>
    <p style={{ color: "#3b82f6", letterSpacing: 4, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>
      Catálogo de Servicios
    </p>
    <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 700, marginBottom: 16 }}>
      Nuestros Productos Editoriales
    </h2>
    <div style={{ width: 60, height: 3, background: "#3b82f6", margin: "0 auto 20px", borderRadius: 99 }} />
  </div>

  <div id="catalogo" style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", // Cambiado a 2 columnas
    gap: 24,
  }}>
    <CatalogoProductos />
  </div>
</section>

      {/* ─── SECCIÓN DE PAGO ────────────────────────────────────────── */}
      <section id="seccion-pago" style={{
        padding: isMobile ? "40px 20px" : "60px 40px",
        maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ color: "#22c55e", letterSpacing: 4, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>
            Realiza tu pago
          </p>
          <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 700, marginBottom: 16 }}>
            ¿Ya realizaste tu pago?
          </h2>
          <div style={{ width: 60, height: 3, background: "#22c55e", margin: "0 auto 20px", borderRadius: 99 }} />
        </div>

        <SeccionPago />
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: "center", padding: "30px 20px",
        color: "#555", borderTop: "1px solid #222",
        fontSize: 13, position: "relative", zIndex: 1, marginTop: 40,
      }}>
        <p style={{ color: "#3b82f6", fontWeight: 700, marginBottom: 8 }}>
          ASOCIACIÓN DE ESCRITORES VANGUARDISTAS 3.0
        </p>
        <p>© {new Date().getFullYear()} — El Alto, Bolivia. Todos los derechos reservados.</p>
      </footer>

      {/* REDES SOCIALES */}
      <div style={{
        position: "fixed", right: 20, bottom: 20,
        display: "flex", flexDirection: "column", gap: 12, zIndex: 999,
      }}>
        {[
          { img: "https://cdn-icons-png.flaticon.com/512/733/733585.png", href: "https://wa.me/59167027053" },
          { img: "https://cdn-icons-png.flaticon.com/512/733/733547.png", href: "https://www.facebook.com/RevistaMiAulaLapizEduTec" },
          { img: "https://cdn-icons-png.flaticon.com/512/3046/3046121.png", href: "https://www.tiktok.com/@escritoresvanguardistas" },
        ].map((s, i) => (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
            className="social-link"
            style={{
              background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)",
              padding: 10, borderRadius: "50%", transition: "all 0.3s",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 46, height: 46, border: "1px solid #333", textDecoration: "none",
            }}>
            <img src={s.img} alt="red social" style={{ width: 22, height: 22 }} />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Componente de Catálogo de Productos ────────────────────────────────────
function CatalogoProductos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [carrito, setCarrito] = useState<any[]>(() => {
    const saved = localStorage.getItem("carrito");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/productos`)
      .then(r => r.json())
      .then(data => { setProductos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  const agregarAlCarrito = (producto: any) => {
    setCarrito(prev => [...prev, producto]);
  };

  const quitarDelCarrito = (index: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== index));
  };

  const total = carrito.reduce((sum, p) => {
    const precio = p.descuento > 0 ? p.precio - (p.precio * p.descuento / 100) : p.precio;
    return sum + precio;
  }, 0);

  const adelanto = total * 0.30;

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", gridColumn: "1/-1" }}>Cargando productos...</p>;
  if (productos.length === 0) return <p style={{ color: "#64748b", textAlign: "center", gridColumn: "1/-1" }}>Próximamente nuevos servicios.</p>;

  return (
    <>
      {productos.map((p: any) => {
        const precioFinal = p.descuento > 0 ? p.precio - (p.precio * p.descuento / 100) : p.precio;
        return (
          <div key={p.id} style={{
            background: "#111", borderRadius: 14,
            border: "1px solid #222", transition: "all 0.3s ease",
            overflow: "hidden", cursor: "pointer",
            display: "flex", flexDirection: "column", // Para que el contenido ocupe todo el alto
          }} onClick={() => setSelected(p)}>
            {p.imagenUrl ? (
              <img src={p.imagenUrl} alt={p.nombre} style={{ width: "100%", height: 280, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 280, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>📦</div>
            )}
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ color: "#3b82f6", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{p.nombre}</h3>
              <p style={{ color: "#888", fontSize: 14, lineHeight: 1.5, flex: 1 }}>{p.descripcion.slice(0, 120)}...</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                {p.descuento > 0 && (
                  <span style={{ color: "#ef4444", fontSize: 16, textDecoration: "line-through" }}>
                    Bs {p.precio.toFixed(2)}
                  </span>
                )}
                <span style={{ color: "#22c55e", fontSize: 24, fontWeight: "bold" }}>
                  Bs {precioFinal.toFixed(2)}
                </span>
                {p.descuento > 0 && (
                  <span style={{ background: "#ef4444", color: "white", padding: "2px 10px", borderRadius: 99, fontSize: 13, fontWeight: "bold" }}>
                    -{p.descuento}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    

      {/* Modal de detalle */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999, padding: "20px",
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: "#1e293b", borderRadius: 16, maxWidth: 500, width: "100%",
            padding: 28, color: "white", position: "relative",
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: 12, right: 12,
              background: "none", border: "none", color: "#94a3b8",
              cursor: "pointer", fontSize: 20,
            }}>✕</button>
            {selected.imagenUrl && (
              <img src={selected.imagenUrl} alt={selected.nombre} style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
            )}
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>{selected.nombre}</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{selected.descripcion}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              {selected.descuento > 0 && (
                <span style={{ color: "#ef4444", fontSize: 16, textDecoration: "line-through" }}>
                  Bs {selected.precio.toFixed(2)}
                </span>
              )}
              <span style={{ color: "#22c55e", fontSize: 24, fontWeight: "bold" }}>
                Bs {(selected.descuento > 0 ? selected.precio - (selected.precio * selected.descuento / 100) : selected.precio).toFixed(2)}
              </span>
            </div>
            <button onClick={() => {
              agregarAlCarrito(selected);
              setSelected(null);
            }} style={{
              width: "100%", padding: 14,
              background: "#22c55e", border: "none", borderRadius: 10,
              color: "white", fontWeight: "bold", fontSize: 16, cursor: "pointer",
            }}>
              🛒 Agregar al carrito
            </button>
          </div>
        </div>
      )}

      {/* ─── CARRITO FLOTANTE ─────────────────────────────────────── */}
      {carrito.length > 0 && (
        <div style={{
          position: "fixed", bottom: 20, left: 20, zIndex: 999,
          background: "#1e293b", borderRadius: 16, padding: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)", minWidth: 260,
          maxWidth: 320,
        }}>
          <h3 style={{ marginBottom: 12, color: "#f59e0b", fontSize: 15 }}>🛒 Mi carrito ({carrito.length})</h3>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
            {carrito.map((item, i) => {
              const precio = item.descuento > 0 ? item.precio - (item.precio * item.descuento / 100) : item.precio;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 12 }}>
                  <span>{item.nombre}</span>
                  <span>Bs {precio.toFixed(2)}</span>
                  <button onClick={() => quitarDelCarrito(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid #334155", paddingTop: 8, marginBottom: 8 }}>
            <p style={{ color: "white", fontSize: 13 }}>Total: <strong style={{ color: "#22c55e" }}>Bs {total.toFixed(2)}</strong></p>
            <p style={{ color: "#60a5fa", fontSize: 12 }}>Adelanto sugerido (30%): <strong>Bs {adelanto.toFixed(2)}</strong></p>
          </div>
          <button onClick={() => {
            document.getElementById("seccion-pago")?.scrollIntoView({ behavior: "smooth" });
          }} style={{
            width: "100%", padding: 10,
            background: "#3b82f6", border: "none", borderRadius: 8,
            color: "white", fontWeight: "bold", fontSize: 14, cursor: "pointer",
          }}>
            Pagar adelanto
          </button>
          <button onClick={() => setCarrito([])} style={{
            width: "100%", padding: 8, marginTop: 6,
            background: "none", border: "1px solid #ef4444", borderRadius: 8,
            color: "#ef4444", fontSize: 12, cursor: "pointer",
          }}>
            Vaciar carrito
          </button>
        </div>
      )}
    </>
  );
}

// ─── Componente de Sección de Pago ──────────────────────────────────────────
function SeccionPago() {
  const [modo, setModo] = useState<"qr" | "subir" | "declarar" | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [nombreDeclarado, setNombreDeclarado] = useState("");
  const [monto, setMonto] = useState("");
  const [celular, setCelular] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const getCarritoActual = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem("carrito") || "[]");
    } catch { return []; }
  };

  const handleSubirComprobante = async () => {
    if (!comprobante || !nombreDeclarado || !monto || !celular) return;
    setEnviando(true);
    const carrito = getCarritoActual();
    const formData = new FormData();
    formData.append("comprobante", comprobante);
    formData.append("tipo", "imagen");
    formData.append("nombreDeclarado", nombreDeclarado);
    formData.append("monto", monto);
    formData.append("celular", celular);
    formData.append("productos", JSON.stringify(carrito.map(p => ({ id: p.id, nombre: p.nombre }))));
    const res = await fetch(`${import.meta.env.VITE_API_URL}/pagos`, { method: "POST", body: formData });
    if (res.ok) {
      setMensaje("✅ Enviado correctamente. La asociación se comunicará con usted.");
      localStorage.removeItem("carrito");
    } else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  const handleDeclararPago = async () => {
    if (!nombreDeclarado || !monto || !celular) return;
    setEnviando(true);
    const carrito = getCarritoActual();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/pagos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreDeclarado,
        monto: Number(monto),
        tipo: "declarado",
        descripcion,
        celular,
        productos: JSON.stringify(carrito.map(p => ({ id: p.id, nombre: p.nombre }))),
      }),
    });
    if (res.ok) {
      setMensaje("✅ Enviado correctamente. La asociación se comunicará con usted.");
      localStorage.removeItem("carrito");
    } else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  if (mensaje) return (
    <div style={{ background: "#1e293b", padding: 28, borderRadius: 14, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <p style={{ color: "white", fontSize: 16 }}>{mensaje}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* QR y datos bancarios */}
      <div style={{ background: "#1e293b", padding: 24, borderRadius: 14, textAlign: "center" }}>
        <p style={{ color: "white", fontWeight: "bold", marginBottom: 16 }}>Datos para el pago</p>
        <div style={{ width: 150, height: 150, background: "#334155", margin: "0 auto 16px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>📱</div>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Banco: Banco Unión</p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Cuenta: 123456789</p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Titular: Asociación de Escritores Vanguardistas 3.0</p>
      </div>

      {/* Botones de acción */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => setModo("subir")} style={{ ...btnStyle, background: modo === "subir" ? "#3b82f6" : "#334155" }}>
          📤 Subir comprobante
        </button>
        <button onClick={() => setModo("declarar")} style={{ ...btnStyle, background: modo === "declarar" ? "#3b82f6" : "#334155" }}>
          📝 Declarar pago
        </button>
      </div>

      {/* Subir comprobante */}
      {modo === "subir" && (
        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Nombre completo" value={nombreDeclarado} onChange={e => setNombreDeclarado(e.target.value)} style={inputStyle} />
          <input placeholder="Monto depositado (Bs)" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={inputStyle} />
          <input placeholder="Número de celular" value={celular} onChange={e => setCelular(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Sube la foto del comprobante</label>
          <input type="file" accept="image/*" onChange={e => setComprobante(e.target.files?.[0] || null)} style={{ color: "white", marginBottom: 12 }} />
          <button onClick={handleSubirComprobante} disabled={!comprobante || !nombreDeclarado || !monto || !celular || enviando} style={{ ...btnStyle, background: "#22c55e", opacity: !comprobante || !nombreDeclarado || !monto || !celular ? 0.5 : 1 }}>
            {enviando ? "Enviando..." : "Enviar comprobante"}
          </button>
        </div>
      )}

      {/* Declarar pago */}
      {modo === "declarar" && (
        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Nombre completo" value={nombreDeclarado} onChange={e => setNombreDeclarado(e.target.value)} style={inputStyle} />
          <input placeholder="Monto depositado (Bs)" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={inputStyle} />
          <input placeholder="Número de celular" value={celular} onChange={e => setCelular(e.target.value)} style={inputStyle} />
          <input placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} />
          <button onClick={handleDeclararPago} disabled={!nombreDeclarado || !monto || !celular || enviando} style={{ ...btnStyle, background: "#22c55e", opacity: !nombreDeclarado || !monto || !celular ? 0.5 : 1 }}>
            {enviando ? "Enviando..." : "Declarar pago"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Estilos auxiliares ──────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
  border: "none", padding: "12px 20px", borderRadius: 8,
  color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 14,
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "block", color: "#94a3b8", fontSize: 12,
  marginBottom: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
  padding: 10, borderRadius: 8, border: "none",
  background: "#334155", color: "white", fontSize: 14,
  width: "100%", boxSizing: "border-box",
};

export default Home;