import { useState, useEffect } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

function CarritoPage() {
  const { isMobile } = useWindowSize();
  const [carrito, setCarrito] = useState<any[]>([]);
  const [modo, setModo] = useState<"qr" | "subir" | "declarar" | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [nombreDeclarado, setNombreDeclarado] = useState("");
  const [monto, setMonto] = useState("");
  const [celular, setCelular] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("carrito");
    setCarrito(saved ? JSON.parse(saved) : []);
  }, []);

  const quitarDelCarrito = (index: number) => {
    const nuevo = carrito.filter((_, i) => i !== index);
    setCarrito(nuevo);
    localStorage.setItem("carrito", JSON.stringify(nuevo));
  };

  const total = carrito.reduce((sum, p) => {
    const precio = p.descuento > 0 ? p.precio - (p.precio * p.descuento / 100) : p.precio;
    return sum + precio;
  }, 0);

  const adelanto = total * 0.30;

  const handleSubirComprobante = async () => {
    if (!comprobante || !nombreDeclarado || !monto || !celular) return;
    setEnviando(true);
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
      setCarrito([]);
    } else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  const handleDeclararPago = async () => {
    if (!nombreDeclarado || !monto || !celular) return;
    setEnviando(true);
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
      setCarrito([]);
    } else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  return (
    <div style={{ background: "#000", color: "white", minHeight: "100vh", padding: "80px 20px 40px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, marginBottom: 24 }}>🛒 Mi Carrito</h1>

        {mensaje ? (
          <div style={{ background: "#1e293b", padding: 28, borderRadius: 14, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: "white", fontSize: 16 }}>{mensaje}</p>
          </div>
        ) : carrito.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, background: "#1e293b", borderRadius: 14 }}>
            <p style={{ color: "#64748b", fontSize: 16 }}>Tu carrito está vacío.</p>
          </div>
        ) : (
          <>
            {/* Lista de productos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {carrito.map((item, i) => {
                const precio = item.descuento > 0 ? item.precio - (item.precio * item.descuento / 100) : item.precio;
                return (
                  <div key={i} style={{ background: "#1e293b", padding: 16, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ color: "white", fontWeight: "bold" }}>{item.nombre}</p>
                      <p style={{ color: "#22c55e", fontWeight: "bold" }}>Bs {precio.toFixed(2)}</p>
                    </div>
                    <button onClick={() => quitarDelCarrito(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div style={{ background: "#1e293b", padding: 20, borderRadius: 14, marginBottom: 24 }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>
                Total: <strong style={{ color: "#22c55e" }}>Bs {total.toFixed(2)}</strong>
              </p>
              <p style={{ color: "#60a5fa", fontSize: 14 }}>
                Adelanto sugerido (30%): <strong>Bs {adelanto.toFixed(2)}</strong>
              </p>
            </div>

            {/* Sección de pago */}
            <div style={{ background: "#1e293b", padding: 24, borderRadius: 14 }}>
              <h2 style={{ marginBottom: 16, fontSize: 20 }}>💳 Proceder al pago</h2>

              {!modo ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <button onClick={() => setModo("subir")} style={btnStyle}>
                    📤 Subir comprobante
                  </button>
                  <button onClick={() => setModo("declarar")} style={btnStyle}>
                    📝 Declarar pago
                  </button>
                </div>
              ) : (
                <>
                  {/* QR y datos bancarios */}
                  <div style={{ background: "#0f172a", padding: 20, borderRadius: 10, textAlign: "center", marginBottom: 20 }}>
                    <div style={{ width: 120, height: 120, background: "#334155", margin: "0 auto 12px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📱</div>
                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Banco: Banco Unión</p>
                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Cuenta: 123456789</p>
                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Titular: Asociación Vanguardistas 3.0</p>
                  </div>

                  {/* Subir comprobante */}
                  {modo === "subir" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input placeholder="Nombre completo" value={nombreDeclarado} onChange={e => setNombreDeclarado(e.target.value)} style={inputStyle} />
                      <input placeholder="Monto depositado (Bs)" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={inputStyle} />
                      <input placeholder="Número de celular" value={celular} onChange={e => setCelular(e.target.value)} style={inputStyle} />
                      <label style={{ color: "#94a3b8", fontSize: 12 }}>Sube la foto del comprobante</label>
                      <input type="file" accept="image/*" onChange={e => setComprobante(e.target.files?.[0] || null)} style={{ color: "white" }} />
                      <button onClick={handleSubirComprobante} disabled={enviando} style={{ ...btnStyle, background: "#22c55e" }}>
                        {enviando ? "Enviando..." : "Enviar comprobante"}
                      </button>
                    </div>
                  )}

                  {/* Declarar pago */}
                  {modo === "declarar" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input placeholder="Nombre completo" value={nombreDeclarado} onChange={e => setNombreDeclarado(e.target.value)} style={inputStyle} />
                      <input placeholder="Monto depositado (Bs)" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={inputStyle} />
                      <input placeholder="Número de celular" value={celular} onChange={e => setCelular(e.target.value)} style={inputStyle} />
                      <input placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} />
                      <button onClick={handleDeclararPago} disabled={enviando} style={{ ...btnStyle, background: "#22c55e" }}>
                        {enviando ? "Enviando..." : "Declarar pago"}
                      </button>
                    </div>
                  )}

                  <button onClick={() => setModo(null)} style={{ ...btnStyle, background: "#334155", marginTop: 12 }}>
                    ← Volver
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#3b82f6", border: "none", padding: "12px 20px",
  borderRadius: 8, color: "white", fontWeight: "bold",
  cursor: "pointer", fontSize: 14, width: "100%",
};

const inputStyle: React.CSSProperties = {
  padding: 10, borderRadius: 8, border: "none",
  background: "#334155", color: "white", fontSize: 14,
  width: "100%", boxSizing: "border-box",
};

export default CarritoPage;