// src/components/TaskModal.js
"use client";

import { useState } from "react";
import styles from "./TaskModal.module.css";

export default function TaskModal({ task, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: task.name,
    description: task.description || "",
    status: task.status,
    due_date: task.due_date.split("T")[0], // YYYY-MM-DD
    is_recurring: task.is_recurring,
    repeat_days: task.repeat_days || "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          status: form.status,
          due_date: form.due_date,
          is_recurring: form.is_recurring,
          repeat_days: form.is_recurring ? Number(form.repeat_days) : null,
          priority: task.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      onUpdate({ ...task, ...form, repeat_days: form.repeat_days });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Edit Task</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <label htmlFor="due_date">Due Date</label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            value={form.due_date}
            onChange={handleChange}
            required
          />

          <div className={styles.checkboxGroup}>
            <input
              id="is_recurring"
              name="is_recurring"
              type="checkbox"
              checked={form.is_recurring}
              onChange={handleChange}
            />
            <label htmlFor="is_recurring">Recurring</label>
          </div>

          {form.is_recurring && (
            <>
              <label htmlFor="repeat_days">Repeat every (days)</label>
              <input
                id="repeat_days"
                name="repeat_days"
                type="number"
                value={form.repeat_days}
                onChange={handleChange}
                required
              />
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.save}>
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
