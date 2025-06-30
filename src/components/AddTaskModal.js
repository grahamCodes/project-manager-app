// // src/components/AddTaskModal.js
// "use client";

// import { useState, useEffect } from "react";
// import styles from "./AddTaskModal.module.css";

// export default function AddTaskModal({
//   isOpen,
//   onClose,
//   onCreate,
//   onUpdate,
//   initialData = null,
//   projectId,
// }) {
//   const isEdit = Boolean(initialData);
//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     due_date: "",
//     status: "Not Started",
//     is_recurring: false,
//     repeat_days: 1,
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (isEdit) {
//       setForm({
//         name: initialData.name,
//         description: initialData.description || "",
//         due_date: initialData.due_date.slice(0, 10),
//         status: initialData.status,
//         is_recurring: initialData.is_recurring,
//         repeat_days: initialData.repeat_days || 1,
//       });
//     }
//   }, [initialData]);

//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const url = isEdit ? `/api/tasks/${initialData.id}` : "/api/tasks";
//     const method = isEdit ? "PUT" : "POST";
//     const payload = isEdit ? form : { ...form, project_id: projectId };

//     try {
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed");
//       isEdit ? onUpdate(data) : onCreate(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.overlay} onClick={onClose}>
//       <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//         <h2 className={styles.title}>{isEdit ? "Edit Task" : "Add Task"}</h2>
//         <form onSubmit={handleSubmit} className={styles.form}>
//           <label>Name</label>
//           <input
//             name="name"
//             value={form.name}
//             onChange={handleChange}
//             required
//           />

//           <label>Description</label>
//           <textarea
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//           />

//           <label>Due Date</label>
//           <input
//             type="date"
//             name="due_date"
//             value={form.due_date}
//             onChange={handleChange}
//             required
//           />

//           <label>Status</label>
//           <select
//             name="status"
//             value={form.status}
//             onChange={handleChange}
//             required
//           >
//             <option>Not Started</option>
//             <option>In Progress</option>
//             <option>Blocked</option>
//             <option>Complete</option>
//           </select>

//           <label>
//             <input
//               type="checkbox"
//               name="is_recurring"
//               checked={form.is_recurring}
//               onChange={handleChange}
//             />{" "}
//             Recurring
//           </label>

//           {form.is_recurring && (
//             <>
//               <label>Repeat Every (days)</label>
//               <input
//                 type="number"
//                 name="repeat_days"
//                 min={1}
//                 value={form.repeat_days}
//                 onChange={handleChange}
//               />
//             </>
//           )}

//           {error && <p className={styles.error}>{error}</p>}

//           <div className={styles.actions}>
//             <button type="button" onClick={onClose} className={styles.cancel}>
//               Cancel
//             </button>
//             <button type="submit" disabled={loading} className={styles.save}>
//               {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
// src/components/AddTaskModal.js
"use client";

import { useState, useEffect } from "react";
import styles from "./AddTaskModal.module.css";

export default function AddTaskModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  initialData = null,
  projectId,
}) {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState({
    name: "",
    description: "",
    due_date: "",
    status: "Not Started",
    is_recurring: false,
    repeat_days: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (isEdit) {
      setForm({
        name: initialData.name,
        description: initialData.description || "",
        // Convert Date to ISO string for input value
        due_date: new Date(initialData.due_date).toISOString().slice(0, 10),
        status: initialData.status,
        is_recurring: initialData.is_recurring,
        repeat_days: initialData.repeat_days || 1,
      });
    }
  }, [initialData, isEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/tasks/${initialData.id}` : "/api/tasks";
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit ? form : { ...form, project_id: projectId };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save task");
      isEdit ? onUpdate(data) : onCreate(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{isEdit ? "Edit Task" : "Add Task"}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <label>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            required
          />

          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Complete</option>
          </select>

          <label>
            <input
              type="checkbox"
              name="is_recurring"
              checked={form.is_recurring}
              onChange={handleChange}
            />{" "}
            Recurring
          </label>

          {form.is_recurring && (
            <>
              <label>Repeat Every (days)</label>
              <input
                type="number"
                name="repeat_days"
                min={1}
                value={form.repeat_days}
                onChange={handleChange}
              />
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.save}>
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
