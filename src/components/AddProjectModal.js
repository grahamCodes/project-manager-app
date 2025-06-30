// // src/components/AddProjectModal.js
// "use client";

// import { useState } from "react";
// import styles from "./AddProjectModal.module.css";

// export default function AddProjectModal({ isOpen, onClose, onCreate }) {
//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     color: "#ffffff",
//     status: "Not Started",
//     start_date: "",
//     end_date: "",
//   });
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);

//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);

//     // Inline validation: start_date must be <= end_date
//     if (new Date(form.start_date) > new Date(form.end_date)) {
//       setError("Start date must be before or equal to end date");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch("/api/projects", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: form.name,
//           description: form.description,
//           color: form.color,
//           status: form.status,
//           start_date: form.start_date,
//           end_date: form.end_date,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to create project");
//       onCreate(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.overlay} onClick={onClose}>
//       <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//         <h2 className={styles.title}>Add Project</h2>
// <form onSubmit={handleSubmit} className={styles.form}>
//   <label htmlFor="name">Name</label>
//   <input
//     id="name"
//     name="name"
//     value={form.name}
//     onChange={handleChange}
//     required
//   />

//   <label htmlFor="description">Description</label>
//   <textarea
//     id="description"
//     name="description"
//     value={form.description}
//     onChange={handleChange}
//   />

//   <label htmlFor="color">Color</label>
//   <input
//     id="color"
//     name="color"
//     type="color"
//     value={form.color}
//     onChange={handleChange}
//     required
//   />

//   <label htmlFor="status">Status</label>
//   <select
//     id="status"
//     name="status"
//     value={form.status}
//     onChange={handleChange}
//     required
//   >
//     <option value="Not Started">Not Started</option>
//     <option value="In Progress">In Progress</option>
//     <option value="Blocked">Blocked</option>
//     <option value="Complete">Complete</option>
//   </select>

//   <label htmlFor="start_date">Start Date</label>
//   <input
//     id="start_date"
//     name="start_date"
//     type="date"
//     value={form.start_date}
//     onChange={handleChange}
//     required
//   />

//   <label htmlFor="end_date">End Date</label>
//   <input
//     id="end_date"
//     name="end_date"
//     type="date"
//     value={form.end_date}
//     onChange={handleChange}
//     required
//   />

//   {error && <p className={styles.error}>{error}</p>}

//   <div className={styles.actions}>
//     <button type="button" onClick={onClose} className={styles.cancel}>
//       Cancel
//     </button>
//     <button type="submit" disabled={loading} className={styles.save}>
//       {loading ? "Creating..." : "Create Project"}
//     </button>
//   </div>
// </form>
//       </div>
//     </div>
//   );
// }

// src/components/AddProjectModal.js
"use client";

import { useState, useEffect } from "react";
import styles from "./AddProjectModal.module.css";

export default function AddProjectModal({
  isOpen,
  onClose,
  onCreate,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#ffffff",
    status: "Not Started",
    start_date: "",
    end_date: "",
    // sort_order: 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  // useEffect(() => {
  //   if (isEdit) {
  //     setForm({
  //       name: initialData.name,
  //       description: initialData.description || "",
  //       color: initialData.color,
  //       status: initialData.status,
  //       // Convert Date → ISO string → 'YYYY-MM-DD'
  //       start_date: initialData.start_date.toISOString().slice(0, 10),
  //       end_date: initialData.end_date.toISOString().slice(0, 10),
  //       // sort_order: initialData.sort_order,
  //     });
  //   }
  // }, [initialData, isEdit]);
  useEffect(() => {
    if (isEdit) {
      const sd = new Date(initialData.start_date);
      const ed = new Date(initialData.end_date);
      setForm({
        name: initialData.name,
        description: initialData.description || "",
        color: initialData.color,
        status: initialData.status,
        start_date: isNaN(sd) ? "" : sd.toISOString().slice(0, 10),
        end_date: isNaN(ed) ? "" : ed.toISOString().slice(0, 10),
        sort_order: initialData.sort_order,
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
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/projects/${initialData.id}` : "/api/projects";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // sort_order: Number(form.sort_order),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save");
      onCreate(data);
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
        <h2 className={styles.title}>
          {isEdit ? "Edit Project" : "Add Project"}
        </h2>

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

          <label htmlFor="color">Color</label>
          <input
            id="color"
            name="color"
            type="color"
            value={form.color}
            onChange={handleChange}
            required
          />

          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Complete">Complete</option>
          </select>

          <label htmlFor="start_date">Start Date</label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={handleChange}
            required
          />

          <label htmlFor="end_date">End Date</label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={handleChange}
            required
          />

          {/* <label htmlFor="sort_order">Sort Order</label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            required
          /> */}

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
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                ? "Save Changes"
                : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
