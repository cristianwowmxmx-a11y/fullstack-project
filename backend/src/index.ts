import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import multer from "multer";
import cloudinary from "./cloudinary";
import bcrypt from "bcrypt";
import { enviarCorreo } from "./mailer";
import { enviarWhatsAppCliente } from "./whatsapp";

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

// Middleware de autenticación para clientes
const authCliente = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    if (decoded.role !== "cliente") {
      return res.status(403).json({ error: "Acceso solo para clientes" });
    }
    req.clienteId = decoded.clienteId;
    req.username = decoded.username;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 1. Intentar como admin (tabla User)
  const user = await prisma.user.findUnique({ where: { username } });
  if (user && user.password === password) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: "admin" },
      SECRET,
      { expiresIn: "8h" }
    );
    return res.json({ token, username: user.username, role: "admin" });
  }

  // 2. Intentar como cliente (tabla Client)
  const client = await prisma.client.findFirst({
    where: { clientUsername: username },
  });
  if (client && client.clientPassword) {
    const passwordValida = await bcrypt.compare(password, client.clientPassword);
    if (!passwordValida)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      {
        id: client.id,
        clienteId: client.id,
        username: client.clientUsername,
        role: "cliente",
      },
      SECRET,
      { expiresIn: "8h" }
    );
    return res.json({
      token,
      username: client.clientUsername,
      role: "cliente",
      nombreCompleto: client.nombreCompleto,
    });
  }

  // 3. Ninguno coincide
  return res.status(401).json({ error: "Credenciales incorrectas" });
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

  // ── Generar credenciales automáticas ────────────────────────
  if (!updated.clientUsername || !updated.clientPassword) {
    const nombresArray = (nombres || "").split(" ");
    const apellidoPaternoRaw = (apellidoPaterno || "").toLowerCase();
    const baseUsername = `${nombresArray[0] || ""}.${apellidoPaternoRaw}`.replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let username = baseUsername;
    let counter = 1;
    while (await prisma.client.findFirst({ where: { clientUsername: username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.client.update({
      where: { id: updated.id },
      data: {
        clientUsername: username,
        clientPassword: hashedPassword,
        credencialesGeneradaAt: new Date(),
      },
    });

  const LINK_PORTAL = process.env.CLIENT_PORTAL_URL || "https://tudominio.com/cliente";

console.log("⏰ Programando envío de credenciales en 5 segundos...");
console.log("📧 Datos para envío:", {
  email: email || cliente.email,
  nombreCompleto,
  username,
  password,
  linkPortal: LINK_PORTAL,
  celular: celular || cliente.celular,
});

setTimeout(() => {
  console.log("🚀 Iniciando envío de credenciales...");

  enviarCorreo({
    email: email || cliente.email || "",
    nombreCompleto: nombreCompleto || cliente.nombreCompleto || "",
    username: username,
    password: password,
    linkPortal: LINK_PORTAL,
  })
    .then(() => console.log("✅ Correo enviado correctamente"))
    .catch((err) => console.error("❌ Error al enviar correo:", err));

  enviarWhatsAppCliente(
    celular || cliente.celular || "",
    nombreCompleto || cliente.nombreCompleto || "",
    username,
    password,
    LINK_PORTAL
  )
    .then(() => console.log("✅ WhatsApp enviado correctamente"))
    .catch((err) => console.error("❌ Error al enviar WhatsApp:", err));

}, 5000); // 5 segundos para prueba

    res.json({
      ...updated,
      clientUsername: username,
      clientPassword: password,
    });
    return;
  }

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

  await prisma.magazine.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });
  await prisma.book.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });

  await prisma.libroDetalle.deleteMany({ where: { clienteId: id } });
  await prisma.clienteTask.deleteMany({ where: { clienteId: id } });
  await prisma.entrega.deleteMany({ where: { clienteId: id } });

  await prisma.client.delete({ where: { id } });

  res.json({ ok: true });
});

