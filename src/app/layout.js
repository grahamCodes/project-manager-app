// // src/app/layout.js
// import "./globals.css";
// import Header from "@/components/Header";
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import { TasksProvider } from "@/context/TasksContext";

// export const metadata = {
//   title: "Project Manager App",
//   description: "Manage your projects and tasks seamlessly",
// };

// export default async function RootLayout({ children }) {
//   let projects = [];
//   let theme = "light";
//   let loggedIn = false;
//   let initialTasks = [];
//   let limit = 6;

//   try {
//     // 1) Read & verify JWT
//     const store = await cookies();
//     const token = store.get("token")?.value;
//     const payload = verifyToken(token);
//     const userId = payload.sub;

//     // 2) Load header data
//     projects = await prisma.project.findMany({
//       where: { user_id: userId, status: { not: "Complete" } },
//       orderBy: { end_date: "asc" },
//     });

//     // 3) Load user settings
//     const settings = await prisma.settings.findUnique({
//       where: { user_id: userId },
//     });
//     theme = settings?.theme ?? "light";
//     limit = settings?.tasks_per_day ?? limit;
//     loggedIn = true;

//     // 4) Fetch initial tasks slice for SSR hydration
//     const tasksSlice = await prisma.task.findMany({
//       where: { deleted_at: null, project: { user_id: userId } },
//       orderBy: { due_date: "asc" },
//       take: limit,
//       include: { project: { select: { id: true, name: true, color: true } } },
//     });
//     initialTasks = tasksSlice.map((t) => ({
//       ...t,
//       due_date: t.due_date.toISOString(),
//       created_at: t.created_at.toISOString(),
//       updated_at: t.updated_at.toISOString(),
//       project: {
//         id: t.project.id,
//         name: t.project.name,
//         color: t.project.color,
//       },
//     }));
//   } catch (err) {
//     // not authenticated — render public layout
//   }

//   return (
//     <html lang="en" data-theme={theme}>
//       <body>
//         {loggedIn ? (
//           <TasksProvider initialTasks={initialTasks}>
//             <Header projects={projects} />
//             <main style={{ paddingTop: "4rem" }}>{children}</main>
//           </TasksProvider>
//         ) : (
//           <main style={{ paddingTop: 0 }}>{children}</main>
//         )}
//       </body>
//     </html>
//   );
// }
// src/app/layout.js
import "./globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { TasksProvider } from "@/context/TasksContext";
import { ProjectsProvider } from "@/context/ProjectsContext";

export const metadata = {
  title: "Project Manager App",
  description: "Manage your projects and tasks seamlessly",
};

export default async function RootLayout({ children }) {
  let theme = "light";
  let loggedIn = false;
  let initialTasks = [];
  let limit = 6;
  let initialProjects = [];

  try {
    // 1) Read & verify JWT
    const store = await cookies();
    const token = store.get("token")?.value;
    const payload = verifyToken(token);
    const userId = payload.sub;

    // 2) Load ALL projects for ProjectsContext SSR seed (exclude deleted)
    initialProjects = await prisma.project.findMany({
      where: { user_id: userId, deleted_at: null },
      orderBy: { end_date: "asc" },
    });

    // 3) Load user settings
    const settings = await prisma.settings.findUnique({
      where: { user_id: userId },
    });
    theme = settings?.theme ?? "light";
    limit = settings?.tasks_per_day ?? limit;
    loggedIn = true;

    // 4) Fetch initial tasks slice for SSR hydration
    const tasksSlice = await prisma.task.findMany({
      where: { deleted_at: null, project: { user_id: userId } },
      orderBy: { due_date: "asc" },
      take: limit,
      include: { project: { select: { id: true, name: true, color: true } } },
    });
    initialTasks = tasksSlice.map((t) => ({
      ...t,
      due_date: t.due_date.toISOString(),
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
      project: {
        id: t.project.id,
        name: t.project.name,
        color: t.project.color,
      },
    }));
  } catch (err) {
    // not authenticated — render public layout
  }

  return (
    <html lang="en" data-theme={theme}>
      <body>
        {loggedIn ? (
          <ProjectsProvider initialProjects={initialProjects}>
            <TasksProvider initialTasks={initialTasks}>
              <Header />
              <main style={{ paddingTop: "4rem" }}>{children}</main>
            </TasksProvider>
          </ProjectsProvider>
        ) : (
          <main style={{ paddingTop: 0 }}>{children}</main>
        )}
      </body>
    </html>
  );
}
