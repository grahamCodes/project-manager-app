// // src/app/projects/page.js
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import ProjectsList from "@/components/ProjectsList";
// import { Suspense } from "react";

// export default async function ProjectsPage() {
//   // Authenticate on server
//   const token = cookies().get("token")?.value;
//   let userId = null;
//   try {
//     const payload = verifyToken(token);
//     userId = payload.sub;
//   } catch {
//     // Not authenticated; redirect to login or show message
//     return (
//       <main
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//         }}
//       >
//         <p>
//           You must <a href="/login">log in</a> to view projects.
//         </p>
//       </main>
//     );
//   }

//   // Fetch projects for the user
//   const projects = await prisma.project.findMany({
//     where: { user_id: userId, deleted_at: null },
//     orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
//   });

//   return (
//     <main style={{ padding: "2rem" }}>
//       <h1>Your Projects</h1>
//       <Suspense
//         fallback={<p style={{ textAlign: "center" }}>Loading projects...</p>}
//       >
//         <ProjectsList initialProjects={projects} />
//       </Suspense>
//     </main>
//   );
// }
// src/app/projects/page.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import ProjectsList from "@/components/ProjectsList";
import { Suspense } from "react";

export default async function ProjectsPage() {
  // Authenticate on server
  const token = cookies().get("token")?.value;
  let userId = null;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    // Not authenticated; redirect to login or show message
    return (
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>
          You must <a href="/login">log in</a> to view projects.
        </p>
      </main>
    );
  }

  // Fetch projects for the user, sorted by end_date (soonest first)
  const projects = await prisma.project.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: [{ end_date: "asc" }],
  });

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Your Projects</h1>
      <Suspense
        fallback={<p style={{ textAlign: "center" }}>Loading projects...</p>}
      >
        <ProjectsList initialProjects={projects} />
      </Suspense>
    </main>
  );
}
