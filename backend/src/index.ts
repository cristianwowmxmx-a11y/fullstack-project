import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import multer from "multer";
import cloudinary from "./cloudinary";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "secret123";

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const subirImagen = (
  buffer: Buffer,
  carpeta: string,
  tipo: "image" | "raw" | "auto" = "image",
  ext?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: carpeta, resource_type: tipo, format: ext },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
};

// Middleware de autenticación
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password)
    return res.status(401).json({ error: "Credenciales incorrectas" });
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: "8h",
  });
  res.json({ token, username: user.username });
});

// ─── NOTES ────────────────────────────────────────────────────────────────────
app.get("/notes", auth, async (req, res) => {
  const userId = (req as any).user.id;
  res.json(await prisma.note.findMany({ where: { userId } }));
});
app.post("/notes", auth, async (req, res) => {
  const userId = (req as any).user.id;
  const { text } = req.body;
  res.json(await prisma.note.create({ data: { text, userId } }));
});
app.delete("/notes/:id", auth, async (req, res) => {
  await prisma.note.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── TASKS ────────────────────────────────────────────────────────────────────
app.get("/tasks", auth, async (req, res) => {
  res.json(await prisma.task.findMany({ orderBy: { createdAt: "desc" } }));
});
app.post("/tasks", auth, async (req, res) => {
  res.json(await prisma.task.create({ data: { title: req.body.title } }));
});
app.put("/tasks/:id", auth, async (req, res) => {
  const { completed, title } = req.body;
  res.json(
    await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title !== undefined && { title }),
      },
    })
  );
});
app.delete("/tasks/:id", auth, async (req, res) => {
  await prisma.task.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── CLIENTE TASKS ────────────────────────────────────────────────────────────
app.get("/cliente-tasks", auth, async (req, res) => {
  res.json(
    await prisma.clienteTask.findMany({
      orderBy: { createdAt: "desc" },
      include: { cliente: true },
    })
  );
});
app.put("/cliente-tasks/:id", auth, async (req, res) => {
  res.json(
    await prisma.clienteTask.update({
      where: { id: Number(req.params.id) },
      data: { completada: req.body.completada },
      include: { cliente: true },
    })
  );
});
app.delete("/cliente-tasks/:id", auth, async (req, res) => {
  await prisma.clienteTask.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ ok: true });
});

// ─── PERSONS ──────────────────────────────────────────────────────────────────
app.get("/persons", auth, async (req, res) => {
  res.json(await prisma.person.findMany());
});
app.post("/persons", auth, async (req, res) => {
  const { name, email } = req.body;
  res.json(await prisma.person.create({ data: { name, email } }));
});
app.delete("/persons/:id", auth, async (req, res) => {
  await prisma.person.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── MAGAZINES ────────────────────────────────────────────────────────────────
app.get("/magazines", async (req, res) => {
  res.json(
    await prisma.magazine.findMany({
      include: { director: true, articles: { include: { authors: true } }, cliente: true },
    })
  );
});
app.get("/magazines/:id", auth, async (req, res) => {
  res.json(
    await prisma.magazine.findUnique({
      where: { id: Number(req.params.id) },
      include: { director: true, articles: { include: { authors: true } }, cliente: true },
    })
  );
});
app.post("/magazines", auth, async (req, res) => {
  const { title, directorId, notas, clienteId } = req.body;
  res.json(
    await prisma.magazine.create({
      data: {
        title,
        directorId,
        notas: notas || null,
        clienteId: clienteId ? Number(clienteId) : null,
      },
      include: { director: true, cliente: true },
    })
  );
});
app.post("/magazines/:id/archivo", auth, upload.single("archivo"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
    const ext = req.file.originalname.split(".").pop();
    const url = await subirImagen(req.file.buffer, "revistas", "auto", ext);
    const updated = await prisma.magazine.update({
      where: { id: Number(req.params.id) },
      data: { archivoUrl: url },
      include: { director: true, cliente: true, articles: { include: { authors: true } } },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir archivo" });
  }
});
app.put("/magazines/:id", auth, async (req, res) => {
  const { title, directorName, notas, clienteId } = req.body;
  let director = await prisma.person.findFirst({ where: { name: directorName } });
  if (!director) director = await prisma.person.create({ data: { name: directorName } });
  res.json(
    await prisma.magazine.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        directorId: director.id,
        notas: notas !== undefined ? notas : undefined,
        clienteId: clienteId !== undefined ? (clienteId ? Number(clienteId) : null) : undefined,
      },
      include: { director: true, cliente: true },
    })
  );
});
app.delete("/magazines/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.article.deleteMany({ where: { magazineId: id } });
  await prisma.magazine.delete({ where: { id } });
  res.json({ ok: true });
});

