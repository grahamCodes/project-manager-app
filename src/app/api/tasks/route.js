// // src/app/api/tasks/route.js
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/auth";

// export async function GET(request) {
//   const { sub: userId } = requireAuth(request);

//   const tasks = await prisma.task.findMany({
//     where: { deleted_at: null, project: { user_id: userId } },

//     orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
//     include: {
//       project: {
//         select: { id: true, name: true, color: true },
//       },
//     },
//   });
//   return NextResponse.json(tasks);
// }

// export async function POST(request) {
//   const { sub: userId } = requireAuth(request);
//   try {
//     const raw = await request.json();

//     const project_id = raw.project_id;
//     const name = raw.name;
//     const description = raw.description ?? null;
//     const due_date = raw.due_date;
//     const status = raw.status;
//     const is_recurring = Boolean(raw.is_recurring);
//     const repeat_days =
//       raw.repeat_days != null ? Number(raw.repeat_days) : null;
//     const priority = Number(raw.priority) || 0;

//     // Validate required fields
//     if (!project_id || !name || !due_date || !status) {
//       return NextResponse.json(
//         { error: "Missing required task fields" },
//         { status: 400 }
//       );
//     }

//     // Validate due_date
//     const due = new Date(due_date);
//     if (isNaN(due)) {
//       return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
//     }

//     // Verify project belongs to user
//     const project = await prisma.project.findFirst({
//       where: { id: project_id, user_id: userId, deleted_at: null },
//     });
//     if (!project) {
//       return NextResponse.json(
//         { error: "Project not found or not authorized" },
//         { status: 404 }
//       );
//     }

//     // If recurring, repeat_days must be > 0
//     if (is_recurring && (!repeat_days || repeat_days <= 0)) {
//       return NextResponse.json(
//         { error: "repeat_days must be a positive number for recurring tasks" },
//         { status: 400 }
//       );
//     }

//     // Create the task
//     const task = await prisma.task.create({
//       data: {
//         project_id,
//         name,
//         description,
//         due_date: due,
//         status,
//         is_recurring,
//         repeat_days,
//         priority,
//       },
//       include: {
//         project: { select: { id: true, name: true, color: true } },
//       },
//     });

//     return NextResponse.json(task, { status: 201 });
//   } catch (error) {
//     console.error("Error creating task:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/tasks/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { sub: userId } = requireAuth(request);
  const { searchParams } = new URL(request.url);

  // Parse optional pagination params
  const skipParam = searchParams.get("skip");
  const takeParam = searchParams.get("take");
  const skip = skipParam !== null ? parseInt(skipParam, 10) : undefined;
  const take = takeParam !== null ? parseInt(takeParam, 10) : undefined;

  // Build query options
  const options = {
    where: { deleted_at: null, project: { user_id: userId } },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
    },
  };
  if (skip !== undefined) options.skip = skip;
  if (take !== undefined) options.take = take;

  const tasks = await prisma.task.findMany(options);
  return NextResponse.json(tasks);
}

export async function POST(request) {
  const { sub: userId } = requireAuth(request);
  try {
    const raw = await request.json();

    const project_id = raw.project_id;
    const name = raw.name;
    const description = raw.description ?? null;
    const due_date = raw.due_date;
    const status = raw.status;
    const is_recurring = Boolean(raw.is_recurring);
    const repeat_days =
      raw.repeat_days != null ? Number(raw.repeat_days) : null;
    const priority = Number(raw.priority) || 0;

    // Validate required fields
    if (!project_id || !name || !due_date || !status) {
      return NextResponse.json(
        { error: "Missing required task fields" },
        { status: 400 }
      );
    }

    // Validate due_date
    const due = new Date(due_date);
    if (isNaN(due)) {
      return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: project_id, user_id: userId, deleted_at: null },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not authorized" },
        { status: 404 }
      );
    }

    // If recurring, repeat_days must be > 0
    if (is_recurring && (!repeat_days || repeat_days <= 0)) {
      return NextResponse.json(
        { error: "repeat_days must be a positive number for recurring tasks" },
        { status: 400 }
      );
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        project_id,
        name,
        description,
        due_date: due,
        status,
        is_recurring,
        repeat_days,
        priority,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
