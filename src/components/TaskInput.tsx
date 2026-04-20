import { useState } from "react";

interface Props {
  onAddTask: (title: string) => void;
}

function TaskInput({ onAddTask }: Props) {
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (title.trim() === "") return;
    onAddTask(title);
    setTitle("");
  };

  return (
    <div className="task-input-container">
      <input
        className="task-input"
        type="text"
        placeholder="Escribe una tarea..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <button className="btn btn-add" onClick={handleAdd}>
        Agregar
      </button>
    </div>
  );
}

export default TaskInput;