// ─── ARTICLES ─────────────────────────────────────────────────────────────────
app.get("/articles", auth, async (req, res) => {
  res.json(await prisma.article.findMany({ include: { authors: true, magazine: true } }));
});
app.post("/articles", auth, async (req, res) => {
  const { title, authorIds, magazineId, authorName } = req.body;
  let ids = authorIds || [];
  if (authorName && ids.length === 0) {
    let person = await prisma.person.findFirst({ where: { name: authorName } });
    if (!person) person = await prisma.person.create({ data: { name: authorName } });
    ids = [person.id];
  }
  res.json(
    await prisma.article.create({
      data: {
        title,
        magazineId: Number(magazineId),
        authors: { connect: ids.map((id: number) => ({ id })) },
      },
      include: { authors: true, magazine: true },
    })
  );
});
app.put("/articles/:id", auth, async (req, res) => {
  const { title, authorName } = req.body;
  let person = await prisma.person.findFirst({ where: { name: authorName } });
  if (!person) person = await prisma.person.create({ data: { name: authorName } });
  res.json(
    await prisma.article.update({
      where: { id: Number(req.params.id) },
      data: { title, authors: { set: [{ id: person.id }] } },
      include: { authors: true, magazine: true },
    })
  );
});
app.delete("/articles/:id", auth, async (req, res) => {
  await prisma.article.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── BOOKS ────────────────────────────────────────────────────────────────────
app.get("/books", async (req, res) => {
  res.json(await prisma.book.findMany({ include: { author: true, cliente: true } }));
});
app.post("/books", auth, async (req, res) => {
  const { title, authorName, notas, clienteId } = req.body;
  let author = await prisma.person.findFirst({ where: { name: authorName } });
  if (!author) author = await prisma.person.create({ data: { name: authorName } });
  res.json(
    await prisma.book.create({
      data: {
        title,
        authorId: author.id,
        notas: notas || null,
        clienteId: clienteId ? Number(clienteId) : null,
      },
      include: { author: true, cliente: true },
    })
  );
});
app.post("/books/:id/archivo", auth, upload.single("archivo"), async (req: any, res: any) => {
  const ext = req.file.originalname.split(".").pop();
  const url = await subirImagen(req.file.buffer, "libros", "auto", ext);
  res.json(
    await prisma.book.update({
      where: { id: Number(req.params.id) },
      data: { archivoUrl: url },
      include: { author: true, cliente: true },
    })
  );
});
app.put("/books/:id", auth, async (req, res) => {
  const { title, authorName, notas, clienteId } = req.body;
  let author = await prisma.person.findFirst({ where: { name: authorName } });
  if (!author) author = await prisma.person.create({ data: { name: authorName } });
  res.json(
    await prisma.book.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        authorId: author.id,
        notas: notas !== undefined ? notas : undefined,
        clienteId: clienteId !== undefined ? (clienteId ? Number(clienteId) : null) : undefined,
      },
      include: { author: true, cliente: true },
    })
  );
});
app.delete("/books/:id", auth, async (req, res) => {
  await prisma.book.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
app.get("/projects", async (req, res) => {
  res.json(await prisma.project.findMany());
});
app.post("/projects", auth, async (req, res) => {
  const { title, description, imageUrl } = req.body;
  res.json(await prisma.project.create({ data: { title, description, imageUrl } }));
});
app.delete("/projects/:id", auth, async (req, res) => {
  await prisma.project.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
app.get("/clients", auth, async (req, res) => {
  res.json(await prisma.client.findMany({ orderBy: { createdAt: "desc" } }));
});

app.get("/clients/form/:token", async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { token: req.params.token },
  });
  if (!client) return res.status(404).json({ error: "Link no válido" });
  if (new Date() > client.expiresAt) return res.status(410).json({ error: "Este link ha expirado" });
  res.json(client);
});

app.post("/clients", auth, async (req, res) => {
  const token =
    Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 4);
  res.json(
    await prisma.client.create({
      data: { token, expiresAt, nombreCompleto: req.body.nombreCompleto || null },
    })
  );
});

