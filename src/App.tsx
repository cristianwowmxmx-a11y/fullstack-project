import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import "./App.css";

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:3000/tasks");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error al obtener tareas:", errorData);
        return;
      }

      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Error al obtener tareas:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (title: string) => {
    try {
      const res = await fetch("http://localhost:3000/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          completed: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error al crear tarea:", errorData);
        return;
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error al crear tarea:", error);
    }
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete === null) return;

    try {
      const res = await fetch(`http://localhost:3000/tasks/${taskToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error al eliminar tarea:", errorData);
        return;
      }

      setTaskToDelete(null);
      await fetchTasks();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
    }
  };

  const toggleTask = async (id: number, completed: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !completed,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error al actualizar tarea:", errorData);
        return;
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
    }
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="app-background">
      <div className="app-container">
        <Header />

        <TaskInput onAddTask={addTask} />

        <div className="progress-box">
          <div className="progress-header">
            <span>Progreso</span>
            <span>{progress}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="progress-text">
            {completedTasks} de {totalTasks} tareas completadas
          </p>
        </div>

        <TaskList
          tasks={tasks}
          onDelete={(id) => setTaskToDelete(id)}
          onToggle={toggleTask}
        />

        <Footer />
      </div>

      {taskToDelete !== null && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Confirmar eliminación</h2>
            <p>¿Deseas eliminar esta tarea?</p>

            <div className="modal-buttons">
              <button className="btn btn-delete" onClick={confirmDeleteTask}>
                Sí, eliminar
              </button>

              <button
                className="btn btn-warning"
                onClick={() => setTaskToDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;