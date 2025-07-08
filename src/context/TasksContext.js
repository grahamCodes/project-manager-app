// Further suggestions:

// Abort on unmount: You could use an AbortController to cancel the fetch if the component unmounts

// Pagination support: If the full task list grows large, you might add skip/take helpers or switch to a paginated fetch strategy

// Memoize context value: Wrapping the value in useMemo can avoid unnecessary re-renders when unrelated updates occur

// src/context/TasksContext.js
"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

// Create the context
const TasksContext = createContext();

// Provider component
export function TasksProvider({ children, initialTasks = [] }) {
  // Seed with SSR-fetched tasks, then hydrate full list
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount, fetch the full tasks list to hydrate beyond the initial slice
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch("/api/tasks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tasks");
        return res.json();
      })
      .then((data) => {
        if (isMounted) setTasks(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Add a new task to state
  const addTask = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  // Update an existing task in state
  const updateTask = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // Optional: refresh tasks from the server
  const refreshTasks = () => {
    setLoading(true);
    fetch("/api/tasks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to refresh tasks");
        return res.json();
      })
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <TasksContext.Provider
      value={{ tasks, loading, error, addTask, updateTask, refreshTasks }}
    >
      {children}
    </TasksContext.Provider>
  );
}

// Custom hook for easy consumption
export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
