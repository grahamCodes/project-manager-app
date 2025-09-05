// src/context/ProjectsContext.js
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children, initialProjects = [] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hydrate on mount from API (keeps SSR seed, then refreshes)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch projects");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addProject = (p) => setProjects((prev) => [...prev, p]);

  const updateProject = (updated) =>
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/projects");
      if (!r.ok) throw new Error("Failed to refresh projects");
      const data = await r.json();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentProjects = useMemo(
    () => projects.filter((p) => p.status !== "Complete"),
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === "Complete"),
    [projects]
  );

  const value = useMemo(
    () => ({
      projects,
      currentProjects,
      completedProjects,
      loading,
      error,
      addProject,
      updateProject,
      refreshProjects,
    }),
    [projects, currentProjects, completedProjects, loading, error]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx)
    throw new Error("useProjects must be used inside a ProjectsProvider");
  return ctx;
}
