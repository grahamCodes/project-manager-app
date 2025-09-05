// // }// src/app/(protected)/projects/page.js
// import prisma from "@/lib/prisma";
// import ProjectsList from "@/components/ProjectsList";
// import { Suspense } from "react";
// import { requireAuth } from "@/lib/auth";

// export default async function ProjectsPage() {
//   // 1) This will throw/redirect if not authenticated
//   const { sub: userId } = await requireAuth();

//   // 2) Fetch only this user’s projects
//   const projects = await prisma.project.findMany({
//     where: { user_id: userId, deleted_at: null },
//     orderBy: [{ end_date: "asc" }],
//   });

//   // 3) Render
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
// src/app/(protected)/projects/page.js
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import ProjectsList from "@/components/ProjectsList";

export default async function ProjectsPage() {
  // Ensure authenticated (throws/redirects if not)
  await requireAuth();

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ textAlign: "center" }}>Your Projects</h1>
      <Suspense
        fallback={<p style={{ textAlign: "center" }}>Loading projects...</p>}
      >
        <ProjectsList />
      </Suspense>
    </main>
  );
}
