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
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { Suspense } from "react";

export default async function HomePage() {
  // Read JWT token from cookies
  const token = cookies().get("token")?.value;
  let userId = null;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    // Not authenticated
  }

  // If not logged in, show login/signup
  if (!userId) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <Link href="/login">
          <button>Log In</button>
        </Link>
        <Link href="/signup">
          <button>Sign Up</button>
        </Link>
      </main>
    );
  }

  // Fetch user settings and top-N tasks
  const settings = await prisma.settings.findUnique({
    where: { user_id: userId },
  });
  const limit = settings?.tasks_per_day ?? 6;
  const moreCount = settings?.more_tasks_count ?? 3;

  const tasks = await prisma.task.findMany({
    where: {
      deleted_at: null,
      project: { user_id: userId },
    },
    orderBy: { due_date: "asc" },
    take: limit,
    include: { project: true },
  });

  return (
    <main style={{ padding: "2rem" }}>
      <Suspense
        fallback={<p style={{ textAlign: "center" }}>Loading tasks...</p>}
      >
        <TaskList initialTasks={tasks} moreCount={moreCount} />
      </Suspense>
    </main>
  );
}