// ─── CREDENCIALES ─────────────────────────────────────────────────────────────
app.get("/clients/:id/credenciales", auth, async (req, res) => {
  const id = Number(req.params.id);
  const cliente = await prisma.client.findUnique({
    where: { id },
    select: { clientUsername: true },
  });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json({ clientUsername: cliente.clientUsername });
});

app.post("/clients/:id/regenerar-credenciales", auth, async (req, res) => {
  const id = Number(req.params.id);
  const cliente = await prisma.client.findUnique({ where: { id } });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const nombresArray = (cliente.nombres || "").split(" ");
  const apellidoPaternoRaw = (cliente.apellidoPaterno || "").toLowerCase();
  let username = `${nombresArray[0] || ""}.${apellidoPaternoRaw}`
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let counter = 1;
  while (await prisma.client.findFirst({
    where: { clientUsername: username, NOT: { id } },
  })) {
    username = `${username.replace(/\d+$/, "")}${counter}`;
    counter++;
  }

  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.client.update({
    where: { id },
    data: {
      clientUsername: username,
      clientPassword: hashedPassword,
      credencialesGeneradaAt: new Date(),
    },
  });
  // ── Enviar credenciales automáticamente ────────────────────────
  const LINK_PORTAL = process.env.CLIENT_PORTAL_URL || "https://tudominio.com/cliente";
  const nombreCompleto = cliente.nombreCompleto || [cliente.nombres, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(" ") || "Cliente";
  const emailCliente = cliente.email || "";
  const celularCliente = cliente.celular || "";

  console.log("⏰ Programando envío de credenciales en 5 segundos...");
  console.log("📧 Datos para envío:", {
    email: emailCliente,
    nombreCompleto,
    username,
    password,
    linkPortal: LINK_PORTAL,
    celular: celularCliente,
  });

  setTimeout(() => {
    console.log("🚀 Iniciando envío de credenciales...");

    enviarCorreo({
      email: emailCliente,
      nombreCompleto,
      username,
      password,
      linkPortal: LINK_PORTAL,
    })
      .then(() => console.log("✅ Correo enviado correctamente"))
      .catch((err) => console.error("❌ Error al enviar correo:", err));

    enviarWhatsAppCliente(
      celularCliente,
      nombreCompleto,
      username,
      password,
      LINK_PORTAL
    )
      .then(() => console.log("✅ WhatsApp enviado correctamente"))
      .catch((err) => console.error("❌ Error al enviar WhatsApp:", err));
  }, 5000); // 5 segundos para prueba (después cambiar a 10 * 60 * 1000)

  res.json({ clientUsername: username, clientPassword: password });

});

// ─── MENSAJES ─────────────────────────────────────────────────────────────────
app.get("/mensajes", auth, async (req, res) => {
  const clientes = await prisma.client.findMany({
    where: { mensajes: { some: {} } },
    select: {
      id: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombreCompleto: true,
      fotografia: true,
      mensajes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { texto: true, emisor: true, createdAt: true },
      },
      _count: {
        select: { mensajes: { where: { leido: false, emisor: "cliente" } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const resultado = clientes.map((c) => ({
    id: c.id,
    nombre: c.nombreCompleto || [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ") || "Sin nombre",
    fotografia: c.fotografia,
    ultimoMensaje: c.mensajes[0] || null,
    noLeidos: c._count.mensajes,
  }));

  res.json(resultado);
});

app.get("/mensajes/:clienteId", auth, async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const mensajes = await prisma.mensaje.findMany({
    where: { clienteId },
    orderBy: { createdAt: "asc" },
  });
  res.json(mensajes);
});

app.post("/mensajes/:clienteId", auth, async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const { texto } = req.body;
  if (!texto || !texto.trim())
    return res.status(400).json({ error: "El mensaje no puede estar vacío" });

  const mensaje = await prisma.mensaje.create({
    data: {
      clienteId,
      emisor: "admin",
      texto,
      leido: false,
    },
  });
  res.json(mensaje);
});

app.put("/mensajes/:clienteId/leidos", auth, async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  await prisma.mensaje.updateMany({
    where: { clienteId, emisor: "cliente", leido: false },
    data: { leido: true },
  });
  res.json({ ok: true });
});

// ─── ARCHIVOS DEL CLIENTE ─────────────────────────────────────────────────────
app.get("/clients/:id/archivos", auth, async (req, res) => {
  const clienteId = Number(req.params.id);
  const cliente = await prisma.client.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const archivos = await prisma.clienteArchivo.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
  });
  res.json(archivos);
});

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────
app.get("/cliente/me", authCliente, async (req: any, res) => {
  const cliente = await prisma.client.findUnique({
    where: { id: req.clienteId },
    select: {
      id: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      sexo: true,
      ciudad: true,
      ci: true,
      direccion: true,
      fechaNacimiento: true,
      extension: true,
      profesion: true,
      celular: true,
      email: true,
      fotografia: true,
      fotoCarnet: true,
      clientUsername: true,
      credencialesGeneradaAt: true,
      status: true,
    },
  });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json(cliente);
});

app.get("/cliente/progreso", authCliente, async (req: any, res) => {
  const cliente = await prisma.client.findUnique({
    where: { id: req.clienteId },
    select: {
      pideLibros: true,
      cantLibros: true,
      librosHechos: true,
      pideArticulos: true,
      cantArticulos: true,
      articulosHechos: true,
      pideDirector: true,
      edicionesHechas: true,
      pideFundador: true,
    },
  });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json(cliente);
});

app.get("/cliente/entregas", authCliente, async (req: any, res) => {
  const entregas = await prisma.entrega.findMany({
    where: { clienteId: req.clienteId },
    orderBy: { createdAt: "desc" },
    include: { cliente: { select: { nombreCompleto: true } } },
  });
  res.json(entregas);
});

app.get("/cliente/mensajes", authCliente, async (req: any, res) => {
  const mensajes = await prisma.mensaje.findMany({
    where: { clienteId: req.clienteId },
    orderBy: { createdAt: "asc" },
  });
  res.json(mensajes);
});

app.post("/cliente/mensajes", authCliente, async (req: any, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim())
    return res.status(400).json({ error: "El mensaje no puede estar vacío" });

  const mensaje = await prisma.mensaje.create({
    data: {
      clienteId: req.clienteId,
      emisor: "cliente",
      texto,
      leido: false,
    },
  });

  try {
    const { notificarAdminMensaje } = await import("./whatsapp");
    const cliente = await prisma.client.findUnique({
      where: { id: req.clienteId },
      select: { nombreCompleto: true, nombres: true, apellidoPaterno: true },
    });
    const nombre =
      cliente?.nombreCompleto ||
      [cliente?.nombres, cliente?.apellidoPaterno].filter(Boolean).join(" ") ||
      "Cliente";
    await notificarAdminMensaje(nombre);
  } catch (err) {
    console.warn("No se pudo notificar por WhatsApp:", err);
  }

  res.json(mensaje);
});

app.put("/cliente/password", authCliente, async (req: any, res) => {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva)
    return res.status(400).json({ error: "Ambos campos son requeridos" });

  const cliente = await prisma.client.findUnique({
    where: { id: req.clienteId },
    select: { clientPassword: true },
  });
  if (!cliente || !cliente.clientPassword)
    return res.status(400).json({ error: "No tienes contraseña configurada" });

  const valida = await bcrypt.compare(passwordActual, cliente.clientPassword);
  if (!valida) return res.status(401).json({ error: "Contraseña actual incorrecta" });

  const hashedPassword = await bcrypt.hash(passwordNueva, 10);
  await prisma.client.update({
    where: { id: req.clienteId },
    data: { clientPassword: hashedPassword },
  });

  res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
});

