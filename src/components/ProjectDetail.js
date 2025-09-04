// // src/components/ProjectDetail.js
// "use client";
// import { useState } from "react";
// import AddProjectModal from "./AddProjectModal";
// import AddTaskModal from "./AddTaskModal";
// import TaskCard from "./TaskCard";
// import styles from "./ProjectDetail.module.css";

// export default function ProjectDetail({ project, initialTasks }) {
//   const [projectData, setProjectData] = useState(project);
//   const [tasks, setTasks] = useState(initialTasks);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState(null);

//   // Update project after edit
//   const handleProjectSave = (updated) => {
//     setProjectData(updated);
//     setIsEditModalOpen(false);
//   };

//   // Create new task
//   const handleTaskCreate = (newTask) => {
//     console.log("🏷️ handleTaskCreate got:", newTask);

//     setTasks((prev) => [...prev, newTask]);
//     setIsTaskModalOpen(false);
//   };

//   // Update existing task
//   const handleTaskUpdate = (updated) => {
//     setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
//     setIsTaskModalOpen(false);
//     setEditingTask(null);
//   };

//   // Open task modal for edit or new
//   const openTaskModal = (task = null) => {
//     setEditingTask(task);
//     setIsTaskModalOpen(true);
//   };

//   return (
//     <div className={styles.container}>
//       <header className={styles.header}>
//         <h1>{projectData.name}</h1>
//         <div className={styles.actions}>
//           <button
//             className={styles.editProject}
//             onClick={() => setIsEditModalOpen(true)}
//           >
//             Edit Project
//           </button>
//           <button className={styles.addTask} onClick={() => openTaskModal()}>
//             + Add Task
//           </button>
//         </div>
//       </header>

//       <section className={styles.info}>
//         <p>{projectData.description}</p>
//         <p>Start: {new Date(projectData.start_date).toLocaleDateString()}</p>
//         <p>End: {new Date(projectData.end_date).toLocaleDateString()}</p>
//         <p>Status: {projectData.status}</p>
//       </section>

//       <section className={styles.tasks}>
//         {tasks.map((task) => (
//           <TaskCard
//             key={task.id}
//             task={task}
//             onCheck={() => {} /* implement complete toggle later */}
//             onClick={() => openTaskModal(task)}
//           />
//         ))}
//       </section>

//       <AddProjectModal
//         isOpen={isEditModalOpen}
//         onClose={() => setIsEditModalOpen(false)}
//         onCreate={handleProjectSave}
//         initialData={projectData}
//       />

//       <AddTaskModal
//         isOpen={isTaskModalOpen}
//         onClose={() => setIsTaskModalOpen(false)}
//         onCreate={handleTaskCreate}
//         onUpdate={handleTaskUpdate}
//         initialData={editingTask}
//         projectId={projectData.id}
//       />
//     </div>
//   );
// }
// src/components/ProjectDetail.js
"use client";
import { useState } from "react";
import AddProjectModal from "./AddProjectModal";
import AddTaskModal from "./AddTaskModal";
import TaskCard from "./TaskCard";
import styles from "./ProjectDetail.module.css";
import { useTasks } from "@/context/TasksContext";

export default function ProjectDetail({ project, initialTasks }) {
  const [projectData, setProjectData] = useState(project);
  const [tasks, setTasks] = useState(initialTasks);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Pull in global context so Home page stays in sync
  const { addTask, updateTask: updateTaskCtx } = useTasks();

  // Update project after edit
  const handleProjectSave = (updated) => {
    setProjectData(updated);
    setIsEditModalOpen(false);
  };

  // Create new task (update local list AND global context)
  const handleTaskCreate = (newTask) => {
    // Update this page's local state
    setTasks((prev) => [...prev, newTask]);

    // Update global context so Home page reflects the new task immediately
    // (POST now returns the same shape as GET, including instances[0] for recurring)
    addTask(newTask);

    setIsTaskModalOpen(false);
  };

  // Update existing task (keep local + global in sync)
  const handleTaskUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    // Also update global context so the main list reflects edits right away
    updateTaskCtx(updated);

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Open task modal for edit or new
  const openTaskModal = (task = null) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{projectData.name}</h1>
        <div className={styles.actions}>
          <button
            className={styles.editProject}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Project
          </button>
          <button className={styles.addTask} onClick={() => openTaskModal()}>
            + Add Task
          </button>
        </div>
      </header>

      <section className={styles.info}>
        <p>{projectData.description}</p>
        <p>Start: {new Date(projectData.start_date).toLocaleDateString()}</p>
        <p>End: {new Date(projectData.end_date).toLocaleDateString()}</p>
        <p>Status: {projectData.status}</p>
      </section>

      <section className={styles.tasks}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onCheck={() => {} /* implement complete toggle later */}
            onClick={() => openTaskModal(task)}
          />
        ))}
      </section>

      <AddProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onCreate={handleProjectSave}
        initialData={projectData}
      />

      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreate={handleTaskCreate}
        onUpdate={handleTaskUpdate}
        initialData={editingTask}
        projectId={projectData.id}
      />
    </div>
  );
}
