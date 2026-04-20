interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface Props {
  task: Task;
  onDelete: (id: number) => void;
  onToggle: (id: number, completed: boolean) => void;
}

function TaskCard({ task, onDelete, onToggle }: Props) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <span
        style={{
          textDecoration: task.completed ? "line-through" : "none",
          marginRight: "10px",
        }}
      >
        {task.title}
      </span>

      <button onClick={() => onToggle(task.id, task.completed)}>
        {task.completed ? "Desmarcar" : "Completar"}
      </button>

      <button onClick={() => onDelete(task.id)} style={{ marginLeft: "10px" }}>
        Eliminar
      </button>
    </div>
  );
}

export default TaskCard;