app.put("/cliente/datos", authCliente, async (req: any, res) => {
  const cliente = await prisma.client.findUnique({
    where: { id: req.clienteId },
    select: { credencialesGeneradaAt: true },
  });
  if (!cliente || !cliente.credencialesGeneradaAt)
    return res.status(400).json({ error: "No tienes permiso para editar datos" });

  const ahora = new Date();
  const limite = new Date(cliente.credencialesGeneradaAt.getTime() + 10 * 60 * 60 * 1000);
  if (ahora > limite) {
    return res.status(403).json({
      error: "El tiempo de edición ha vencido. Contacta al administrador.",
    });
  }

  const {
    nombres, apellidoPaterno, apellidoMaterno, sexo, ciudad,
    direccion, fechaNacimiento, profesion, celular, email,
  } = req.body;

  const updated = await prisma.client.update({
    where: { id: req.clienteId },
    data: {
      ...(nombres && { nombres }),
      ...(apellidoPaterno && { apellidoPaterno }),
      ...(apellidoMaterno !== undefined && { apellidoMaterno }),
      ...(sexo && { sexo }),
      ...(ciudad && { ciudad }),
      ...(direccion && { direccion }),
      ...(fechaNacimiento && { fechaNacimiento }),
      ...(profesion && { profesion }),
      ...(celular && { celular }),
      ...(email && { email }),
    },
  });

  res.json(updated);
});

