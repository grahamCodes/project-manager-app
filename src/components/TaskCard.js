// src/components/TaskCard.js
"use client";

import styles from "./TaskCard.module.css";

export default function TaskCard({ task, onCheck, onClick }) {
  const complete = task.status === "Complete";
  return (
    <div
      className={`${styles.card} ${complete ? styles.complete : ""}`}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${task.project.color}` }}
    >
      <input
        type="checkbox"
        checked={complete}
        onChange={() => onCheck(task.id)}
        onClick={(e) => e.stopPropagation()}
        className={styles.checkbox}
      />
      <div className={styles.content}>
        <h2 className={styles.name}>{task.name}</h2>
        <p className={styles.meta}>
          <span className={styles.project}>{task.project.name}</span>
          <span className={styles.due}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </span>
        </p>
      </div>
    </div>
  );
}
