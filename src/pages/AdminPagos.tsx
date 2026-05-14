import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";

const API_URL = import.meta.env.VITE_API_URL;

interface Pago {
  id: number;
  nombreDeclarado: string;
  monto: number;
  tipo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  estado: string;
  motivoRechazo: string | null;
  creadoEn: string;
}

function AdminPagos() {
  const { token } = useAuth();
  const { isMobile } = useWindowSize();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/pagos`, { headers });
    if (res.ok) setPagos(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verificar = async (id: number) => {
    const res = await fetch(`${API_URL}/pagos/${id}/verificar`, { method: "PUT", headers });
    if (res.ok) await load();
  };

  const rechazar = async (id: number) => {
    if (!motivoRechazo.trim()) return alert("Escribe el motivo del rechazo");
    const res = await fetch(`${API_URL}/pagos/${id}/rechazar`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ motivoRechazo }),
    });
    if (res.ok) {
      setMotivoRechazo("");
      setRechazandoId(null);
      await load();
    }
  };

  const getEstadoColor = (estado: string) => {
    if (estado === "verificado") return { bg: "#14532d", color: "#22c55e" };
    if (estado === "rechazado") return { bg: "#7f1d1d", color: "#ef4444" };
    return { bg: "#422006", color: "#f59e0b" };
  };

  const pendientes = pagos.filter(p => p.estado === "pendiente");
  const procesados = pagos.filter(p => p.estado !== "pendiente");

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: isMobile ? 22 : 28 }}>💰 Pagos</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: isMobile ? 13 : 15 }}>
        Gestiona los pagos de los clientes.
      </p>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Cargando pagos...</p>
      ) : (
        <>
          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: "#f59e0b", marginBottom: 16, fontSize: isMobile ? 15 : 17 }}>
                ⏳ Pendientes ({pendientes.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pendientes.map(p => (
                  <PagoCard
                    key={p.id}
                    pago={p}
                    rechazandoId={rechazandoId}
                    motivoRechazo={motivoRechazo}
                    setMotivoRechazo={setMotivoRechazo}
                    setRechazandoId={setRechazandoId}
                    onVerificar={verificar}
                    onRechazar={rechazar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Procesados */}
          {procesados.length > 0 && (
            <div>
              <h3 style={{ color: "#94a3b8", marginBottom: 16, fontSize: isMobile ? 15 : 17 }}>
                📋 Procesados ({procesados.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {procesados.map(p => (
                  <PagoCard
                    key={p.id}
                    pago={p}
                    rechazandoId={null}
                    motivoRechazo=""
                    setMotivoRechazo={() => {}}
                    setRechazandoId={() => {}}
                    onVerificar={() => {}}
                    onRechazar={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {pagos.length === 0 && (
            <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>
              No hay pagos registrados aún.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tarjeta de pago ──────────────────────────────────────────────────────────
function PagoCard({
  pago, rechazandoId, motivoRechazo, setMotivoRechazo,
  setRechazandoId, onVerificar, onRechazar,
}: any) {
  const statusColors = {
    pendiente: { bg: "#422006", color: "#f59e0b" },
    verificado: { bg: "#14532d", color: "#22c55e" },
    rechazado: { bg: "#7f1d1d", color: "#ef4444" },
  };
  const sc = statusColors[pago.estado as keyof typeof statusColors];

  return (
    <div style={{
      background: "#1e293b", padding: 16, borderRadius: 12,
      borderLeft: `4px solid ${sc.color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>{pago.nombreDeclarado}</p>
          <p style={{ color: "#22c55e", fontWeight: "bold", fontSize: 18, margin: "4px 0" }}>
            Bs {pago.monto.toFixed(2)}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: "bold" }}>
              {pago.estado}
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {pago.tipo === "imagen" ? "📷 Comprobante" : "📝 Declarado"}
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {new Date(pago.creadoEn).toLocaleString()}
            </span>
          </div>
          {pago.descripcion && (
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>📝 {pago.descripcion}</p>
          )}
          {/* Productos del carrito asociados al pago */}
{pago.productos && (() => {
  try {
    const prods = JSON.parse(pago.productos);
    if (Array.isArray(prods) && prods.length > 0) {
      return (
        <div style={{ marginTop: 6 }}>
          <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Productos solicitados:</p>
          {prods.map((prod: any, idx: number) => (
            <span key={idx} style={{ color: "#60a5fa", fontSize: 11, marginRight: 8 }}>📌 {prod.nombre}</span>
          ))}
        </div>
      );
    }
  } catch { return null; }
  return null;
})()}
          {pago.motivoRechazo && (
            <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>❌ {pago.motivoRechazo}</p>
          )}
        </div>

        {pago.estado === "pendiente" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pago.imagenUrl && (
              <button onClick={() => window.open(pago.imagenUrl!, "_blank")} style={btnGray}>
                📷 Ver comprobante
              </button>
            )}
            <button onClick={() => onVerificar(pago.id)} style={btnGreen}>
              ✅ Verificar
            </button>
            {rechazandoId === pago.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  placeholder="Motivo del rechazo"
                  value={motivoRechazo}
                  onChange={e => setMotivoRechazo(e.target.value)}
                  style={{ padding: 6, borderRadius: 6, border: "none", background: "#0f172a", color: "white", fontSize: 12, width: 180 }}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => onRechazar(pago.id)} style={btnRed}>Confirmar</button>
                  <button onClick={() => { setRechazandoId(null); setMotivoRechazo(""); }} style={btnGray}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setRechazandoId(pago.id)} style={btnRed}>
                ❌ Rechazar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const btnGreen: React.CSSProperties = { background: "#22c55e", border: "none", padding: "8px 14px", borderRadius: 8, color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 13 };
const btnRed: React.CSSProperties = { background: "#ef4444", border: "none", padding: "8px 14px", borderRadius: 8, color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 13 };
const btnGray: React.CSSProperties = { background: "#334155", border: "none", padding: "8px 14px", borderRadius: 8, color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 13 };

export default AdminPagos;