app.post("/cliente/archivos/libro/:libroId", authCliente, upload.single("archivo"), async (req: any, res) => {
  const libroId = Number(req.params.libroId);
  const { titulo, notas } = req.body;

  const archivoUrl = req.file
    ? await subirImagen(req.file.buffer, "clientes/libros", "auto", req.file.originalname.split(".").pop())
    : null;

  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId: req.clienteId,
      tipo: "libro",
      referenciaId: libroId,
      titulo: titulo || null,
      notas: notas || null,
      archivoUrl,
    },
  });
  res.json(archivo);
});

app.post("/cliente/archivos/articulo/:articuloId", authCliente, upload.single("archivo"), async (req: any, res) => {
  const articuloId = Number(req.params.articuloId);
  const { titulo, notas } = req.body;

  const archivoUrl = req.file
    ? await subirImagen(req.file.buffer, "clientes/articulos", "auto", req.file.originalname.split(".").pop())
    : null;

  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId: req.clienteId,
      tipo: "articulo",
      referenciaId: articuloId,
      titulo: titulo || null,
      notas: notas || null,
      archivoUrl,
    },
  });
  res.json(archivo);
});

app.post("/cliente/archivos/director", authCliente, upload.single("archivo"), async (req: any, res) => {
  const { titulo, notas } = req.body;

  const archivoUrl = req.file
    ? await subirImagen(req.file.buffer, "clientes/director", "auto", req.file.originalname.split(".").pop())
    : null;

  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId: req.clienteId,
      tipo: "director",
      titulo: titulo || null,
      notas: notas || null,
      archivoUrl,
    },
  });
  res.json(archivo);
});

app.post("/cliente/archivos/fundador/:articuloId", authCliente, upload.single("archivo"), async (req: any, res) => {
  const articuloId = Number(req.params.articuloId);
  const { titulo, notas } = req.body;

  const archivoUrl = req.file
    ? await subirImagen(req.file.buffer, "clientes/fundador", "auto", req.file.originalname.split(".").pop())
    : null;

  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId: req.clienteId,
      tipo: "fundador",
      referenciaId: articuloId,
      titulo: titulo || null,
      notas: notas || null,
      archivoUrl,
    },
  });
  res.json(archivo);
});

app.get("/cliente/archivos", authCliente, async (req: any, res) => {
  const archivos = await prisma.clienteArchivo.findMany({
    where: { clienteId: req.clienteId },
    orderBy: { createdAt: "desc" },
  });
  res.json(archivos);
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