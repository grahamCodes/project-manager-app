// // src/app/page.js
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import TaskList from "@/components/TaskList";
// import { Suspense } from "react";

// export default async function HomePage() {
//   // Read JWT token from cookies
//   const token = cookies().get("token")?.value;
//   let userId = null;
//   try {
//     const payload = verifyToken(token);
//     userId = payload.sub;
//   } catch {
//     // Not authenticated
//   }

//   // If not logged in, show login/signup
//   if (!userId) {
//     return (
//       <main
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           gap: "1rem",
//         }}
//       >
//         <Link href="/login">
//           <button>Log In</button>
//         </Link>
//         <Link href="/signup">
//           <button>Sign Up</button>
//         </Link>
//       </main>
//     );
//   }

//   // Fetch user settings and top-N tasks
//   const settings = await prisma.settings.findUnique({
//     where: { user_id: userId },
//   });
//   const limit = settings?.tasks_per_day ?? 6;
//   const tasks = await prisma.task.findMany({
//     where: {
//       deleted_at: null,
//       project: { user_id: userId },
//     },
//     orderBy: { due_date: "asc" },
//     take: limit,
//     include: { project: true },
//   });

//   return (
//     <main style={{ padding: "2rem" }}>
//       {/* <h1>My Day</h1> */}
//       <Suspense
//         fallback={<p style={{ textAlign: "center" }}>Loading tasks...</p>}
//       >
//         <TaskList initialTasks={tasks} />
//       </Suspense>
//       <div style={{ textAlign: "center", marginTop: "2rem" }}>
//         <button>+ Add More Tasks</button>
//       </div>
//     </main>
//   );
// }
// src/app/page.js
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import TaskList from "@/components/TaskList";
// import { Suspense } from "react";

// export default async function HomePage() {
//   // Read JWT token from cookies
//   const token = cookies().get("token")?.value;
//   let userId = null;
//   try {
//     const payload = verifyToken(token);
//     userId = payload.sub;
//   } catch {
//     // Not authenticated
//   }

//   // If not logged in, show login/signup
//   if (!userId) {
//     return (
//       <main
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           gap: "1rem",
//         }}
//       >
//         <Link href="/login">
//           <button>Log In</button>
//         </Link>
//         <Link href="/signup">
//           <button>Sign Up</button>
//         </Link>
//       </main>
//     );
//   }

//   // Fetch user settings and top-N tasks
//   const settings = await prisma.settings.findUnique({
//     where: { user_id: userId },
//   });
//   const limit = settings?.tasks_per_day ?? 6;
//   const moreCount = settings?.more_tasks_count ?? 3;

//   const tasks = await prisma.task.findMany({
//     where: {
//       deleted_at: null,
//       project: { user_id: userId },
//     },
//     orderBy: { due_date: "asc" },
//     take: limit,
//     include: { project: true },
//   });

//   return (
//     <main style={{ padding: "2rem" }}>
//       <Suspense
//         fallback={<p style={{ textAlign: "center" }}>Loading tasks...</p>}
//       >
//         <TaskList initialTasks={tasks} moreCount={moreCount} />
//       </Suspense>
//     </main>
//   );

// Next Steps & Suggestions
// Handle unauthenticated layout

// You now rely on the context for tasks; ensure that TaskList gracefully handles when context’s tasks is empty for non-logged-in users (though TaskList is only rendered when logged in).

// Loading state in the list

// Since TasksProvider may still be fetching the full tasks list client-side, consider using its loading flag to show a spinner or skeleton inside TaskList until hydration completes.

// Error handling

// Expose error from useTasks() and surface any fetch failures so users can retry or see error messages.

// Future settings re-fetch

// If you ever want settings to apply without a full reload, you could introduce a SettingsContext similarly to handle live updates of paging values.
// // }// src/app/page.js
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import TaskList from "@/components/TaskList";

// export default async function HomePage() {
//   // 1. Await the cookie store before reading
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   // 2. Try to verify JWT and pull out user ID
//   let userId = null;
//   try {
//     const payload = verifyToken(token);
//     userId = payload.sub;
//   } catch {
//     // not authenticated (missing or invalid token)
//   }

//   // 3. If no user, show login/signup
//   if (!userId) {
//     return (
//       <main
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           gap: "1rem",
//         }}
//       >
//         <Link href="/login">
//           <button>Log In</button>
//         </Link>
//         <Link href="/signup">
//           <button>Sign Up</button>
//         </Link>
//       </main>
//     );
//   }

//   // 4. Fetch paging settings for authenticated user
//   const settings = await prisma.settings.findUnique({
//     where: { user_id: userId },
//     select: { tasks_per_day: true, more_tasks_count: true },
//   });
//   const limit = settings?.tasks_per_day ?? 6;
//   const moreCount = settings?.more_tasks_count ?? 3;

//   // 5. Render the task list with context-managed tasks
//   return (
//     <main style={{ padding: "2rem" }}>
//       <TaskList initialCount={limit} moreCount={moreCount} />
//     </main>
//   );
// }
// src/app/page.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import styles from "./page.module.css";

export default async function HomePage() {
  // 1) Read cookie & verify token (no await needed for cookies())
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let userId = null;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    // unauthenticated
  }

  // 2) If not logged in, render the landing page (hero + auth card)
  if (!userId) {
    return (
      <main className={styles.landing}>
        <section className={styles.hero}>
          <div className={styles.illustrationWrap} aria-hidden="true">
            <img
              src="/progress-512.webp"
              alt=""
              className={styles.illustration}
              loading="eager"
              width="320"
              height="320"
            />
          </div>

          <h1 className={styles.heading}>Make progress, not just lists.</h1>
          <p className={styles.subhead}>
            Organize tasks by project, see what’s next, and keep
            momentum—without the noise.
          </p>

          <div className={styles.ctas}>
            <Link href="/login" className={`${styles.btn} ${styles.primary}`}>
              Log in
            </Link>
            <Link
              href="/signup"
              className={`${styles.btn} ${styles.secondary}`}
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3) Logged-in: fetch paging settings and render TaskList
  const settings = await prisma.settings.findUnique({
    where: { user_id: userId },
    select: { tasks_per_day: true, more_tasks_count: true },
  });

  const limit = settings?.tasks_per_day ?? 6;
  const moreCount = settings?.more_tasks_count ?? 3;

  return (
    <main className={styles.appMain}>
      <TaskList initialCount={limit} moreCount={moreCount} />
    </main>
  );
}