// Subida de fotos (sin autenticación)
app.post(
  "/clients/form/:token/fotos",
  upload.fields([
    { name: "fotografia", maxCount: 1 },
    { name: "fotoCarnet", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    const client = await prisma.client.findUnique({
      where: { token: req.params.token },
    });
    if (!client) return res.status(404).json({ error: "Link no válido" });
    if (new Date() > client.expiresAt) return res.status(410).json({ error: "Link expirado" });

    const files = req.files as Record<string, Express.Multer.File[]>;
    const data: any = {};

    if (files?.fotografia?.[0]) {
      data.fotografia = await subirImagen(files.fotografia[0].buffer, "clientes/fotografias");
    }
    if (files?.fotoCarnet?.[0]) {
      data.fotoCarnet = await subirImagen(files.fotoCarnet[0].buffer, "clientes/carnets");
    }

    const updated = await prisma.client.update({
      where: { token: req.params.token },
      data,
    });
    res.json(updated);
  }
);

// ─── ACTUALIZACIÓN DEL FORMULARIO DEL CLIENTE ────────────────────────────────
app.put("/clients/form/:token", async (req, res) => {
  const client = await prisma.client.findUnique({ where: { token: req.params.token } });
  if (!client) return res.status(404).json({ error: "Link no válido" });
  if (new Date() > client.expiresAt) return res.status(410).json({ error: "Este link ha expirado" });

  const {
    ci, nombres, apellidoPaterno, apellidoMaterno, sexo, ciudad,
    nombreCompleto, direccion, fechaNacimiento, extension,
    profesion, celular, email, pideLibros, cantLibros,
    pideArticulos, cantArticulos, pideDirector, pideFundador, notasServicio,
  } = req.body;

  const updated = await prisma.client.update({
    where: { token: req.params.token },
    data: {
      ci, nombres, apellidoPaterno, apellidoMaterno, sexo, ciudad,
      nombreCompleto, direccion, fechaNacimiento, extension,
      profesion, celular, email,
      pideLibros,
      cantLibros: pideLibros ? cantLibros : 0,
      pideArticulos,
      cantArticulos: pideArticulos ? cantArticulos : 0,
      pideDirector, pideFundador, notasServicio,
      status: "formulario llenado",
    },
  });

  // ── Recrear tareas y entrega ──────────────────────────────
  await prisma.clienteTask.deleteMany({ where: { clienteId: updated.id } });
  await prisma.entrega.deleteMany({ where: { clienteId: updated.id } });

  const tareas: any[] = [];

  if (pideDirector) {
    for (let i = 1; i <= 3; i++) {
      tareas.push({
        tipo: "edicion_revista",
        descripcion: `Edición ${i} de revista — ${nombreCompleto} (1 artículo)`,
        clienteId: updated.id,
      });
    }
    const articulosRestantes = (cantArticulos || 0) - 3;
    if (pideArticulos && articulosRestantes > 0) {
      for (let i = 1; i <= articulosRestantes; i++) {
        tareas.push({
          tipo: "articulo",
          descripcion: `Artículo extra ${i} — ${nombreCompleto} (otra revista)`,
          clienteId: updated.id,
        });
      }
    }
  } else if (pideArticulos && cantArticulos > 0) {
    for (let i = 1; i <= cantArticulos; i++) {
      tareas.push({
        tipo: "articulo",
        descripcion: `Artículo ${i} — ${nombreCompleto}`,
        clienteId: updated.id,
      });
    }
  }

  if (pideLibros && cantLibros > 0) {
    for (let i = 1; i <= cantLibros; i++) {
      tareas.push({
        tipo: "libro",
        descripcion: `Libro ${i} — ${nombreCompleto}`,
        clienteId: updated.id,
      });
    }
  }

  if (tareas.length > 0) await prisma.clienteTask.createMany({ data: tareas });
  await prisma.entrega.create({ data: { estado: "pendiente", clienteId: updated.id } });

  res.json(updated);
});

app.put("/clients/:id", auth, async (req, res) => {
  res.json(
    await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status },
    })
  );
});

