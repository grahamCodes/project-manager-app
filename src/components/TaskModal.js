// src/components/TaskModal.js
"use client";

import { useState, useEffect } from "react";
import styles from "./TaskModal.module.css";

export default function TaskModal({ task, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "In Progress",
    due_date: "",
    is_recurring: false,
    repeat_days: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize form values from task prop
  useEffect(() => {
    if (task) {
      // Ensure due_date is in 'YYYY-MM-DD' format
      let dueDateValue = "";
      try {
        const dateObj = new Date(task.due_date);
        if (!isNaN(dateObj)) {
          dueDateValue = dateObj.toISOString().slice(0, 10);
        }
      } catch {
        dueDateValue = "";
      }

      setForm({
        name: task.name,
        description: task.description || "",
        status: task.status,
        due_date: dueDateValue,
        is_recurring: Boolean(task.is_recurring),
        repeat_days: task.repeat_days != null ? String(task.repeat_days) : "",
      });
    }
  }, [task]);

  if (!task) return null;

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
      const payload = {
        name: form.name,
        description: form.description,
        status: form.status,
        due_date: form.due_date,
        is_recurring: form.is_recurring,
        repeat_days: form.is_recurring ? Number(form.repeat_days) : null,
        priority: task.priority,
      };

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      onUpdate(data);
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
            required
          >
            {/* <option>Not Started</option> */}
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Complete</option>
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
                min={1}
                value={form.repeat_days}
                onChange={handleChange}
                required
              />
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancel}
              disabled={loading}
            >
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
