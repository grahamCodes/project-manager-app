// src/components/ProjectsList.js
"use client";

import { useState } from "react";
import Link from "next/link";
import AddProjectModal from "./AddProjectModal";
import styles from "./ProjectsList.module.css";

export default function ProjectsList({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (newProject) => {
    setProjects((prev) => [...prev, newProject]);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* <h2>Your Projects</h2> */}
      <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
        + Add Project
      </button>
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
      <ul className={styles.list}>
        {projects.map((proj) => {
          const start = new Date(proj.start_date).toLocaleDateString();
          const end = new Date(proj.end_date).toLocaleDateString();

          return (
            <li
              key={proj.id}
              className={styles.item}
              style={{ backgroundColor: proj.color }}
            >
              {/* wrap the whole content in a block-level Link */}
              <Link href={`/projects/${proj.id}`} className={styles.itemLink}>
                <div className={styles.row}>
                  <span className={styles.projectLink}>{proj.name}</span>
                  <span className={styles.status}>{proj.status}</span>
                </div>
                <div className={styles.dates}>
                  {start} → {end}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
