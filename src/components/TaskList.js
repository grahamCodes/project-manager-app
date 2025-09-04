// // src/components/TaskList.js
// "use client";

// import { useState, useMemo } from "react";
// import TaskCard from "./TaskCard";
// import TaskModal from "./TaskModal";
// import TaskFilterModal from "./TaskFilterModal";
// import styles from "./TaskList.module.css";
// import { useTasks } from "@/context/TasksContext";
// import useTaskFilters from "@/hooks/useTaskFilters";

// export default function TaskList({ initialCount, moreCount }) {
//   const { tasks, loading, error, updateTask } = useTasks();
//   const {
//     filters,
//     setFilters,
//     resetFilters,
//     normalizeStatus,
//     filterByDueDate: _filterByDueDate,
//     sortByCreatedDate,
//   } = useTaskFilters();

//   const [modalTask, setModalTask] = useState(null);
//   const [displayCount, setDisplayCount] = useState(initialCount);
//   const [showFilter, setShowFilter] = useState(false);

//   // Derive the display status & due date for a task
//   const getDisplayStatus = (task) => {
//     const inst = task.instances?.[0];
//     return task.is_recurring && inst ? inst.status : task.status;
//   };
//   const getDisplayDueDate = (task) => {
//     const inst = task.instances?.[0];
//     return task.is_recurring && inst ? inst.due_date : task.due_date;
//   };

//   // Filters
//   const filterByStatus = (task) => {
//     const key = normalizeStatus(getDisplayStatus(task));
//     return filters.status[key] ?? true;
//   };
//   const filterBySearch = (task) => {
//     const text = filters.searchText.trim().toLowerCase();
//     return (
//       text === "" ||
//       task.name.toLowerCase().includes(text) ||
//       (task.description || "").toLowerCase().includes(text)
//     );
//   };
//   const filterByProject = (task) =>
//     filters.projects.length === 0 || filters.projects.includes(task.project.id);
//   const filterByDueDate = (task) => {
//     // Reuse your hook but pass in the derived due date
//     return _filterByDueDate({ ...task, due_date: getDisplayDueDate(task) });
//   };

//   // apply filters → sort → paginate
//   const displayedTasks = useMemo(() => {
//     return sortByCreatedDate(
//       tasks
//         .filter(filterByStatus)
//         .filter(filterBySearch)
//         .filter(filterByProject)
//         .filter(filterByDueDate)
//     ).slice(0, displayCount);
//   }, [tasks, filters, displayCount]);

//   const hasMore = displayCount < tasks.length;

//   const handleCheckboxChange = async (id) => {
//     const task = tasks.find((t) => t.id === id);
//     const newStatus =
//       getDisplayStatus(task) === "Complete" ? "In Progress" : "Complete";
//     try {
//       const res = await fetch(`/api/tasks/${id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...task, status: newStatus }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to update task");
//       updateTask(data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   if (loading) return <p className={styles.loading}>Loading tasks…</p>;
//   if (error) return <p className={styles.error}>{error}</p>;

//   return (
//     <>
//       <div className={styles.toolbar}>
//         <button
//           className={styles.filterButton}
//           onClick={() => setShowFilter(true)}
//         >
//           Filter
//         </button>
//       </div>

//       <TaskFilterModal
//         isOpen={showFilter}
//         onClose={() => setShowFilter(false)}
//         filters={filters}
//         setFilters={setFilters}
//         resetFilters={resetFilters}
//         tasks={tasks}
//       />

//       {displayedTasks.length === 0 ? (
//         <p className={styles.empty}>No tasks found</p>
//       ) : (
//         <div className={styles.list}>
//           {displayedTasks.map((task) => (
//             <TaskCard
//               key={task.id}
//               task={task}
//               onCheck={() => handleCheckboxChange(task.id)}
//               onClick={() => setModalTask(task)}
//             />
//           ))}
//         </div>
//       )}

//       {modalTask && (
//         <TaskModal
//           task={modalTask}
//           onClose={() => setModalTask(null)}
//           onUpdate={(updated) => {
//             updateTask(updated);
//             setModalTask(updated);
//           }}
//         />
//       )}

