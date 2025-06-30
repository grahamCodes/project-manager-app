// src/components/TaskList.js
"use client";

import { useState } from "react";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import styles from "./TaskList.module.css";

export default function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [modalTask, setModalTask] = useState(null);

  // Handler to mark a task as completed (immediately strikes through)
  const handleCheckboxChange = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: "Completed" } : task
      )
    );
  };

  return (
    <>
      {tasks.length === 0 ? (
        <p className={styles.empty}>No Tasks for today</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCheck={() => handleCheckboxChange(task.id)}
              onClick={() => setModalTask(task)}
            />
          ))}
        </div>
      )}

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onUpdate={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setModalTask(updated);
          }}
        />
      )}
    </>
  );
}