app.put("/clients/:id/progreso", auth, async (req, res) => {
  const { librosHechos, articulosHechos, edicionesHechas } = req.body;
  res.json(
    await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(librosHechos !== undefined && { librosHechos }),
        ...(articulosHechos !== undefined && { articulosHechos }),
        ...(edicionesHechas !== undefined && { edicionesHechas }),
      },
    })
  );
});

app.put("/clients/:id/regenerar", auth, async (req, res) => {
  const token =
    Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 4);
  res.json(
    await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { token, expiresAt },
    })
  );
});

// ✅ RUTA DE ELIMINACIÓN CORREGIDA
app.delete("/clients/:id", auth, async (req, res) => {
  const id = Number(req.params.id);

  // 1. Desvincula revistas y libros (sin borrarlos)
  await prisma.magazine.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });
  await prisma.book.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });

  // 2. Elimina dependencias directas
  await prisma.libroDetalle.deleteMany({ where: { clienteId: id } });
  await prisma.clienteTask.deleteMany({ where: { clienteId: id } });
  await prisma.entrega.deleteMany({ where: { clienteId: id } });

  // 3. Ahora sí borra el cliente
  await prisma.client.delete({ where: { id } });

  res.json({ ok: true });
});

// ─── ENTREGAS ─────────────────────────────────────────────────────────────────
app.get("/entregas", auth, async (req, res) => {
  res.json(
    await prisma.entrega.findMany({
      orderBy: { createdAt: "desc" },
      include: { cliente: { include: { clienteTasks: true } } },
    })
  );
});
app.put("/entregas/:id", auth, async (req, res) => {
  const { estado } = req.body;
  res.json(
    await prisma.entrega.update({
      where: { id: Number(req.params.id) },
      data: {
        estado,
        fechaEntrega: estado === "entregado" ? new Date() : null,
      },
      include: { cliente: { include: { clienteTasks: true } } },
    })
  );
});
app.delete("/entregas/:id", auth, async (req, res) => {
  await prisma.entrega.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────
app.get("/search", auth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ magazines: [], books: [] });
  const [magazines, books] = await Promise.all([
    prisma.magazine.findMany({
      where: {
        OR: [
          { director: { name: { contains: q, mode: "insensitive" } } },
          { articles: { some: { authors: { some: { name: { contains: q, mode: "insensitive" } } } } } },
        ],
      },
      include: { director: true, articles: { include: { authors: true } } },
    }),
    prisma.book.findMany({
      where: { author: { name: { contains: q, mode: "insensitive" } } },
      include: { author: true },
    }),
  ]);
  res.json({ magazines, books });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get("/stats", auth, async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    clientesTotal,
    clientesPendientes,
    clientesFormularioLlenado,
    clientesEnProceso,
    clientesProcesados,
    entregasTotal,
    entregasPendientes,
    entregasEntregadas,
    tareasTotal,
    tareasPendientes,
    tareasCompletadas,
    clienteTareasTotal,
    clienteTareasPendientes,
    clienteTareasCompletadas,
    revistasTotal,
    librosTotal,
  ] = await Promise.all([
    prisma.client.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.client.count({ where: { status: "pendiente", createdAt: { gte: start, lte: end } } }),
    prisma.client.count({ where: { status: "formulario llenado", createdAt: { gte: start, lte: end } } }),
    prisma.client.count({ where: { status: "en proceso", createdAt: { gte: start, lte: end } } }),
    prisma.client.count({ where: { status: "procesado", createdAt: { gte: start, lte: end } } }),
    prisma.entrega.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.entrega.count({ where: { estado: "pendiente", createdAt: { gte: start, lte: end } } }),
    prisma.entrega.count({ where: { estado: "entregado", createdAt: { gte: start, lte: end } } }),
    prisma.task.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.task.count({ where: { completed: false, createdAt: { gte: start, lte: end } } }),
    prisma.task.count({ where: { completed: true, createdAt: { gte: start, lte: end } } }),
    prisma.clienteTask.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.clienteTask.count({ where: { completada: false, createdAt: { gte: start, lte: end } } }),
    prisma.clienteTask.count({ where: { completada: true, createdAt: { gte: start, lte: end } } }),
    prisma.magazine.count(),
    prisma.book.count(),
  ]);

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  res.json({
    mesActual: `${meses[now.getMonth()]} ${now.getFullYear()}`,
    clientes: {
      total: clientesTotal,
      pendientes: clientesPendientes,
      formularioLlenado: clientesFormularioLlenado,
      enProceso: clientesEnProceso,
      procesados: clientesProcesados,
    },
    entregas: {
      total: entregasTotal,
      pendientes: entregasPendientes,
      entregadas: entregasEntregadas,
    },
    tareas: {
      manuales: {
        total: tareasTotal,
        pendientes: tareasPendientes,
        completadas: tareasCompletadas,
      },
      clientes: {
        total: clienteTareasTotal,
        pendientes: clienteTareasPendientes,
        completadas: clienteTareasCompletadas,
      },
    },
    revistas: revistasTotal,
    libros: librosTotal,
  });
});

