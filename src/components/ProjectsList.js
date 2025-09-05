// // src/components/ProjectsList.js
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import AddProjectModal from "./AddProjectModal";
// import styles from "./ProjectsList.module.css";

// export default function ProjectsList({ initialProjects }) {
//   const [projects, setProjects] = useState(initialProjects);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleCreate = (newProject) => {
//     setProjects((prev) => [...prev, newProject]);
//     setIsModalOpen(false);
//   };

//   return (
//     <div className={styles.container}>
//       {/* <h2>Your Projects</h2> */}
//       <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
//         + Add Project
//       </button>
//       <AddProjectModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onCreate={handleCreate}
//       />
//       <ul className={styles.list}>
//         {projects.map((proj) => {
//           const start = new Date(proj.start_date).toLocaleDateString();
//           const end = new Date(proj.end_date).toLocaleDateString();

//           return (
//             <li
//               key={proj.id}
//               className={styles.item}
//               style={{ backgroundColor: proj.color }}
//             >
//               {/* wrap the whole content in a block-level Link */}
//               <Link href={`/projects/${proj.id}`} className={styles.itemLink}>
//                 <div className={styles.row}>
//                   <span className={styles.projectLink}>{proj.name}</span>
//                   <span className={styles.status}>{proj.status}</span>
//                 </div>
//                 <div className={styles.dates}>
//                   {start} → {end}
//                 </div>
//               </Link>
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }
// src/components/ProjectsList.js
"use client";

import { useState } from "react";
import Link from "next/link";
import AddProjectModal from "./AddProjectModal";
import styles from "./ProjectsList.module.css";
import { useProjects } from "@/context/ProjectsContext";

export default function ProjectsList() {
  const { currentProjects, completedProjects, addProject, loading, error } =
    useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // 'current' | 'completed'

  const list = activeTab === "current" ? currentProjects : completedProjects;
  const emptyText =
    activeTab === "current" ? "No current projects" : "No completed projects";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button
          className={styles.addButton}
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
        >
          + Add Project
        </button>

        <AddProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={(p) => {
            addProject(p);
            setIsModalOpen(false);
          }}
        />

        {error && <p className={styles.error}>{error}</p>}

        {loading && list.length === 0 ? (
          <p className={styles.loading}>Loading projects...</p>
        ) : list.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          <ul className={styles.list}>
            {list.map((proj) => {
              const start = new Date(proj.start_date).toLocaleDateString();
              const end = new Date(proj.end_date).toLocaleDateString();
              return (
                <li
                  key={proj.id}
                  className={styles.item}
                  style={{ backgroundColor: proj.color }}
                >
                  <Link
                    href={`/projects/${proj.id}`}
                    className={styles.itemLink}
                  >
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
        )}
      </div>

      {/* Fixed bottom tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "current" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("current")}
        >
          Current Projects
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "completed" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
      </div>
    </div>
  );
}
