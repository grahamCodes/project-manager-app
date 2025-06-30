// src/app/projects/[projectId]/page.js

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import ProjectDetail from "@/components/ProjectDetail";

export default async function ProjectPage({ params }) {
  // Authenticate
  const token = cookies().get("token")?.value;
  let userId;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    // Redirect to login if not authenticated
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>
          You must <a href="/login">log in</a> to view this project.
        </p>
      </main>
    );
  }

  // Fetch project
  const project = await prisma.project.findFirst({
    where: { id: params.projectId, user_id: userId, deleted_at: null },
  });

  if (!project) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Project not found.</p>
      </main>
    );
  }
  const serializable = {
    ...project,
    start_date: project.start_date.toISOString(),
    end_date: project.end_date.toISOString(),
  };

  // Fetch tasks for this project
  const tasks = await prisma.task.findMany({
    where: { project_id: project.id, deleted_at: null },
    orderBy: [{ due_date: "asc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
    },
  });

  return <ProjectDetail project={serializable} initialTasks={tasks} />;
}