// ─── DAY NOTES ────────────────────────────────────────────────────────────────
app.get("/day-notes", auth, async (req, res) => {
  const userId = (req as any).user.id;
  res.json(await prisma.dayNote.findMany({ where: { userId }, orderBy: { fecha: "asc" } }));
});
app.post("/day-notes", auth, async (req, res) => {
  const userId = (req as any).user.id;
  const { text, fecha } = req.body;
  res.json(await prisma.dayNote.create({ data: { text, fecha, userId } }));
});
app.delete("/day-notes/:id", auth, async (req, res) => {
  await prisma.dayNote.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// ─── LIBRO DETALLES ───────────────────────────────────────────────────────────
app.get("/clients/:id/libro-detalles", auth, async (req, res) => {
  res.json(
    await prisma.libroDetalle.findMany({
      where: { clienteId: Number(req.params.id) },
      orderBy: { numeroLibro: "asc" },
    })
  );
});

app.post("/clients/form/:token/libro-detalles", async (req, res) => {
  const client = await prisma.client.findUnique({ where: { token: req.params.token } });
  if (!client) return res.status(404).json({ error: "Link no válido" });
  if (new Date() > client.expiresAt) return res.status(410).json({ error: "Link expirado" });

  const { detalles } = req.body;
  await prisma.libroDetalle.deleteMany({ where: { clienteId: client.id } });

  if (detalles && detalles.length > 0) {
    await prisma.libroDetalle.createMany({
      data: detalles.map((d: any) => ({
        clienteId: client.id,
        numeroLibro: d.numeroLibro,
        categoria: d.categoria,
        isbn: d.isbn,
        senapi: d.senapi,
        prioridad: d.prioridad,
      })),
    });
  }
  res.json({ ok: true });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));