import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: "inline-block", width: 20, height: 20,
        border: "3px solid rgba(255,255,255,0.3)",
        borderTop: "3px solid white", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </>
  );
}

// ─── Constantes ─────────────────────────────────────────────────────────────

/** Extensiones exactas que usa SENAPI */
const EXTENSIONES = ["LP", "CB", "SC", "OR", "PT", "CH", "TJ", "BN", "PD", "QR"] as const;
type Extension = typeof EXTENSIONES[number];

const SEXOS = ["Masculino", "Femenino"] as const;
type Sexo = typeof SEXOS[number];

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface LibroDetalle {
  numeroLibro: number;
  categoria: string;
  isbn: boolean;
  senapi: boolean;
  prioridad: string;
}

// ─── Componente principal ────────────────────────────────────────────────────
function ClientForm() {
  const { token } = useParams();

  // — UI state —
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [linkError, setLinkError]   = useState("");
  const [saveError, setSaveError]   = useState("");
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [success, setSuccess]       = useState(false);
  const [daysLeft, setDaysLeft]     = useState(0);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  // — Datos personales —
  const [ci, setCi]                             = useState("");
  const [nombres, setNombres]                   = useState("");
  const [apellidoPaterno, setApellidoPaterno]   = useState("");
  const [apellidoMaterno, setApellidoMaterno]   = useState("");
  const [sexo, setSexo]                         = useState<Sexo | "">("");
  const [ciudad, setCiudad]                     = useState("");
  const [direccion, setDireccion]               = useState("");
  const [fechaNacimiento, setFechaNacimiento]   = useState("");
  const [extension, setExtension]               = useState<Extension | "">("");
  const [profesion, setProfesion]               = useState("");
  const [celular, setCelular]                   = useState("");
  const [email, setEmail]                       = useState("");

  // — Servicios —
  const [pideLibros, setPideLibros]         = useState(false);
  const [cantLibros, setCantLibros]         = useState(1);
  const [pideArticulos, setPideArticulos]   = useState(false);
  const [cantArticulos, setCantArticulos]   = useState(1);
  const [pideDirector, setPideDirector]     = useState(false);
  const [notasServicio, setNotasServicio]   = useState("");
  const [libroDetalles, setLibroDetalles]   = useState<LibroDetalle[]>([]);

  // — Fotos —
  const [fotografia, setFotografia]       = useState<File | null>(null);
  const [fotoCarnet, setFotoCarnet]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview]     = useState<string>("");
  const [carnetPreview, setCarnetPreview] = useState<string>("");

  // ── Sincronizar detalles de libro cuando cambia cantidad ──────────────────
  useEffect(() => {
    if (!pideLibros) return;
    setLibroDetalles(prev => {
      const nuevos: LibroDetalle[] = [];
      for (let i = 1; i <= cantLibros; i++) {
        const existente = prev.find(d => d.numeroLibro === i);
        nuevos.push(existente || { numeroLibro: i, categoria: "", isbn: false, senapi: false, prioridad: "" });
      }
      return nuevos;
    });
  }, [cantLibros, pideLibros]);

  const updateLibroDetalle = (numeroLibro: number, campo: keyof LibroDetalle, valor: unknown) => {
    setLibroDetalles(prev =>
      prev.map(d => d.numeroLibro === numeroLibro ? { ...d, [campo]: valor } : d)
    );
  };

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/clients/form/${token}`);
      const data = await res.json();
      if (!res.ok) { setLinkError(data.error || "Link no válido"); return; }

      const expires = new Date(data.expiresAt);
      const diff    = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);

      setCi(data.ci || "");
      setNombres(data.nombres || "");
      setApellidoPaterno(data.apellidoPaterno || "");
      setApellidoMaterno(data.apellidoMaterno || "");
      setSexo(data.sexo || "");
      setCiudad(data.ciudad || "");
      setDireccion(data.direccion || "");
      setFechaNacimiento(data.fechaNacimiento || "");
      setExtension(data.extension || "");
      setProfesion(data.profesion || "");
      setCelular(data.celular || "");
      setEmail(data.email || "");
      setPideLibros(data.pideLibros || false);
      setCantLibros(data.cantLibros || 1);
      setPideArticulos(data.pideArticulos || false);
      setCantArticulos(data.cantArticulos || 1);
      setPideDirector(data.pideDirector || false);
      setNotasServicio(data.notasServicio || "");
      if (data.fotografia)  setFotoPreview(data.fotografia);
      if (data.fotoCarnet)  setCarnetPreview(data.fotoCarnet);
    } catch {
      setLinkError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Validación ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!ci.trim())                            e.ci = "La cédula es obligatoria";
    else if (!/^\d+$/.test(ci.trim()))         e.ci = "Solo puede contener números";

    if (!nombres.trim())                       e.nombres = "Los nombres son obligatorios";
    else if (/\d/.test(nombres))               e.nombres = "No puede contener números";

    if (!apellidoPaterno.trim())               e.apellidoPaterno = "El apellido paterno es obligatorio";
    else if (/\d/.test(apellidoPaterno))       e.apellidoPaterno = "No puede contener números";

    if (apellidoMaterno && /\d/.test(apellidoMaterno)) e.apellidoMaterno = "No puede contener números";

    if (!sexo)                                 e.sexo = "Seleccione un sexo";
    if (!ciudad.trim())                        e.ciudad = "La ciudad es obligatoria";
    if (!direccion.trim())                     e.direccion = "La dirección es obligatoria";
    if (!fechaNacimiento)                      e.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    if (!extension)                            e.extension = "Selecciona un departamento";

    if (!profesion.trim())                     e.profesion = "La profesión es obligatoria";
    else if (/\d/.test(profesion))             e.profesion = "No puede contener números";

    if (!celular.trim())                       e.celular = "El celular es obligatorio";
    else if (!/^\d+$/.test(celular.trim()))    e.celular = "Solo puede contener números";

    if (!email.trim())                         e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email no válido";

    if (!fotografia && !fotoPreview)           e.fotografia = "La foto personal es obligatoria";
    if (!fotoCarnet && !carnetPreview)         e.fotoCarnet = "La foto del carnet es obligatoria";

    if (pideLibros) {
      libroDetalles.forEach(d => {
        if (!d.categoria) e[`libro_${d.numeroLibro}_categoria`] = "Selecciona una categoría";
        if (!d.prioridad) e[`libro_${d.numeroLibro}_prioridad`] = "Selecciona una prioridad";
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      // 1. Subir fotos si las hay
      if (fotografia || fotoCarnet) {
        setSubiendoFotos(true);
        const formData = new FormData();
        if (fotografia) formData.append("fotografia", fotografia);
        if (fotoCarnet) formData.append("fotoCarnet", fotoCarnet);
        await fetch(`${API_URL}/clients/form/${token}/fotos`, { method: "POST", body: formData });
        setSubiendoFotos(false);
      }

      // 2. Guardar datos — nombreCompleto se construye aquí para compatibilidad
      const nombreCompleto = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();

      const res = await fetch(`${API_URL}/clients/form/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ci,
          nombres,
          apellidoPaterno,
          apellidoMaterno,
          nombreCompleto,          // campo unificado para compatibilidad
          sexo,
          ciudad,
          direccion,
          fechaNacimiento,
          extension,
          profesion,
          celular,
          email,
          pideLibros,
          cantLibros:    pideLibros    ? cantLibros    : 0,
          pideArticulos,
          cantArticulos: pideArticulos ? cantArticulos : 0,
          pideDirector,
          pideFundador: false,
          notasServicio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Error al guardar");
        return;
      }

      // 3. Guardar detalles de libros
      if (pideLibros && libroDetalles.length > 0) {
        await fetch(`${API_URL}/clients/form/${token}/libro-detalles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ detalles: libroDetalles }),
        });
      }

      setSuccess(true);
    } catch {
      setSaveError("Error al conectar con el servidor");
    } finally {
      setSaving(false);
      setSubiendoFotos(false);
    }
  };

  // ── Estados de carga / error ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a" }}>
      <Spinner />
    </div>
  );

  if (linkError) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a", color: "white", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 60 }}>⚠️</div>
      <h2>{linkError}</h2>
      <p style={{ color: "#94a3b8" }}>Contacta con la Asociación para obtener un nuevo link.</p>
    </div>
  );

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (success) return (
    <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px", color: "white" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div style={{ background: "#1e293b", padding: 36, borderRadius: 20, textAlign: "center", borderTop: "4px solid #22c55e" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>¡Datos guardados!</h2>
          <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 15 }}>
            Tus datos han sido registrados correctamente. El equipo los revisará pronto.
          </p>

          <div style={{ background: "#0f172a", padding: 20, borderRadius: 12, textAlign: "left", marginBottom: 24 }}>
            <p style={{ color: "#64748b", fontSize: 12, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Resumen de tus datos
            </p>

            {/* Fotos */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {fotoPreview && (
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>FOTO PERSONAL</p>
                  <img src={fotoPreview} alt="foto" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid #334155" }} />
                </div>
              )}
              {carnetPreview && (
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>FOTO CARNET</p>
                  <img src={carnetPreview} alt="carnet" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid #334155" }} />
                </div>
              )}
            </div>

            {/* Campos */}
            {[
              { label: "C.I.",              value: ci },
              { label: "Nombres",           value: nombres },
              { label: "Apellido Paterno",  value: apellidoPaterno },
              { label: "Apellido Materno",  value: apellidoMaterno },
              { label: "Sexo",              value: sexo },
              { label: "Ciudad",            value: ciudad },
              { label: "Dirección",         value: direccion },
              { label: "Fecha Nacimiento",  value: fechaNacimiento },
              { label: "Extensión",         value: extension },
              { label: "Profesión",         value: profesion },
              { label: "Celular",           value: celular },
              { label: "Email",             value: email },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{item.label}</span>
                <span style={{ color: "white", fontSize: 13 }}>{item.value}</span>
              </div>
            ))}

            {/* Servicios */}
            <div style={{ marginTop: 16 }}>
              <p style={{ color: "#64748b", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Servicios solicitados</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pideLibros    && <span style={tagStyle}>📚 Libros ({cantLibros})</span>}
                {pideArticulos && <span style={tagStyle}>📝 Artículos ({cantArticulos})</span>}
                {pideDirector  && <span style={tagStyle}>📘 Director</span>}
                {!pideLibros && !pideArticulos && !pideDirector && (
                  <span style={{ color: "#64748b", fontSize: 13 }}>Ninguno seleccionado</span>
                )}
              </div>
            </div>

            {/* Detalles libros */}
            {pideLibros && libroDetalles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "#64748b", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Detalles de libros</p>
                {libroDetalles.map(d => (
                  <div key={d.numeroLibro} style={{ background: "#1e293b", padding: 10, borderRadius: 8, marginBottom: 8 }}>
                    <p style={{ color: "white", fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>Libro {d.numeroLibro}</p>
                    <p style={{ color: "#94a3b8", fontSize: 12 }}>Categoría: {d.categoria} · Prioridad: {d.prioridad}</p>
                    <p style={{ color: "#94a3b8", fontSize: 12 }}>
                      {d.isbn && "ISBN ✓"} {d.senapi && "SENAPI ✓"}
                      {!d.isbn && !d.senapi && "Sin ISBN ni SENAPI"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {notasServicio && (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "#64748b", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Notas</p>
                <p style={{ color: "white", fontSize: 13 }}>{notasServicio}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setSuccess(false)} style={{ background: "#334155", border: "none", padding: "12px 24px", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
              ✏️ Editar mis datos
            </button>
            <button onClick={() => window.location.href = "/"} style={{ background: "#3b82f6", border: "none", padding: "12px 24px", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
              🏠 Ir al inicio
            </button>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 20 }}>
            Puedes volver al formulario usando el mismo link antes de que expire.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "40px 20px", color: "white" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#1e293b", padding: 28, borderRadius: 16, marginBottom: 24, borderLeft: "4px solid #3b82f6" }}>
          <h1 style={{ marginBottom: 8, fontSize: 24 }}>📋 Formulario de Registro</h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Complete sus datos para continuar con el proceso editorial.</p>
          <div style={{
            marginTop: 12, display: "inline-block",
            background: daysLeft <= 1 ? "#7f1d1d" : "#1e3a5f",
            padding: "4px 14px", borderRadius: 99, fontSize: 13,
            color: daysLeft <= 1 ? "#fca5a5" : "#60a5fa",
          }}>
            ⏳ Este link expira en {daysLeft} día(s)
          </div>
        </div>

        {saveError && (
          <div style={{ background: "#7f1d1d", padding: 16, borderRadius: 10, marginBottom: 20, color: "#fca5a5", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>
            ⚠️ {saveError}
          </div>
        )}

        {/* ── SECCIÓN: DATOS PERSONALES ───────────────────────────────────── */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>👤 Datos Personales</h3>

          {/* C.I. */}
          <label style={labelStyle}>Cédula de Identidad <Req /></label>
          <input
            placeholder="Ej: 1234567"
            value={ci}
            onChange={e => setCi(e.target.value.replace(/\D/g, ""))}
            style={errors.ci ? inputError : inputStyle}
          />
          {errors.ci && <p style={errorText}>{errors.ci}</p>}

          {/* Nombres */}
          <label style={labelStyle}>Nombres <Req /></label>
          <input
            placeholder="Ej: JUAN CARLOS"
            value={nombres}
            onChange={e => setNombres(soloLetras(e.target.value))}
            style={errors.nombres ? inputError : inputStyle}
          />
          {errors.nombres && <p style={errorText}>{errors.nombres}</p>}

          {/* Apellidos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Apellido Paterno <Req /></label>
              <input
                placeholder="Ej: FERNÁNDEZ"
                value={apellidoPaterno}
                onChange={e => setApellidoPaterno(soloLetras(e.target.value))}
                style={errors.apellidoPaterno ? inputError : inputStyle}
              />
              {errors.apellidoPaterno && <p style={errorText}>{errors.apellidoPaterno}</p>}
            </div>
            <div>
              <label style={labelStyle}>Apellido Materno</label>
              <input
                placeholder="Ej: MAMANI"
                value={apellidoMaterno}
                onChange={e => setApellidoMaterno(soloLetras(e.target.value))}
                style={errors.apellidoMaterno ? inputError : inputStyle}
              />
              {errors.apellidoMaterno && <p style={errorText}>{errors.apellidoMaterno}</p>}
            </div>
          </div>

          {/* Sexo y Ciudad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Sexo <Req /></label>
              <select
                value={sexo}
                onChange={e => setSexo(e.target.value as Sexo)}
                style={errors.sexo ? { ...inputError, cursor: "pointer" } : { ...inputStyle, cursor: "pointer" }}
              >
                <option value="">-- Seleccionar --</option>
                {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.sexo && <p style={errorText}>{errors.sexo}</p>}
            </div>
            <div>
              <label style={labelStyle}>Ciudad <Req /></label>
              <input
                placeholder="Ej: LA PAZ"
                value={ciudad}
                onChange={e => setCiudad(e.target.value.toUpperCase())}
                style={errors.ciudad ? inputError : inputStyle}
              />
              {errors.ciudad && <p style={errorText}>{errors.ciudad}</p>}
            </div>
          </div>

          {/* Dirección */}
          <label style={labelStyle}>Dirección <Req /></label>
          <input
            placeholder="Ej: AVENIDA BOLIVIA NRO 7"
            value={direccion}
            onChange={e => setDireccion(e.target.value.toUpperCase())}
            style={errors.direccion ? inputError : inputStyle}
          />
          {errors.direccion && <p style={errorText}>{errors.direccion}</p>}

          {/* Fecha Nacimiento y Extensión/Departamento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Fecha de Nacimiento <Req /></label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                style={errors.fechaNacimiento ? inputError : inputStyle}
              />
              {errors.fechaNacimiento && <p style={errorText}>{errors.fechaNacimiento}</p>}
            </div>
            <div>
              <label style={labelStyle}>Extensión (Depto. C.I.) <Req /></label>
              <select
                value={extension}
                onChange={e => setExtension(e.target.value as Extension)}
                style={errors.extension ? { ...inputError, cursor: "pointer" } : { ...inputStyle, cursor: "pointer" }}
              >
                <option value="">-- Seleccionar --</option>
                {EXTENSIONES.map(ext => (
                  <option key={ext} value={ext}>{ext}</option>
                ))}
              </select>
              {errors.extension && <p style={errorText}>{errors.extension}</p>}
            </div>
          </div>

          {/* Profesión */}
          <label style={labelStyle}>Profesión <Req /></label>
          <input
            placeholder="Ej: MAESTRO DE MATEMÁTICAS"
            value={profesion}
            onChange={e => setProfesion(soloLetras(e.target.value))}
            style={errors.profesion ? inputError : inputStyle}
          />
          {errors.profesion && <p style={errorText}>{errors.profesion}</p>}

          {/* Celular y Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Celular <Req /></label>
              <input
                placeholder="Ej: 70012345"
                value={celular}
                onChange={e => setCelular(e.target.value.replace(/\D/g, ""))}
                style={errors.celular ? inputError : inputStyle}
              />
              {errors.celular && <p style={errorText}>{errors.celular}</p>}
            </div>
            <div>
              <label style={labelStyle}>Email <Req /></label>
              <input
                placeholder="Ej: juan@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value.toLowerCase())}
                style={errors.email ? inputError : inputStyle}
              />
              {errors.email && <p style={errorText}>{errors.email}</p>}
            </div>
          </div>

          {/* Fotos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {/* Foto personal */}
            <div>
              <label style={labelStyle}>Foto Personal <Req /></label>
              <div style={{
                background: errors.fotografia ? "#450a0a" : "#334155",
                borderRadius: 8, padding: 12, textAlign: "center",
                border: errors.fotografia ? "1px solid #ef4444" : "none",
              }}>
                {fotoPreview
                  ? <img src={fotoPreview} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                  : <div style={{ fontSize: 36, marginBottom: 8 }}>🤳</div>
                }
                <input
                  type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setFotografia(file); setFotoPreview(URL.createObjectURL(file)); }
                  }}
                  style={{ color: "white", fontSize: 11, width: "100%" }}
                />
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Foto de la persona</p>
              </div>
              {errors.fotografia && <p style={errorText}>{errors.fotografia}</p>}
            </div>

            {/* Foto carnet */}
            <div>
              <label style={labelStyle}>Foto del Carnet <Req /></label>
              <div style={{
                background: errors.fotoCarnet ? "#450a0a" : "#334155",
                borderRadius: 8, padding: 12, textAlign: "center",
                border: errors.fotoCarnet ? "1px solid #ef4444" : "none",
              }}>
                {carnetPreview
                  ? <img src={carnetPreview} alt="carnet" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                  : <div style={{ fontSize: 36, marginBottom: 8 }}>🪪</div>
                }
                <input
                  type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setFotoCarnet(file); setCarnetPreview(URL.createObjectURL(file)); }
                  }}
                  style={{ color: "white", fontSize: 11, width: "100%" }}
                />
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Foto del carnet de identidad</p>
              </div>
              {errors.fotoCarnet && <p style={errorText}>{errors.fotoCarnet}</p>}
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: SERVICIOS ───────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>📦 Servicios Solicitados</h3>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Seleccione los servicios que desea contratar.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Libros */}
            <div style={checkCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="checkbox" checked={pideLibros} onChange={e => setPideLibros(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <span style={{ fontSize: 15 }}>📚 Libros</span>
              </div>
              {pideLibros && (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>¿Cuántos libros?</label>
                  <input
                    type="number" min={1} max={10} value={cantLibros}
                    onChange={e => setCantLibros(Number(e.target.value))}
                    style={{ ...inputStyle, width: 100 }}
                  />
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                    {libroDetalles.map(d => (
                      <div key={d.numeroLibro} style={{ background: "#1e293b", padding: 16, borderRadius: 10, borderLeft: "3px solid #3b82f6" }}>
                        <p style={{ color: "#60a5fa", fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>📘 Libro {d.numeroLibro}</p>

                        <label style={labelStyle}>Categoría <Req /></label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          {["A", "B", "C"].map(cat => (
                            <label key={cat} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: d.categoria === cat ? "#1e3a5f" : "#334155",
                              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                              border: d.categoria === cat ? "1px solid #3b82f6" : "1px solid transparent",
                              color: d.categoria === cat ? "#60a5fa" : "white", fontSize: 14, fontWeight: "bold",
                            }}>
                              <input type="radio" name={`categoria_${d.numeroLibro}`} value={cat} checked={d.categoria === cat} onChange={() => updateLibroDetalle(d.numeroLibro, "categoria", cat)} style={{ display: "none" }} />
                              Categoría {cat}
                            </label>
                          ))}
                        </div>
                        {errors[`libro_${d.numeroLibro}_categoria`] && <p style={errorText}>{errors[`libro_${d.numeroLibro}_categoria`]}</p>}

                        <label style={labelStyle}>Registros (opcional)</label>
                        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                          {(["isbn", "senapi"] as const).map(campo => (
                            <label key={campo} style={{
                              display: "flex", alignItems: "center", gap: 8,
                              background: d[campo] ? "#14532d" : "#334155",
                              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                              border: d[campo] ? "1px solid #22c55e" : "1px solid transparent",
                              color: d[campo] ? "#22c55e" : "white", fontSize: 14,
                            }}>
                              <input type="checkbox" checked={d[campo]} onChange={e => updateLibroDetalle(d.numeroLibro, campo, e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                              {campo.toUpperCase()}
                            </label>
                          ))}
                        </div>

                        <label style={labelStyle}>Prioridad <Req /></label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["Alta", "Media"].map(p => (
                            <label key={p} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: d.prioridad === p ? (p === "Alta" ? "#7f1d1d" : "#422006") : "#334155",
                              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                              border: d.prioridad === p ? (p === "Alta" ? "1px solid #ef4444" : "1px solid #f59e0b") : "1px solid transparent",
                              color: d.prioridad === p ? (p === "Alta" ? "#fca5a5" : "#fcd34d") : "white", fontSize: 14, fontWeight: "bold",
                            }}>
                              <input type="radio" name={`prioridad_${d.numeroLibro}`} value={p} checked={d.prioridad === p} onChange={() => updateLibroDetalle(d.numeroLibro, "prioridad", p)} style={{ display: "none" }} />
                              {p === "Alta" ? "🔴" : "🟡"} {p}
                            </label>
                          ))}
                        </div>
                        {errors[`libro_${d.numeroLibro}_prioridad`] && <p style={errorText}>{errors[`libro_${d.numeroLibro}_prioridad`]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Artículos */}
            <div style={checkCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="checkbox" checked={pideArticulos} onChange={e => setPideArticulos(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <span style={{ fontSize: 15 }}>📝 Artículos</span>
              </div>
              {pideArticulos && (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>¿Cuántos artículos?</label>
                  <input type="number" min={1} value={cantArticulos} onChange={e => setCantArticulos(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
                </div>
              )}
            </div>

            {/* Director */}
            <div style={checkCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="checkbox" checked={pideDirector} onChange={e => setPideDirector(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <span style={{ fontSize: 15 }}>📘 Director de Revista</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <label style={{ ...labelStyle, marginTop: 16 }}>Notas adicionales (opcional)</label>
          <textarea
            placeholder="Cualquier información adicional sobre los servicios..."
            value={notasServicio}
            onChange={e => setNotasServicio(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        {/* Botón guardar */}
        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", padding: 16,
            background: saving ? "#334155" : "#3b82f6",
            border: "none", borderRadius: 12, color: "white",
            fontSize: 16, fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          {saving
            ? (subiendoFotos ? "📤 Subiendo fotos..." : <><Spinner /> Guardando...</>)
            : "💾 Guardar mis datos"
          }
        </button>

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 16 }}>
          Puedes editar y guardar tus datos las veces que necesites antes de que expire el link.
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Permite solo letras y espacios, en mayúsculas */
function soloLetras(value: string): string {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").toUpperCase();
}

/** Asterisco de campo requerido */
function Req() {
  return <span style={{ color: "#ef4444" }}>*</span>;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties  = { background: "#1e293b", padding: 24, borderRadius: 14, marginBottom: 20 };
const sectionTitle: React.CSSProperties  = { fontSize: 16, fontWeight: "bold", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #334155" };
const labelStyle: React.CSSProperties    = { display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 };
const inputStyle: React.CSSProperties   = { width: "100%", padding: 10, marginBottom: 4, borderRadius: 8, border: "none", background: "#334155", color: "white", fontSize: 14, boxSizing: "border-box" };
const inputError: React.CSSProperties   = { ...inputStyle, border: "1px solid #ef4444" };
const errorText: React.CSSProperties    = { color: "#ef4444", fontSize: 12, marginBottom: 10, marginTop: 2 };
const checkCard: React.CSSProperties    = { background: "#0f172a", padding: 16, borderRadius: 10, border: "1px solid #334155" };
const tagStyle: React.CSSProperties     = { background: "#1e3a5f", color: "#60a5fa", padding: "4px 14px", borderRadius: 99, fontSize: 13, fontWeight: "bold" };

export default ClientForm;
