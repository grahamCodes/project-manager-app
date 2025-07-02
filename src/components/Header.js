// components/Header.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddTaskModal from "./AddTaskModal";
import AddProjectModal from "./AddProjectModal";
import styles from "./Header.module.css";

export default function Header({ projects }) {
  const pathname = usePathname();
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

  const menuItems = [
    { label: "Projects", href: "/projects" },
    { label: "Settings", href: "/settings" },
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
          >
            {/* Plus icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className={styles.dropdown}>
            <button
              className={styles.iconButton}
              onClick={toggleDropdown}
              aria-label="Menu"
            >
              {/* Hamburger icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 7H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 17H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                {menuItems.map(
                  (item) =>
                    item.href !== pathname && (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        {item.label}
                      </Link>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* First modal: choose between task or project */}
      {showFirstModal && (
        <div className={styles.overlay} onClick={closeAllModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* <h2 className={styles.title}>Select an option</h2> */}
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

      {/* Task modal, with project dropdown */}
      {selectedOption === "task" && (
        <AddTaskModal
          isOpen={true}
          onClose={closeAllModals}
          onCreate={(task) => {
            console.log("Task created:", task);
            closeAllModals();
          }}
          onUpdate={(task) => {
            console.log("Task updated:", task);
            closeAllModals();
          }}
          projects={projects}
        />
      )}

      {/* Project modal */}
      {selectedOption === "project" && (
        <AddProjectModal
          isOpen={true}
          onClose={closeAllModals}
          onCreate={(proj) => {
            console.log("Project created:", proj);
            closeAllModals();
          }}
        />
      )}
    </>
  );
}
