"use client";

// src/app/settings/page.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    tasks_per_day: 5,
    more_tasks_count: 3,
    checkin_hours: 2,
    sort_mode: "due_date",
    sort_project_id: null,
    theme: "light",
    tone: "supportive",
    timezone: "UTC",
    daily_minimum: 1,
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((res) => {
        if (res.ok) return res.json();
        if (res.status === 404) return null;
        throw new Error("Failed to load settings");
      }),
      fetch("/api/projects").then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      }),
    ])
      .then(([settings, projects]) => {
        if (settings) {
          setForm({
            tasks_per_day: settings.tasks_per_day,
            more_tasks_count: settings.more_tasks_count,
            checkin_hours: settings.checkin_hours,
            sort_mode: settings.sort_mode,
            sort_project_id: settings.sort_project_id,
            theme: settings.theme,
            tone: settings.tone,
            timezone: settings.timezone,
            daily_minimum: settings.daily_minimum,
          });
        }
        setProjects(projects.filter((p) => p.status !== "Complete"));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val;
    if (type === "checkbox") {
      val = checked;
    } else if (type === "number") {
      val = value === "" ? "" : Number(value);
    } else {
      val = value;
    }
    setForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const validate = () => {
    if (form.tasks_per_day < 1 || form.tasks_per_day > 20) {
      setError("Tasks per day must be between 1 and 20");
      return false;
    }
    if (form.more_tasks_count < 0 || form.more_tasks_count > 5) {
      setError("More tasks count must be between 0 and 5");
      return false;
    }
    if (form.checkin_hours < 1) {
      setError("Check-in hours must be at least 1");
      return false;
    }
    if (form.daily_minimum < 1) {
      setError("Daily minimum must be at least 1");
      return false;
    }
    if (!["due_date", "project"].includes(form.sort_mode)) {
      setError("Invalid sort mode");
      return false;
    }
    if (form.sort_mode === "project" && !form.sort_project_id) {
      setError("Please select a project for Project sort mode");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      // Apply the new theme immediately
      document.documentElement.dataset.theme = form.theme;

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading settings…</p>;
  }

  return (
    <div className={styles.container}>
      <h1>Settings</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Tasks per day
          <input
            type="number"
            name="tasks_per_day"
            min="1"
            max="20"
            value={form.tasks_per_day}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          More tasks count
          <input
            type="number"
            name="more_tasks_count"
            min="0"
            max="5"
            value={form.more_tasks_count}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Check-in hours
          <input
            type="number"
            name="checkin_hours"
            min="1"
            value={form.checkin_hours}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Daily minimum
          <input
            type="number"
            name="daily_minimum"
            min="1"
            value={form.daily_minimum}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Sort mode
          <select
            name="sort_mode"
            value={form.sort_mode}
            onChange={handleChange}
          >
            <option value="due_date">Due Date</option>
            <option value="project">Project</option>
          </select>
        </label>

        {form.sort_mode === "project" && (
          <label>
            Choose project
            <select
              name="sort_project_id"
              value={form.sort_project_id || ""}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                -- select a project --
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Theme
          <select name="theme" value={form.theme} onChange={handleChange}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label>
          Tone
          <select name="tone" value={form.tone} onChange={handleChange}>
            <option value="snarky">Snarky</option>
            <option value="supportive">Supportive</option>
          </select>
        </label>

        <label>
          Timezone
          <select name="timezone" value={form.timezone} onChange={handleChange}>
            <option value="KST">KST (GMT+9)</option>
            <option value="EST">EST (GMT-5)</option>
            <option value="UTC">UTC (GMT+0)</option>
            <option value="GMT">GMT (GMT+0)</option>
          </select>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className={styles.cancel}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={styles.save}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {showToast && <div className={styles.toast}>Save Successful!</div>}
    </div>
  );
}
