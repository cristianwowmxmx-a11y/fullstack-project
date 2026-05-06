import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";

const API_URL = "https://taskmanager-backend-ewud.onrender.com";

interface Note {
  id: number;
  text: string;
  createdAt: string;
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: "inline-block", width: 16, height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid white", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </>
  );
}

function Notes() {
  const { token } = useAuth();
  const { isMobile } = useWindowSize();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/notes`, { headers });
    setNotes(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try {
      await fetch(`${API_URL}/notes`, {
        method: "POST", headers,
        body: JSON.stringify({ text }),
      });
      setText("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: "DELETE", headers });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: isMobile ? 22 : 28 }}>📌 Notas</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: isMobile ? 13 : 15 }}>
        Tus notas personales del panel.
      </p>

      {/* INPUT */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10, marginBottom: 30,
      }}>
        <textarea
          placeholder="Escribe una nota..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{
            flex: 1, padding: 12, borderRadius: 8,
            border: "none", background: "#1e293b",
            color: "white", fontSize: 14, resize: "none",
          }}
        />
        <button
          onClick={add}
          disabled={adding}
          style={{
            padding: "12px 20px",
            background: adding ? "#334155" : "#3b82f6",
            border: "none", borderRadius: 8,
            color: "white", cursor: adding ? "not-allowed" : "pointer",
            fontWeight: "bold",
            alignSelf: isMobile ? "stretch" : "flex-end",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          {adding ? <Spinner /> : "➕ Agregar"}
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
          <Spinner />
        </div>
      ) : notes.length === 0 ? (
        <p style={{ color: "#64748b" }}>No hay notas aún.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16,
        }}>
          {notes.map((n) => (
            <div key={n.id} style={{
              background: "#1e293b", padding: 20,
              borderRadius: 12, position: "relative",
              borderLeft: "4px solid #3b82f6",
            }}>
              <p style={{ color: "white", lineHeight: 1.6, marginBottom: 12, paddingRight: 24 }}>
                {n.text}
              </p>
              <p style={{ color: "#64748b", fontSize: 12 }}>
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => remove(n.id)}
                disabled={deletingId === n.id}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "none", border: "none",
                  color: "#ef4444", cursor: deletingId === n.id ? "not-allowed" : "pointer",
                  fontSize: 16, display: "flex", alignItems: "center",
                }}
              >
                {deletingId === n.id ? <Spinner /> : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notes;