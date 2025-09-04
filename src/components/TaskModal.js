// // src/components/TaskModal.js
// "use client";

// import { useState, useEffect } from "react";
// import styles from "./TaskModal.module.css";

// export default function TaskModal({ task, onClose, onUpdate }) {
//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     status: "In Progress",
//     due_date: "",
//     is_recurring: false,
//     repeat_days: "",
//   });
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Initialize form values from task prop, using TaskInstance data for recurring tasks
//   useEffect(() => {
//     if (task) {
//       const inst = task.instances?.[0];
//       const isRecurring = Boolean(task.is_recurring);

//       // Determine initial status: instance for recurring, task otherwise
//       const initialStatus = isRecurring && inst ? inst.status : task.status;

//       // Determine initial due date (YYYY-MM-DD)
//       let initialDue = "";
//       try {
//         const raw = isRecurring && inst ? inst.due_date : task.due_date;
//         const dateObj = new Date(raw);
//         if (!isNaN(dateObj)) {
//           initialDue = dateObj.toISOString().slice(0, 10);
//         }
//       } catch {
//         initialDue = "";
//       }

//       setForm({
//         name: task.name,
//         description: task.description || "",
//         status: initialStatus,
//         due_date: initialDue,
//         is_recurring: isRecurring,
//         repeat_days: task.repeat_days != null ? String(task.repeat_days) : "",
//       });
//     }
//   }, [task]);

//   if (!task) return null;

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       const payload = {
//         name: form.name,
//         description: form.description,
//         status: form.status,
//         due_date: form.due_date,
//         is_recurring: form.is_recurring,
//         repeat_days: form.is_recurring ? Number(form.repeat_days) : null,
//         priority: task.priority,
//       };

//       const res = await fetch(`/api/tasks/${task.id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Update failed");
//       onUpdate(data);
//       onClose();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.overlay} onClick={onClose}>
//       <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//         <h2 className={styles.title}>Edit Task</h2>
//         <form onSubmit={handleSubmit} className={styles.form}>
//           <label htmlFor="name">Name</label>
//           <input
//             id="name"
//             name="name"
//             value={form.name}
//             onChange={handleChange}
//             required
//           />

//           <label htmlFor="description">Description</label>
//           <textarea
//             id="description"
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//           />

//           <label htmlFor="status">Status</label>
//           <select
//             id="status"
//             name="status"
//             value={form.status}
//             onChange={handleChange}
//             required
//           >
//             <option>In Progress</option>
//             <option>Blocked</option>
//             <option>Complete</option>
//           </select>

//           <label htmlFor="due_date">Due Date</label>
//           <input
//             id="due_date"
//             name="due_date"
//             type="date"
//             value={form.due_date}
//             onChange={handleChange}
//             required
//           />

//           <div className={styles.checkboxGroup}>
//             <input
//               id="is_recurring"
//               name="is_recurring"
//               type="checkbox"
//               checked={form.is_recurring}
//               onChange={handleChange}
//             />
//             <label htmlFor="is_recurring">Recurring</label>
//           </div>

//           {form.is_recurring && (
//             <>
//               <label htmlFor="repeat_days">Repeat every (days)</label>
//               <input
//                 id="repeat_days"
//                 name="repeat_days"
//                 type="number"
//                 min={1}
//                 value={form.repeat_days}
//                 onChange={handleChange}
//                 required
//               />
//             </>
//           )}

//           {error && <p className={styles.error}>{error}</p>}

//           <div className={styles.actions}>
//             <button
//               type="button"
//               onClick={onClose}
//               className={styles.cancel}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button type="submit" disabled={loading} className={styles.save}>
//               {loading ? "Updating..." : "Update Task"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
// src/components/TaskModal.js
"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./TaskModal.module.css";

const FREQUENCIES = [
  { value: "", label: "None" },
  { value: "DAILY", label: "Every Day" },
  { value: "WEEKLY", label: "Every Week" },
  { value: "MONTHLY", label: "Every Month" },
];

export default function TaskModal({ task, onClose, onUpdate }) {
  const inst = task?.instances?.[0] || null;
  const hasRule = Boolean(task?.recurrence);
  const isRecurring = Boolean(task?.is_recurring || hasRule);

  // Initial status/due: instance for recurring, parent for non-recurring
  const initialStatus = isRecurring && inst ? inst.status : task.status;
  const initialDueISO = (() => {
    const raw = isRecurring && inst ? inst.due_date : task.due_date;
    try {
      const d = new Date(raw);
      return !isNaN(d) ? d.toISOString().slice(0, 10) : "";
    } catch {
      return "";
    }
  })();

  const [form, setForm] = useState({
    name: task?.name ?? "",
    description: task?.description ?? "",
    status: initialStatus,
    due_date: initialDueISO, // yyyy-mm-dd
    priority: task?.priority ?? 0,
    recurrence: hasRule
      ? {
          frequency: task.recurrence.frequency,
          interval: task.recurrence.interval,
          by_weekday: task.recurrence.by_weekday,
          by_monthday: task.recurrence.by_monthday,
          ends_at: task.recurrence.ends_at,
        }
      : null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep a simple derived value for select
  const freq = form.recurrence?.frequency ?? "";

  const parentLockedLabel = useMemo(() => {
    return isRecurring ? "Parent status: Recurring (locked)" : null;
  }, [isRecurring]);

  if (!task) return null;

  const setField = (name, value) =>
    setForm((f) => ({
      ...f,
      [name]: value,
    }));

  const handleRecurrenceChange = (newFreq) => {
    if (!newFreq) {
      setField("recurrence", null);
      return;
    }
    if (newFreq === "DAILY") {
      setField("recurrence", {
        frequency: "DAILY",
        interval: 1,
        by_weekday: [],
        by_monthday: [],
        ends_at: null,
      });
    } else if (newFreq === "WEEKLY") {
      const today = new Date().getDay();
      setField("recurrence", {
        frequency: "WEEKLY",
        interval: 1,
        by_weekday: [today],
        by_monthday: [],
        ends_at: null,
      });
    } else if (newFreq === "MONTHLY") {
      const date = new Date().getDate();
      setField("recurrence", {
        frequency: "MONTHLY",
        interval: 1,
        by_weekday: [],
        by_monthday: [date],
        ends_at: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Build payload; server decides parent vs instance updates:
    // - If recurrence exists → parent locked to "Recurring"; instance gets status/due changes
    // - If recurrence set to None (and was recurring) → server will FLATTEN (copy inst → parent, delete inst)
    const payload = {
      name: form.name,
      description: form.description || null,
      status: form.status, // parent (non-recurring) OR latest instance (recurring)
      due_date: form.due_date, // yyyy-mm-dd → server will set correct target
      priority: task.priority ?? 0,
      recurrence: form.recurrence, // null = None
    };

    try {
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
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />

          {parentLockedLabel && (
            <div className={styles.info}>{parentLockedLabel}</div>
          )}

          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            required
          >
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Complete</option>
          </select>

          <label htmlFor="due_date">Due Date</label>
          <input
            id="due_date"
            type="date"
            value={form.due_date}
            onChange={(e) => setField("due_date", e.target.value)}
            required
          />

          <label htmlFor="repeat">Repeat</label>
          <select
            id="repeat"
            value={freq}
            onChange={(e) => handleRecurrenceChange(e.target.value)}
          >
            {FREQUENCIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

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
            <button type="submit" disabled={loading} className={styles.save}>
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
