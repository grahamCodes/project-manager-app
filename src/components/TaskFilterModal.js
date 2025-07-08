// src/components/TaskFilterModal.js
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./TaskFilterModal.module.css";

export default function TaskFilterModal({
  isOpen,
  onClose,
  filters,
  setFilters,
  resetFilters,
  tasks,
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Derive unique project options
  const projectOptions = useMemo(
    () =>
      Array.from(new Map(tasks.map((t) => [t.project.id, t.project])).values()),
    [tasks]
  );

  // Sync localFilters and reset dropdown on modal open
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setDropdownOpen(false);
      setSearchTerm("");
    }
  }, [isOpen, filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search term for projects dropdown
  const [searchTerm, setSearchTerm] = useState("");
  const filteredProjects = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return projectOptions.filter((p) => p.name.toLowerCase().includes(lower));
  }, [projectOptions, searchTerm]);

  // Handlers for other filters
  const toggleStatus = (key) =>
    setLocalFilters((prev) => ({
      ...prev,
      status: { ...prev.status, [key]: !prev.status[key] },
    }));

  const changeDueType = (type) =>
    setLocalFilters((prev) => ({
      ...prev,
      dueDate: { type, from: null, to: null },
    }));

  const changeDateRange = (field, value) =>
    setLocalFilters((prev) => ({
      ...prev,
      dueDate: { ...prev.dueDate, [field]: value },
    }));

  const togglePriority = (key) =>
    setLocalFilters((prev) => ({
      ...prev,
      priority: { ...prev.priority, [key]: !prev.priority[key] },
    }));

  const toggleRecurring = (key) =>
    setLocalFilters((prev) => ({
      ...prev,
      recurring: { ...prev.recurring, [key]: !prev.recurring[key] },
    }));

  const changeSearchText = (e) =>
    setLocalFilters((prev) => ({ ...prev, searchText: e.target.value }));

  const changeCreatedOrder = (order) =>
    setLocalFilters((prev) => ({ ...prev, createdDate: { order } }));

  // Toggle project in multi-select
  const toggleProject = (id) =>
    setLocalFilters((prev) => {
      const setIds = new Set(prev.projects);
      setIds.has(id) ? setIds.delete(id) : setIds.add(id);
      return { ...prev, projects: Array.from(setIds) };
    });

  // Apply or clear filters
  const apply = () => {
    setFilters(localFilters);
    setDropdownOpen(false);
    onClose();
  };

  const clear = () => {
    resetFilters();
    setDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Filter Tasks</h2>

        {/* Status Section */}
        <div className={styles.section}>
          <h3>Status</h3>
          {Object.entries(localFilters.status).map(([key, val]) => (
            <label key={key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleStatus(key)}
              />
              {key}
            </label>
          ))}
        </div>

        {/* Due Date Section */}
        <div className={styles.section}>
          <h3>Due Date</h3>
          {["all", "overdue", "today", "week", "range"].map((type) => (
            <label key={type} className={styles.radioLabel}>
              <input
                type="radio"
                name="dueDateType"
                value={type}
                checked={localFilters.dueDate.type === type}
                onChange={() => changeDueType(type)}
              />
              {type}
            </label>
          ))}
          {localFilters.dueDate.type === "range" && (
            <div className={styles.dateRange}>
              <input
                type="date"
                value={localFilters.dueDate.from || ""}
                onChange={(e) => changeDateRange("from", e.target.value)}
              />
              <input
                type="date"
                value={localFilters.dueDate.to || ""}
                onChange={(e) => changeDateRange("to", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Projects Multi-select Section */}
        <div className={styles.section} ref={dropdownRef}>
          <h3>Projects</h3>
          <div
            className={styles.multiSelectInput}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            {localFilters.projects.length === 0 ? (
              <span className={styles.placeholder}>Select Projects...</span>
            ) : (
              <div className={styles.tagsContainer}>
                {localFilters.projects.map((id) => {
                  const proj = projectOptions.find((p) => p.id === id);
                  return (
                    <span key={id} className={styles.tag}>
                      {proj?.name}
                    </span>
                  );
                })}
              </div>
            )}
            <span className={styles.caret}>&#9662;</span>
          </div>
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className={styles.optionsList}>
                {filteredProjects.map((proj) => (
                  <label key={proj.id} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={localFilters.projects.includes(proj.id)}
                      onChange={() => toggleProject(proj.id)}
                    />
                    {proj.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Section */}
        <div className={styles.section}>
          <h3>Priority</h3>
          {Object.entries(localFilters.priority).map(([key, val]) => (
            <label key={key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={val}
                onChange={() => togglePriority(key)}
              />
              {key}
            </label>
          ))}
        </div>

        {/* Recurring Section */}
        <div className={styles.section}>
          <h3>Recurring</h3>
          {Object.entries(localFilters.recurring).map(([key, val]) => (
            <label key={key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleRecurring(key)}
              />
              {key}
            </label>
          ))}
        </div>

        {/* Search Section */}
        <div className={styles.section}>
          <h3>Search</h3>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks..."
            value={localFilters.searchText}
            onChange={changeSearchText}
          />
        </div>

        {/* Created Date Sort Section */}
        <div className={styles.section}>
          <h3>Created Date</h3>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="createdDateOrder"
              value="desc"
              checked={localFilters.createdDate.order === "desc"}
              onChange={() => changeCreatedOrder("desc")}
            />
            Descending
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="createdDateOrder"
              value="asc"
              checked={localFilters.createdDate.order === "asc"}
              onChange={() => changeCreatedOrder("asc")}
            />
            Ascending
          </label>
        </div>

        {/* Actions Section */}
        <div className={styles.actions}>
          <button className={styles.resetButton} onClick={clear}>
            Reset
          </button>
          <button className={styles.applyButton} onClick={apply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
