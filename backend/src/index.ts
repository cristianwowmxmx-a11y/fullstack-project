import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// Uso de CORS
app.use(cors());

// Permitir JSON
app.use(express.json());

// GET - obtener todas las tareas
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { id: "asc" },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

// POST - crear una tarea
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "El título es obligatorio" });
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: "Error al crear tarea" });
  }
});

// PUT - actualizar una tarea (title y/o completed)
app.put("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, completed } = req.body;

    const dataToUpdate: { title?: string; completed?: boolean } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "El título no puede estar vacío" });
      }
      dataToUpdate.title = title.trim();
    }

    if (completed !== undefined) {
      dataToUpdate.completed = completed;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar tarea" });
  }
});

// DELETE - eliminar una tarea
app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar tarea" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});