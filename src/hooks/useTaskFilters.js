// src/hooks/useTaskFilters.js
"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "taskFilters";

const defaultFilters = {
  status: {
    inProgress: true,
    blocked: true,
    complete: true,
  },
  dueDate: {
    type: "all", // "all" | "overdue" | "today" | "week" | "range"
    from: null,
    to: null,
  },
  projects: [],
  priority: {
    high: true,
    medium: true,
    low: true,
  },
  recurring: {
    oneOff: true,
    recurring: true,
  },
  searchText: "",
  // repurposed for created‐at sorting
  createdDate: {
    order: "desc", // "asc" | "desc"
  },
};

export default function useTaskFilters() {
  const [filters, setFilters] = useState(defaultFilters);

  // load
  useEffect(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        const saved = JSON.parse(json);
        setFilters((prev) => ({ ...prev, ...saved }));
      }
    } catch (e) {
      console.error("Failed to load task filters:", e);
    }
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error("Failed to save task filters:", e);
    }
  }, [filters]);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const normalizeStatus = (status) => {
    switch (status.trim()) {
      case "In Progress":
        return "inProgress";
      case "Blocked":
        return "blocked";
      case "Complete":
        return "complete";
      default:
        return status.replace(/\s+/g, "").toLowerCase();
    }
  };

  /** due‐date filter (in local time) */
  const filterByDueDate = (task) => {
    const { type, from, to } = filters.dueDate;
    if (type === "all") return true;

    const due = new Date(task.due_date);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    if (type === "overdue") {
      return due < startOfToday;
    }
    if (type === "today") {
      return due >= startOfToday && due < startOfTomorrow;
    }
    if (type === "week") {
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + 8);
      return due >= startOfToday && due < endOfWeek;
    }
    if (type === "range") {
      if (!from || !to) return true;
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const endOfTo = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate() + 1
      );
      return due >= fromDate && due < endOfTo;
    }
    return true;
  };

  /** created‐at sort */
  const sortByCreatedDate = (tasks) => {
    const order = filters.createdDate.order;
    return [...tasks].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return order === "asc" ? aTime - bTime : bTime - aTime;
    });
  };

  return {
    filters,
    setFilters,
    resetFilters,
    normalizeStatus,
    filterByDueDate,
    sortByCreatedDate,
  };
}
