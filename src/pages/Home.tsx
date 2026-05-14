import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";

function Home() {
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();
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

  const stats = [
    { number: "50+", label: "Libros publicados", icon: "📚" },
    { number: "30+", label: "Revistas editadas", icon: "📘" },
    { number: "100+", label: "Autores registrados", icon: "✍️" },
    { number: "3+", label: "Años de experiencia", icon: "🏅" },
  ];

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

          {/* BOTONES */}
          <div style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            opacity: showSub ? 1 : 0, transition: "all 1s ease 0.3s",
          }}>
            <button className="btn-primary" onClick={() => navigate("/servicios")} style={{
              background: "#3b82f6", border: "none",
              padding: isMobile ? "12px 28px" : "14px 36px",
              borderRadius: 8, color: "white",
              fontSize: isMobile ? 14 : 16,
              cursor: "pointer", fontWeight: 700, transition: "background 0.3s",
            }}>
              Ver servicios
            </button>
            <button className="btn-outline" onClick={() => navigate("/publicaciones")} style={{
              background: "transparent", border: "2px solid #3b82f6",
              padding: isMobile ? "12px 28px" : "14px 36px",
              borderRadius: 8, color: "#3b82f6",
              fontSize: isMobile ? 14 : 16,
              cursor: "pointer", fontWeight: 700, transition: "all 0.3s",
            }}>
              Ver publicaciones
            </button>
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section style={{
        padding: isMobile ? "40px 20px" : "60px 40px",
        maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 20,
        }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{
              background: "#111", padding: isMobile ? 20 : 28,
              borderRadius: 16, textAlign: "center",
              border: "1px solid #222", transition: "all 0.4s ease",
              animation: `countUp 0.6s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{
                fontSize: isMobile ? 28 : 36, fontWeight: 700,
                color: "#3b82f6", marginBottom: 4,
              }}>
                {s.number}
              </div>
              <div style={{ color: "#888", fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

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
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 20,
        }}>
          <CatalogoProductos />
        </div>
      </section>

      {/* ─── SECCIÓN DE PAGO ────────────────────────────────────────── */}
      <section style={{
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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/productos`)
      .then(r => r.json())
      .then(data => { setProductos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", gridColumn: "1/-1" }}>Cargando productos...</p>;
  if (productos.length === 0) return <p style={{ color: "#64748b", textAlign: "center", gridColumn: "1/-1" }}>Próximamente nuevos servicios.</p>;

  return (
    <>
      {productos.map((p: any) => {
        const precioFinal = p.descuento > 0 ? p.precio - (p.precio * p.descuento / 100) : p.precio;
        return (
          <div key={p.id} style={{
            background: "#111", padding: 24, borderRadius: 14,
            border: "1px solid #222", transition: "all 0.3s ease",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <h3 style={{ color: "#3b82f6", fontSize: 18, fontWeight: 700 }}>{p.nombre}</h3>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, flex: 1 }}>{p.descripcion}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              {p.descuento > 0 && (
                <span style={{ color: "#ef4444", fontSize: 16, textDecoration: "line-through" }}>
                  Bs {p.precio.toFixed(2)}
                </span>
              )}
              <span style={{ color: "#22c55e", fontSize: 22, fontWeight: "bold" }}>
                Bs {precioFinal.toFixed(2)}
              </span>
              {p.descuento > 0 && (
                <span style={{ background: "#ef4444", color: "white", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: "bold" }}>
                  -{p.descuento}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── Componente de Sección de Pago ──────────────────────────────────────────
function SeccionPago() {
  const [modo, setModo] = useState<"qr" | "subir" | "declarar" | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [nombreDeclarado, setNombreDeclarado] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleSubirComprobante = async () => {
    if (!comprobante || !nombreDeclarado || !monto) return;
    setEnviando(true);
    const formData = new FormData();
    formData.append("comprobante", comprobante);
    formData.append("tipo", "imagen");
    formData.append("nombreDeclarado", nombreDeclarado);
    formData.append("monto", monto);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/pagos`, { method: "POST", body: formData });
    if (res.ok) setMensaje("✅ Comprobante enviado. El equipo lo revisará pronto.");
    else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  const handleDeclararPago = async () => {
    if (!nombreDeclarado || !monto) return;
    setEnviando(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/pagos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreDeclarado, monto: Number(monto), tipo: "declarado", descripcion }),
    });
    if (res.ok) setMensaje("✅ Pago declarado. El equipo lo verificará pronto.");
    else setMensaje("❌ Error al enviar. Intenta de nuevo.");
    setEnviando(false);
  };

  if (mensaje) return (
    <div style={{ background: "#1e293b", padding: 28, borderRadius: 14, textAlign: "center" }}>
      <p style={{ color: "white", fontSize: 16, marginBottom: 16 }}>{mensaje}</p>
      <button onClick={() => { setMensaje(""); setModo(null); }} style={{ ...btnStyle, background: "#334155" }}>
        Hacer otro envío
      </button>
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
          <label style={labelStyle}>Sube la foto del comprobante</label>
          <input type="file" accept="image/*" onChange={e => setComprobante(e.target.files?.[0] || null)} style={{ color: "white", marginBottom: 12 }} />
          <button onClick={handleSubirComprobante} disabled={!comprobante || !nombreDeclarado || !monto || enviando} style={{ ...btnStyle, background: "#22c55e", opacity: !comprobante || !nombreDeclarado || !monto ? 0.5 : 1 }}>
            {enviando ? "Enviando..." : "Enviar comprobante"}
          </button>
        </div>
      )}

      {/* Declarar pago */}
      {modo === "declarar" && (
        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Nombre completo" value={nombreDeclarado} onChange={e => setNombreDeclarado(e.target.value)} style={inputStyle} />
          <input placeholder="Monto depositado (Bs)" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={inputStyle} />
          <input placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} />
          <button onClick={handleDeclararPago} disabled={!nombreDeclarado || !monto || enviando} style={{ ...btnStyle, background: "#22c55e", opacity: !nombreDeclarado || !monto ? 0.5 : 1 }}>
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