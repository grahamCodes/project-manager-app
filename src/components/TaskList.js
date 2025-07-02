// // src/components/TaskList.js
// "use client";

// import { useState } from "react";
// import TaskCard from "./TaskCard";
// import TaskModal from "./TaskModal";
// import styles from "./TaskList.module.css";

// export default function TaskList({ initialTasks }) {
//   const [tasks, setTasks] = useState(initialTasks);
//   const [modalTask, setModalTask] = useState(null);

//   // Handler to mark a task as completed (immediately strikes through)
//   const handleCheckboxChange = (id) => {
//     setTasks((prev) =>
//       prev.map((task) =>
//         task.id === id ? { ...task, status: "Complete" } : task
//       )
//     );
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
//     </>
//   );
// }
// src/components/TaskList.js
"use client";

import { useState } from "react";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import styles from "./TaskList.module.css";

export default function TaskList({ initialTasks, moreCount }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [modalTask, setModalTask] = useState(null);
  const [skip, setSkip] = useState(initialTasks.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Handler to mark a task as completed (immediately strikes through)
  const handleCheckboxChange = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: "Complete" } : task
      )
    );
  };

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?skip=${skip}&take=${moreCount}`);
      if (!res.ok) throw new Error("Failed to load more tasks");
      const newTasks = await res.json();

      if (newTasks.length < moreCount) {
        setHasMore(false);
      }

      setTasks((prev) => [...prev, ...newTasks]);
      setSkip((prev) => prev + newTasks.length);
    } catch (err) {
      console.error(err);
      // you could optionally show an error message here
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {tasks.length === 0 ? (
        <p className={styles.empty}>No Tasks for today</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
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
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setModalTask(updated);
          }}
        />
      )}

      <div className={styles.loadMoreContainer}>
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : hasMore ? (
          <button
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loading}
          >
            + Add More Tasks
          </button>
        ) : (
          <p className={styles.noMore}>No more tasks</p>
        )}
      </div>
    </>
  );
}
