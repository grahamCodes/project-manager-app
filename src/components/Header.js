// // src/components/Header.js
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter, usePathname } from "next/navigation";
// import AddTaskModal from "./AddTaskModal";
// import AddProjectModal from "./AddProjectModal";
// import styles from "./Header.module.css";
// import { useTasks } from "@/context/TasksContext";

// export default function Header({ projects }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { addTask, updateTask, refreshTasks, loading, error } = useTasks();

//   const [showFirstModal, setShowFirstModal] = useState(false);
//   const [selectedOption, setSelectedOption] = useState(null);
//   const [showDropdown, setShowDropdown] = useState(false);

//   const openModal = () => setShowFirstModal(true);
//   const closeAllModals = () => {
//     setShowFirstModal(false);
//     setSelectedOption(null);
//   };
//   const handleOptionClick = (option) => {
//     setShowFirstModal(false);
//     setSelectedOption(option);
//   };
//   const toggleDropdown = () => setShowDropdown((prev) => !prev);

//   // Logout handler
//   const handleLogout = async () => {
//     await fetch("/api/auth/logout", { method: "POST" });
//     router.push("/login");
//   };

//   const menuItems = [
//     { label: "Projects", href: "/projects" },
//     { label: "Settings", href: "/settings" },
//     { label: "Logout", onClick: handleLogout },
//   ];

//   return (
//     <>
//       <header className={styles.header}>
//         <Link href="/" className={styles.logo}>
//           DueList
//         </Link>

//         <div className={styles.actions}>
//           <button
//             className={styles.iconButton}
//             onClick={openModal}
//             aria-label="Add"
//             disabled={loading}
//           >
//             <svg width="24" height="24" viewBox="0 0 24 24">
//               <path d="M12 5V19" stroke="currentColor" strokeWidth="2" />
//               <path d="M5 12H19" stroke="currentColor" strokeWidth="2" />
//             </svg>
//           </button>

//           <div className={styles.dropdown}>
//             <button
//               className={styles.iconButton}
//               onClick={toggleDropdown}
//               aria-label="Menu"
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24">
//                 <path d="M3 7H21" stroke="currentColor" strokeWidth="2" />
//                 <path d="M3 12H21" stroke="currentColor" strokeWidth="2" />
//                 <path d="M3 17H21" stroke="currentColor" strokeWidth="2" />
//               </svg>
//             </button>

//             {showDropdown && (
//               <div className={styles.dropdownMenu}>
//                 {menuItems.map((item) =>
//                   item.href ? (
//                     item.href !== pathname && (
//                       <Link
//                         key={item.label}
//                         href={item.href}
//                         className={styles.dropdownItem}
//                         onClick={() => setShowDropdown(false)}
//                       >
//                         {item.label}
//                       </Link>
//                     )
//                   ) : (
//                     <button
//                       key={item.label}
//                       type="button"
//                       className={styles.dropdownItem}
//                       onClick={() => {
//                         setShowDropdown(false);
//                         item.onClick();
//                       }}
//                     >
//                       {item.label}
//                     </button>
//                   )
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </header>

//       {showFirstModal && (
//         <div className={styles.overlay} onClick={closeAllModals}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <div className={styles.modalButtons}>
//               <button
//                 className={styles.addTaskButton}
//                 onClick={() => handleOptionClick("task")}
//               >
//                 New Task
//               </button>
//               <button
//                 className={styles.addProjectButton}
//                 onClick={() => handleOptionClick("project")}
//               >
//                 New Project
//               </button>
//             </div>

//             <button className={styles.cancel} onClick={closeAllModals}>
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       {selectedOption === "task" && (
//         <AddTaskModal
//           isOpen
//           onClose={closeAllModals}
//           onCreate={(task) => {
//             addTask(task);
//             closeAllModals();
//           }}
//           onUpdate={(task) => {
//             updateTask(task);
//             closeAllModals();
//           }}
//           projects={projects}
//         />
//       )}

//       {selectedOption === "project" && (
//         <AddProjectModal
//           isOpen
//           onClose={closeAllModals}
//           onCreate={(proj) => {
//             // handle project creation later via context
//             closeAllModals();
//           }}
//         />
//       )}

//       {/* Display error toast if context fetch failed */}
//       {error && (
//         <div className={styles.error}>Failed to load tasks: {error}</div>
//       )}
//     </>
//   );
// }
// src/components/Header.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AddTaskModal from "./AddTaskModal";
import AddProjectModal from "./AddProjectModal";
import styles from "./Header.module.css";
import { useTasks } from "@/context/TasksContext";
import { useProjects } from "@/context/ProjectsContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { addTask, updateTask, loading, error } = useTasks();
  const { currentProjects, addProject } = useProjects();

  const [showFirstModal, setShowFirstModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const openModal = () => setShowFirstModal(true);
  const closeAllModals = () => {
    setShowFirstModal(false);
    setSelectedOption(null);
  };
  const handleOptionClick = (option) => {
    setShowFirstModal(false);
    setSelectedOption(option);
  };
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const menuItems = [
    { label: "Projects", href: "/projects" },
    { label: "Settings", href: "/settings" },
    { label: "Logout", onClick: handleLogout },
  ];

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          DueList
        </Link>

        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={openModal}
            aria-label="Add"
            disabled={loading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" />
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <div className={styles.dropdown}>
            <button
              className={styles.iconButton}
              onClick={toggleDropdown}
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 7H21" stroke="currentColor" strokeWidth="2" />
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" />
                <path d="M3 17H21" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                {menuItems.map((item) =>
                  item.href ? (
                    item.href !== pathname && (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setShowDropdown(false);
                        item.onClick();
                      }}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showFirstModal && (
        <div className={styles.overlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalButtons}>
              <button
                className={styles.addTaskButton}
                onClick={() => handleOptionClick("task")}
              >
                New Task
              </button>
              <button
                className={styles.addProjectButton}
                onClick={() => handleOptionClick("project")}
              >
                New Project
              </button>
            </div>

            <button className={styles.cancel} onClick={closeAllModals}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedOption === "task" && (
        <AddTaskModal
          isOpen
          onClose={closeAllModals}
          onCreate={(task) => {
            addTask(task);
            closeAllModals();
          }}
          onUpdate={(task) => {
            updateTask(task);
            closeAllModals();
          }}
          projects={currentProjects}
        />
      )}

      {selectedOption === "project" && (
        <AddProjectModal
          isOpen
          onClose={closeAllModals}
          onCreate={(proj) => {
            addProject(proj); // update global list immediately
            closeAllModals();
          }}
        />
      )}

      {/* Display error toast if context fetch failed (tasks) */}
      {error && (
        <div className={styles.error}>Failed to load tasks: {error}</div>
      )}
    </>
  );
}
