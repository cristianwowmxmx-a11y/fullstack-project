import { useState } from "react";
import type { Task } from "../App";

interface Props {
  tasks: Task[];
  onDelete: (id: number) => void;
  onToggle: (id: number, completed: boolean) => void;
}

function TaskList({ tasks, onDelete, onToggle }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setNewTitle(task.title);
  };

  const handleSave = async (id: number) => {
    if (newTitle.trim() === "") return;

    await fetch(`http://localhost:3000/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
      }),
    });

    setEditingId(null);
    window.location.reload();
  };

  if (tasks.length === 0) {
    return <p className="empty-state">No hay tareas aún. Agrega una nueva.</p>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div className="task-card" key={task.id}>
          <div className="task-info">
            {editingId === task.id ? (
              <input
                className="task-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            ) : (
              <>
                <span
                  className={
                    task.completed
                      ? "task-title completed"
                      : "task-title"
                  }
                >
                  {task.title}
                </span>

                <span
                  className={
                    task.completed
                      ? "task-status done"
                      : "task-status pending"
                  }
                >
                  {task.completed ? "Completada" : "Pendiente"}
                </span>
              </>
            )}
          </div>

          <div className="task-actions">
            {editingId === task.id ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => handleSave(task.id)}
                >
                  Guardar
                </button>

                <button
                  className="btn btn-warning"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  className={
                    task.completed
                      ? "btn btn-warning"
                      : "btn btn-success"
                  }
                  onClick={() =>
                    onToggle(task.id, task.completed)
                  }
                >
                  {task.completed
                    ? "Desmarcar"
                    : "Completar"}
                </button>

                <button
                  className="btn btn-add"
                  onClick={() => handleEdit(task)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-delete"
                  onClick={() => onDelete(task.id)}
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskList;