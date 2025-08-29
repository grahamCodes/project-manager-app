// src/components/AddProjectModal.js
"use client";

import { useState, useEffect } from "react";
import styles from "./AddProjectModal.module.css";

const PRESET_COLORS = [
  "#F3F1EC",
  "#F5E7EA",
  "#F6E6D8",
  "#E0E8F1",
  "#E6EDD9",
  // "#EEF0F2",
];

// Default form state for "add" mode
const BLANK_FORM = {
  name: "",
  description: "",
  color: PRESET_COLORS[0],
  status: "Not Started",
  start_date: "",
  end_date: "",
};

export default function AddProjectModal({
  isOpen,
  onClose,
  onCreate,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);

  const getInitialForm = () => {
    if (isEdit) {
      return {
        name: initialData.name,
        description: initialData.description || "",
        color: initialData.color,
        status: initialData.status,
        start_date: initialData.start_date
          ? new Date(initialData.start_date).toISOString().slice(0, 10)
          : "",
        end_date: initialData.end_date
          ? new Date(initialData.end_date).toISOString().slice(0, 10)
          : "",
        sort_order: initialData.sort_order,
      };
    }
    return { ...BLANK_FORM };
  };

  const [form, setForm] = useState(getInitialForm());
  const [showColorPicker, setShowColorPicker] = useState(
    isEdit && !PRESET_COLORS.includes(getInitialForm().color)
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset on close (add mode only)
  useEffect(() => {
    if (!isOpen && !isEdit) {
      setForm(getInitialForm());
      setError(null);
      setLoading(false);
      setShowColorPicker(false);
    }
  }, [isOpen, isEdit]);

  // Sync when entering edit mode
  useEffect(() => {
    if (isEdit) {
      const sd = new Date(initialData.start_date);
      const ed = new Date(initialData.end_date);
      const color = initialData.color;
      setForm({
        name: initialData.name,
        description: initialData.description || "",
        color,
        status: initialData.status,
        start_date: isNaN(sd) ? "" : sd.toISOString().slice(0, 10),
        end_date: isNaN(ed) ? "" : ed.toISOString().slice(0, 10),
        sort_order: initialData.sort_order,
      });
      setShowColorPicker(!PRESET_COLORS.includes(color));
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

  const handleSelectPreset = (color) => {
    setForm((prev) => ({ ...prev, color }));
    setShowColorPicker(false);
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
        body: JSON.stringify({ ...form }),
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
          {/* Name */}
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          {/* Description */}
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          {/* Color */}
          <label>Color</label>
          <div className={styles.swatches}>
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className={`${styles.swatch} ${
                  form.color === c ? styles.swatchSelected : ""
                }`}
                style={{ backgroundColor: c }}
                onClick={() => handleSelectPreset(c)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.customButton}
            onClick={() => setShowColorPicker(true)}
          >
            Custom
          </button>
          {showColorPicker && (
            <input
              id="color"
              name="color"
              type="color"
              value={form.color}
              onChange={handleChange}
              className={styles.colorInput}
            />
          )}

          {/* Status */}
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

          {/* Dates */}
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

          {error && <p className={styles.error}>{error}</p>}

          {/* Actions */}
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