//       <div className={styles.loadMoreContainer}>
//         {hasMore ? (
//           <button
//             className={styles.loadMoreButton}
//             onClick={() => setDisplayCount((c) => c + moreCount)}
//           >
//             + Add More Tasks
//           </button>
//         ) : (
//           <p className={styles.noMore}>No more tasks</p>
//         )}
//       </div>
//     </>
//   );
// }
// src/components/TaskList.js
"use client";

import { useMemo, useState } from "react";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import styles from "./TaskList.module.css";
import { useTasks } from "@/context/TasksContext";

export default function TaskList({ initialCount, moreCount, timezone }) {
  const { tasks, loading, error, updateTask } = useTasks();

  // Tabs
  const [activeTab, setActiveTab] = useState("todo"); // 'todo' | 'done'
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [modalTask, setModalTask] = useState(null);

  // === Helpers to read the "display" fields (instance-first for recurring) ===
  const getInst = (task) => task.instances?.[0];
  const isRecurring = (task) => Boolean(task.is_recurring || task.recurrence);

  const getDisplayStatus = (task) => {
    const inst = getInst(task);
    return isRecurring(task) && inst ? inst.status : task.status;
  };
  const getDisplayDueDate = (task) => {
    const inst = getInst(task);
    return isRecurring(task) && inst ? inst.due_date : task.due_date;
  };
  const getDisplayCompletedAt = (task) => {
    const inst = getInst(task);
    return isRecurring(task) && inst ? inst.completed_at : task.completed_at;
  };

  // === "Today" window (for now: use device-local day; tz wiring later) ===
  // If you want to switch to fixed offsets (UTC/EST/KST), we'll just swap this impl.
  const isToday = (isoString) => {
    if (!isoString) return false;
    try {
      const d = new Date(isoString);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  // === Filtering per tab ===
  const todoTasks = useMemo(() => {
    return tasks.filter((t) => getDisplayStatus(t) === "In Progress");
  }, [tasks]);

  const doneTodayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const status = getDisplayStatus(t);
      if (status !== "Complete") return false;
      const ca = getDisplayCompletedAt(t);
      return isToday(ca);
    });
  }, [tasks]);

  // === Slice for To-Do ===
  const todoSlice = useMemo(() => {
    return todoTasks.slice(0, displayCount);
  }, [todoTasks, displayCount]);
  const hasMore = activeTab === "todo" && displayCount < todoTasks.length;

  // === Toggle checkbox ===
  const handleCheckboxChange = async (task) => {
    const current = getDisplayStatus(task);
    const newStatus = current === "Complete" ? "In Progress" : "Complete";

    // Build a minimal payload that keeps due_date aligned with the display (instance for recurring)
    const payload = {
      name: task.name,
      description: task.description || null,
      status: newStatus,
      due_date: new Date(getDisplayDueDate(task)).toISOString(),
      priority: task.priority ?? 0,
      recurrence: task.recurrence || null,
    };

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      updateTask(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className={styles.loading}>Loading tasks…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const currentList = activeTab === "todo" ? todoSlice : doneTodayTasks;
  const emptyText =
    activeTab === "todo" ? "No tasks in progress" : "No tasks completed today";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {currentList.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          <div className={styles.list}>
            {currentList.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onCheck={() => handleCheckboxChange(task)}
                onClick={() => setModalTask(task)}
              />
            ))}
          </div>
        )}

        {activeTab === "todo" && (
          <div className={styles.loadMoreContainer}>
            {hasMore ? (
              <button
                className={styles.loadMoreButton}
                onClick={() => setDisplayCount((c) => c + moreCount)}
              >
                + Add More Tasks
              </button>
            ) : (
              <p className={styles.noMore}>No more tasks</p>
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "todo" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("todo")}
        >
          To-Do
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "done" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("done")}
        >
          Done Today
        </button>
      </div>

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onUpdate={(updated) => {
            updateTask(updated);
            setModalTask(updated);
          }}
        />
      )}
    </div>
  );
}
