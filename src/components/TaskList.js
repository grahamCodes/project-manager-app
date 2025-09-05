// // src/components/TaskList.js
// "use client";

// import { useMemo, useState } from "react";
// import TaskCard from "./TaskCard";
// import TaskModal from "./TaskModal";
// import styles from "./TaskList.module.css";
// import { useTasks } from "@/context/TasksContext";

// export default function TaskList({ initialCount, moreCount, timezone }) {
//   const { tasks, loading, error, updateTask } = useTasks();

//   // Tabs
//   const [activeTab, setActiveTab] = useState("todo"); // 'todo' | 'done'
//   const [displayCount, setDisplayCount] = useState(initialCount);
//   const [modalTask, setModalTask] = useState(null);

//   // === Helpers to read the "display" fields (instance-first for recurring) ===
//   const getInst = (task) => task.instances?.[0];
//   const isRecurring = (task) => Boolean(task.is_recurring || task.recurrence);

//   const getDisplayStatus = (task) => {
//     const inst = getInst(task);
//     return isRecurring(task) && inst ? inst.status : task.status;
//   };
//   const getDisplayDueDate = (task) => {
//     const inst = getInst(task);
//     return isRecurring(task) && inst ? inst.due_date : task.due_date;
//   };
//   const getDisplayCompletedAt = (task) => {
//     const inst = getInst(task);
//     return isRecurring(task) && inst ? inst.completed_at : task.completed_at;
//   };

//   // === "Today" window (for now: use device-local day; tz wiring later) ===
//   // If you want to switch to fixed offsets (UTC/EST/KST), we'll just swap this impl.
//   const isToday = (isoString) => {
//     if (!isoString) return false;
//     try {
//       const d = new Date(isoString);
//       const now = new Date();
//       return (
//         d.getFullYear() === now.getFullYear() &&
//         d.getMonth() === now.getMonth() &&
//         d.getDate() === now.getDate()
//       );
//     } catch {
//       return false;
//     }
//   };

//   // === Filtering per tab ===
//   const todoTasks = useMemo(() => {
//     return tasks.filter((t) => getDisplayStatus(t) === "In Progress");
//   }, [tasks]);

//   const doneTodayTasks = useMemo(() => {
//     return tasks.filter((t) => {
//       const status = getDisplayStatus(t);
//       if (status !== "Complete") return false;
//       const ca = getDisplayCompletedAt(t);
//       return isToday(ca);
//     });
//   }, [tasks]);

//   // === Slice for To-Do ===
//   const todoSlice = useMemo(() => {
//     return todoTasks.slice(0, displayCount);
//   }, [todoTasks, displayCount]);
//   const hasMore = activeTab === "todo" && displayCount < todoTasks.length;

//   // === Toggle checkbox ===
//   const handleCheckboxChange = async (task) => {
//     const current = getDisplayStatus(task);
//     const newStatus = current === "Complete" ? "In Progress" : "Complete";

//     // Build a minimal payload that keeps due_date aligned with the display (instance for recurring)
//     const payload = {
//       name: task.name,
//       description: task.description || null,
//       status: newStatus,
//       due_date: new Date(getDisplayDueDate(task)).toISOString(),
//       priority: task.priority ?? 0,
//       recurrence: task.recurrence || null,
//     };

//     try {
//       const res = await fetch(`/api/tasks/${task.id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
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

//   const currentList = activeTab === "todo" ? todoSlice : doneTodayTasks;
//   const emptyText =
//     activeTab === "todo" ? "No tasks in progress" : "No tasks completed today";

//   return (
//     <div className={styles.container}>
//       <div className={styles.content}>
//         {currentList.length === 0 ? (
//           <p className={styles.empty}>{emptyText}</p>
//         ) : (
//           <div className={styles.list}>
//             {currentList.map((task) => (
//               <TaskCard
//                 key={task.id}
//                 task={task}
//                 onCheck={() => handleCheckboxChange(task)}
//                 onClick={() => setModalTask(task)}
//               />
//             ))}
//           </div>
//         )}

//         {activeTab === "todo" && (
//           <div className={styles.loadMoreContainer}>
//             {hasMore ? (
//               <button
//                 className={styles.loadMoreButton}
//                 onClick={() => setDisplayCount((c) => c + moreCount)}
//               >
//                 + Add More Tasks
//               </button>
//             ) : (
//               <p className={styles.noMore}>No more tasks</p>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Fixed bottom tabs */}
//       <div className={styles.tabBar}>
//         <button
//           className={`${styles.tabButton} ${
//             activeTab === "todo" ? styles.tabActive : ""
//           }`}
//           onClick={() => setActiveTab("todo")}
//         >
//           To-Do
//         </button>
//         <button
//           className={`${styles.tabButton} ${
//             activeTab === "done" ? styles.tabActive : ""
//           }`}
//           onClick={() => setActiveTab("done")}
//         >
//           Done Today
//         </button>
//       </div>

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
//     </div>
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

  // Track in-flight toggles per task id to prevent rapid double-updates
  const [pendingToggle, setPendingToggle] = useState(() => new Set());

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

  // === "Today" window (device-local day for now) ===
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

  // === Toggle both ways (Complete ⇄ In Progress), confirmed after server ===
  const handleCheckboxChange = async (task) => {
    if (pendingToggle.has(task.id)) return; // guard repeated taps on same task

    try {
      // lock
      setPendingToggle((prev) => new Set(prev).add(task.id));

      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
        keepalive: true,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        /* ignore non-JSON */
      }

      if (!res.ok) {
        const msg = (data && data.error) || "Failed to toggle task";
        throw new Error(msg);
      }

      // server truth
      updateTask(data);
    } catch (err) {
      console.error("Toggle failed:", err);
      // (Optional) show a toast here
    } finally {
      // unlock
      setPendingToggle((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
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
                disabled={pendingToggle.has(task.id)}
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
