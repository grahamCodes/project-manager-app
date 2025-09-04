// // src/app/api/tasks/route.js

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/auth";

// export async function GET(request) {
//   // 1) Authenticate user
//   let payload;
//   try {
//     payload = await requireAuth();
//   } catch {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   const userId = payload.sub;

//   // 2) Parse pagination params
//   const url = new URL(request.url);
//   const skipParam = url.searchParams.get("skip");
//   const takeParam = url.searchParams.get("take");
//   const skip = skipParam !== null ? parseInt(skipParam, 10) : undefined;
//   const take = takeParam !== null ? parseInt(takeParam, 10) : undefined;

//   // 3) Build query scoped to this user
//   const options = {
//     where: {
//       deleted_at: null,
//       project: { user_id: userId },
//     },
//     orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
//     include: {
//       project: { select: { id: true, name: true, color: true } },
//       recurrence: true,
//       // Include only the latest TaskInstance per task
//       instances: {
//         orderBy: { due_date: "desc" },
//         take: 1,
//       },
//     },
//   };
//   if (skip !== undefined) options.skip = skip;
//   if (take !== undefined) options.take = take;

//   // 4) Fetch and return tasks
//   const tasks = await prisma.task.findMany(options);
//   return NextResponse.json(tasks);
// }

// export async function POST(request) {
//   // authenticate user
//   let payload;
//   try {
//     payload = await requireAuth();
//   } catch {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   const userId = payload.sub;

//   try {
//     // parse body
//     const {
//       project_id,
//       name,
//       description = null,
//       due_date,
//       status,
//       priority = 0,
//       recurrence = null,
//     } = await request.json();

//     // validate required fields
//     if (!project_id || !name || !due_date || !status) {
//       return NextResponse.json(
//         { error: "Missing required task fields" },
//         { status: 400 }
//       );
//     }
//     const due = new Date(due_date);
//     if (isNaN(due)) {
//       return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
//     }

//     // ensure project belongs to user
//     const project = await prisma.project.findFirst({
//       where: { id: project_id, user_id: userId, deleted_at: null },
//     });
//     if (!project) {
//       return NextResponse.json(
//         { error: "Project not found or unauthorized" },
//         { status: 404 }
//       );
//     }

//     // create task + optional recurrence
//     const task = await prisma.task.create({
//       data: {
//         project_id,
//         name,
//         description,
//         due_date: due,
//         status,
//         priority: Number(priority),
//         is_recurring: Boolean(recurrence),
//         recurrence: recurrence
//           ? {
//               create: {
//                 frequency: recurrence.frequency,
//                 interval: recurrence.interval,
//                 by_weekday: recurrence.by_weekday || [],
//                 by_monthday: recurrence.by_monthday || [],
//                 ends_at: recurrence.ends_at || null,
//               },
//             }
//           : undefined,
//       },
//       include: {
//         project: { select: { id: true, name: true, color: true } },
//         recurrence: true,
//       },
//     });

//     // seed initial instance for recurring tasks
//     if (recurrence) {
//       await prisma.taskInstance.create({
//         data: {
//           task_id: task.id,
//           due_date: due,
//           status: "In Progress",
//         },
//       });
//     }

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
  // 1) Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Parse pagination params
  const url = new URL(request.url);
  const skipParam = url.searchParams.get("skip");
  const takeParam = url.searchParams.get("take");
  const skip = skipParam !== null ? parseInt(skipParam, 10) : undefined;
  const take = takeParam !== null ? parseInt(takeParam, 10) : undefined;

  // 3) Build query scoped to this user
  const options = {
    where: {
      deleted_at: null,
      project: { user_id: userId },
    },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
      recurrence: true,
      // Include only the latest TaskInstance per task
      instances: {
        orderBy: { due_date: "desc" },
        take: 1,
      },
    },
  };
  if (skip !== undefined) options.skip = skip;
  if (take !== undefined) options.take = take;

  // 4) Fetch and return tasks
  const tasks = await prisma.task.findMany(options);
  return NextResponse.json(tasks);
}

export async function POST(request) {
  // authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  try {
    // parse body
    const {
      project_id,
      name,
      description = null,
      due_date,
      status,
      priority = 0,
      recurrence = null,
    } = await request.json();

    // validate required fields
    if (!project_id || !name || !due_date || !status) {
      return NextResponse.json(
        { error: "Missing required task fields" },
        { status: 400 }
      );
    }
    const due = new Date(due_date);
    if (isNaN(due)) {
      return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
    }

    // ensure project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: project_id, user_id: userId, deleted_at: null },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create task + optional recurrence + seed instance in a transaction
    const createdTask = await prisma.$transaction(async (tx) => {
      // create task (is_recurring depends on whether a rule is provided)
      const task = await tx.task.create({
        data: {
          project_id,
          name,
          description,
          due_date: due,
          status,
          priority: Number(priority),
          is_recurring: Boolean(recurrence),
          recurrence: recurrence
            ? {
                create: {
                  frequency: recurrence.frequency,
                  interval: recurrence.interval ?? 1,
                  by_weekday: recurrence.by_weekday || [],
                  by_monthday: recurrence.by_monthday || [],
                  ends_at: recurrence.ends_at || null,
                },
              }
            : undefined,
        },
      });

      // seed initial instance for recurring tasks
      if (recurrence) {
        await tx.taskInstance.create({
          data: {
            task_id: task.id,
            due_date: due,
            status: "In Progress",
          },
        });
      }

      // fetch the task back in the SAME SHAPE as GET (includes instances[0])
      const full = await tx.task.findUnique({
        where: { id: task.id },
        include: {
          project: { select: { id: true, name: true, color: true } },
          recurrence: true,
          instances: { orderBy: { due_date: "desc" }, take: 1 },
        },
      });

      return full;
    });

    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
