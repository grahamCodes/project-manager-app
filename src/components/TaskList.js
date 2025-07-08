// // src/components/TaskList.js
// "use client";

// import { useState } from "react";
// import TaskCard from "./TaskCard";
// import TaskModal from "./TaskModal";
// import styles from "./TaskList.module.css";

// export default function TaskList({ initialTasks, moreCount }) {
//   const [tasks, setTasks] = useState(initialTasks);
//   const [modalTask, setModalTask] = useState(null);
//   const [skip, setSkip] = useState(initialTasks.length);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);

//   // Handler to mark a task as completed (immediately strikes through)
//   const handleCheckboxChange = (id) => {
//     setTasks((prev) =>
//       prev.map((task) =>
//         task.id === id ? { ...task, status: "Complete" } : task
//       )
//     );
//   };

//   const loadMore = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/tasks?skip=${skip}&take=${moreCount}`);
//       if (!res.ok) throw new Error("Failed to load more tasks");
//       const newTasks = await res.json();

//       if (newTasks.length < moreCount) {
//         setHasMore(false);
//       }

//       setTasks((prev) => [...prev, ...newTasks]);
//       setSkip((prev) => prev + newTasks.length);
//     } catch (err) {
//       console.error(err);
//       // you could optionally show an error message here
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       {tasks.length === 0 ? (
//         <p className={styles.empty}>No Tasks for today</p>
//       ) : (
//         <div className={styles.list}>
//           {tasks.map((task) => (
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
//             setTasks((prev) =>
//               prev.map((t) => (t.id === updated.id ? updated : t))
//             );
//             setModalTask(updated);
//           }}
//         />
//       )}

//       <div className={styles.loadMoreContainer}>
//         {loading ? (
//           <p className={styles.loading}>Loading…</p>
//         ) : hasMore ? (
//           <button
//             className={styles.loadMoreButton}
//             onClick={loadMore}
//             disabled={loading}
//           >
//             + Add More Tasks
//           </button>
//         ) : (
//           <p className={styles.noMore}>No more tasks</p>
//         )}
//       </div>
//     </>
//   );
// Memoize displayedTasks

// Wrap tasks.slice(0, displayCount) in useMemo to avoid recalculations on unrelated renders.

// Debounce loadMore

// Prevent rapid multiple clicks by disabling the button while incrementing or by throttling.

// Optimistic UI for status toggles

// Update the task state immediately before the API call, then roll back on error for snappier feedback.

// Accessibility enhancements

// Add ARIA labels to the “Add More Tasks” button and ensure keyboard operability.

// Infinite scroll option

// Replace the button with an intersection-observer–driven loadMore for a smoother UX.

// src/components/TaskList.js
"use client";

import { useState, useMemo } from "react";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import TaskFilterModal from "./TaskFilterModal";
import styles from "./TaskList.module.css";
import { useTasks } from "@/context/TasksContext";
import useTaskFilters from "@/hooks/useTaskFilters";

export default function TaskList({ initialCount, moreCount }) {
  const { tasks, loading, error, updateTask } = useTasks();
  const {
    filters,
    setFilters,
    resetFilters,
    normalizeStatus,
    filterByDueDate,
    sortByCreatedDate,
  } = useTaskFilters();

  const [modalTask, setModalTask] = useState(null);
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [showFilter, setShowFilter] = useState(false);

  const filterByStatus = (task) => {
    const key = normalizeStatus(task.status);
    return filters.status[key] ?? true;
  };

  const filterBySearch = (task) => {
    const text = filters.searchText.trim().toLowerCase();
    return (
      text === "" ||
      task.name.toLowerCase().includes(text) ||
      (task.description || "").toLowerCase().includes(text)
    );
  };

  const filterByProject = (task) => {
    return (
      filters.projects.length === 0 ||
      filters.projects.includes(task.project.id)
    );
  };

  // apply filters
  const filteredTasks = useMemo(
    () =>
      tasks
        .filter(filterByStatus)
        .filter(filterBySearch)
        .filter(filterByProject)
        .filter(filterByDueDate),
    [tasks, filters]
  );

  // then sort by created_at
  const sortedTasks = useMemo(
    () => sortByCreatedDate(filteredTasks),
    [filteredTasks, filters]
  );

  // paginate
  const displayedTasks = sortedTasks.slice(0, displayCount);
  const hasMore = displayCount < sortedTasks.length;

  const handleCheckboxChange = async (id) => {
    const task = tasks.find((t) => t.id === id);
    const newStatus = task.status === "Complete" ? "In Progress" : "Complete";
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      updateTask(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = () => {
    setDisplayCount((prev) => prev + moreCount);
  };

  if (loading) return <p className={styles.loading}>Loading tasks…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <>
      <div className={styles.toolbar}>
        <button
          className={styles.filterButton}
          onClick={() => setShowFilter(true)}
        >
          Filter
        </button>
      </div>

      <TaskFilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        tasks={tasks}
      />

      {displayedTasks.length === 0 ? (
        <p className={styles.empty}>No tasks found</p>
      ) : (
        <div className={styles.list}>
          {displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCheck={() => handleCheckboxChange(task.id)}
              onClick={() => setModalTask(task)}
            />
          ))}
        </div>
      )}

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

      <div className={styles.loadMoreContainer}>
        {hasMore ? (
          <button className={styles.loadMoreButton} onClick={loadMore}>
            + Add More Tasks
          </button>
        ) : (
          <p className={styles.noMore}>No more tasks</p>
        )}
      </div>
    </>
  );
}
