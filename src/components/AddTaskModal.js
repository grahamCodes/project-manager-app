// src/components/AddTaskModal.js
"use client";

import { useState, useEffect } from "react";
import styles from "./AddTaskModal.module.css";

const FREQUENCIES = [
  { value: "", label: "None" },
  { value: "DAILY", label: "Every Day" },
  { value: "WEEKLY", label: "Every Week" },
  { value: "MONTHLY", label: "Every Month" },
  // { value: "CUSTOM", label: "Custom…" },
];

export default function AddTaskModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  initialData = null,
  projectId = null,
  projects = [],
}) {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState({
    project_id: projectId || "",
    name: "",
    description: "",
    due_date: "",
    status: "In Progress",
    priority: 0,
    recurrence: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        project_id: initialData.project_id,
        name: initialData.name,
        description: initialData.description || "",
        due_date: new Date(initialData.due_date).toISOString().slice(0, 10),
        status: initialData.status,
        priority: initialData.priority,
        recurrence: initialData.recurrence
          ? {
              frequency: initialData.recurrence.frequency,
              interval: initialData.recurrence.interval,
              by_weekday: initialData.recurrence.by_weekday,
              by_monthday: initialData.recurrence.by_monthday,
              ends_at: initialData.recurrence.ends_at,
            }
          : null,
      });
    }
  }, [initialData, isEdit]);

  useEffect(() => {
    if (!isEdit && !projectId && projects.length) {
      setForm((f) => ({ ...f, project_id: projects[0].id }));
    }
  }, [projects, projectId, isEdit]);

  if (!isOpen) return null;

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleRecurrenceField = (update) => {
    setForm((f) => ({
      ...f,
      recurrence: {
        ...(f.recurrence || { interval: 1, by_weekday: [], by_monthday: [] }),
        ...update,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/tasks/${initialData.id}` : "/api/tasks";
    const method = isEdit ? "PUT" : "POST";
    const payload = {
      project_id: form.project_id,
      name: form.name,
      description: form.description || null,
      due_date: form.due_date,
      status: form.status,
      priority: form.priority,
      recurrence: form.recurrence,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save task");
      isEdit ? onUpdate(data) : onCreate(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const freq = form.recurrence?.frequency ?? "";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{isEdit ? "Edit Task" : "Add Task"}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {!projectId && (
            <label>
              Project
              <select
                name="project_id"
                value={form.project_id}
                onChange={handleField}
                required
              >
                {projects.length ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No projects available
                  </option>
                )}
              </select>
            </label>
          )}

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleField}
              required
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleField}
            />
          </label>
          <label>
            Due Date
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleField}
              required
            />
          </label>
          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleField}
              required
            >
              <option>In Progress</option>
              <option>Blocked</option>
              <option>Complete</option>
            </select>
          </label>

          <label>
            Repeat
            <select
              value={freq}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setForm((f) => ({ ...f, recurrence: null }));
                  return;
                }
                if (v === "DAILY") {
                  handleRecurrenceField({
                    frequency: v,
                    interval: 1,
                    by_weekday: [],
                    by_monthday: [],
                  });
                } else if (v === "WEEKLY") {
                  const today = new Date().getDay();
                  handleRecurrenceField({
                    frequency: v,
                    interval: 1,
                    by_weekday: [today],
                    by_monthday: [],
                  });
                } else if (v === "MONTHLY") {
                  const date = new Date().getDate();
                  handleRecurrenceField({
                    frequency: v,
                    interval: 1,
                    by_weekday: [],
                    by_monthday: [date],
                  });
                }
                // else {
                //   handleRecurrenceField({
                //     frequency: "CUSTOM",
                //     interval: 1,
                //     by_weekday: [],
                //     by_monthday: [],
                //   });
                // }
              }}
            >
              {FREQUENCIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {freq === "CUSTOM" && (
            <>
              <label>
                Every{" "}
                <input
                  type="number"
                  min={1}
                  value={form.recurrence.interval}
                  onChange={(e) =>
                    handleRecurrenceField({
                      interval: Number(e.target.value) || 1,
                    })
                  }
                />{" "}
                {form.recurrence.frequency === "WEEKLY"
                  ? "week(s) on"
                  : form.recurrence.frequency === "MONTHLY"
                  ? "month(s) on"
                  : "day(s)"}
              </label>

              {form.recurrence.frequency === "WEEKLY" && (
                <div className={styles.weekdays}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <button
                      type="button"
                      key={i}
                      className={
                        form.recurrence.by_weekday.includes(i)
                          ? styles.selected
                          : ""
                      }
                      onClick={() => {
                        const arr = [...form.recurrence.by_weekday];
                        const idx = arr.indexOf(i);
                        if (idx >= 0) arr.splice(idx, 1);
                        else arr.push(i);
                        handleRecurrenceField({ by_weekday: arr });
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {form.recurrence.frequency === "MONTHLY" && (
                <div className={styles.monthdays}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={
                        form.recurrence.by_monthday.includes(d)
                          ? styles.selected
                          : ""
                      }
                      onClick={() => {
                        const arr = [...form.recurrence.by_monthday];
                        const idx = arr.indexOf(d);
                        if (idx >= 0) arr.splice(idx, 1);
                        else arr.push(d);
                        handleRecurrenceField({ by_monthday: arr });
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.project_id}
              className={styles.save}
            >
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
