// // src/app/api/tasks/[taskId]/route.js
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/auth";

// // Helper to determine new project status based on task statuses
// const calculateProjectStatus = (statuses, currentStatus) => {
//   if (statuses.length > 0 && statuses.every((s) => s === "Complete")) {
//     return "Complete";
//   }
//   if (statuses.some((s) => s === "In Progress")) {
//     return "In Progress";
//   }
//   // If project was complete but now has any non-complete tasks, roll back to In Progress
//   if (currentStatus === "Complete") {
//     return "In Progress";
//   }
//   // Otherwise, leave status as-is
//   return currentStatus;
// };

// export async function PUT(request, { params }) {
//   const { sub: userId } = requireAuth(request);
//   const { taskId } = params;

//   const raw = await request.json();
//   const {
//     name,
//     description = null,
//     due_date: dueDateStr,
//     status: newTaskStatus,
//     is_recurring = false,
//     repeat_days: rawRepeatDays = null,
//     priority: rawPriority = 0,
//   } = raw;

//   // Validate fields
//   if (!name || !dueDateStr || !newTaskStatus) {
//     return NextResponse.json(
//       { error: "Missing required task fields" },
//       { status: 400 }
//     );
//   }

//   const dueDate = new Date(dueDateStr);
//   if (isNaN(dueDate)) {
//     return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
//   }

//   const repeat_days = is_recurring ? Number(rawRepeatDays) || null : null;
//   const priority = Number(rawPriority) || 0;

//   try {
//     // Perform an atomic transaction: update task, then recalc+update project
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Fetch existing task to get project_id
//       const existing = await tx.task.findFirst({
//         where: { id: taskId, deleted_at: null, project: { user_id: userId } },
//         select: { project_id: true },
//       });
//       if (!existing) {
//         throw new Error("Task not found or not authorized");
//       }

//       // 2. Update the task
//       const updatedTask = await tx.task.update({
//         where: { id: taskId },
//         data: {
//           name,
//           description,
//           due_date: dueDate,
//           status: newTaskStatus,
//           is_recurring,
//           repeat_days,
//           priority,
//         },
//       });

//       // 3. Fetch all non-deleted task statuses for this project
//       const allTasks = await tx.task.findMany({
//         where: { project_id: existing.project_id, deleted_at: null },
//         select: { status: true },
//       });
//       const statuses = allTasks.map((t) => t.status);

//       // 4. Fetch current project
//       const project = await tx.project.findUnique({
//         where: { id: existing.project_id },
//         select: { status: true },
//       });
//       if (!project) {
//         throw new Error("Project not found");
//       }

//       // 5. Determine new project status
//       const recalculatedStatus = calculateProjectStatus(
//         statuses,
//         project.status
//       );

//       // 6. Update project if status has changed
//       if (recalculatedStatus !== project.status) {
//         await tx.project.update({
//           where: { id: existing.project_id },
//           data: { status: recalculatedStatus },
//         });
//       }

//       // 7. Return the updated task with fresh project info
//       return tx.task.findUnique({
//         where: { id: updatedTask.id },
//         include: { project: { select: { id: true, name: true, color: true } } },
//       });
//     });

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error in transactional task update:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/tasks/[taskId]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const calculateProjectStatus = (statuses, currentStatus) => {
  if (statuses.every((s) => s === "Complete")) return "Complete";
  if (statuses.some((s) => s === "In Progress")) return "In Progress";
  if (currentStatus === "Complete") return "In Progress";
  return currentStatus;
};

export async function PUT(request, { params }) {
  const { taskId } = await params;

  // 1) Auth
  let payload;
  try {
    payload = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Parse body
  const {
    name,
    description = null,
    due_date: dueDateStr,
    status: newStatus,
    priority = 0,
    recurrence = null,
  } = await request.json();

  if (!name || !dueDateStr || !newStatus) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate)) {
    return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
  }

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      // a) verify ownership
      const existing = await tx.task.findFirst({
        where: { id: taskId, deleted_at: null, project: { user_id: userId } },
        select: { project_id: true, is_recurring: true },
      });
      if (!existing) throw new Error("Not authorized or not found");

      // b) update the Task row
      await tx.task.update({
        where: { id: taskId },
        data: {
          name,
          description,
          due_date: dueDate,
          status: newStatus,
          priority: Number(priority),
          // always keep is_recurring in sync
          is_recurring: existing.is_recurring,
          completed_at: newStatus === "Complete" ? new Date() : null,
        },
      });

      // c) upsert/delete the rule if they provided one
      if (recurrence) {
        await tx.recurrenceRule.upsert({
          where: { task_id: taskId },
          create: {
            task_id: taskId,
            frequency: recurrence.frequency,
            interval: recurrence.interval,
            by_weekday: recurrence.by_weekday || [],
            by_monthday: recurrence.by_monthday || [],
            ends_at: recurrence.ends_at || null,
          },
          update: {
            frequency: recurrence.frequency,
            interval: recurrence.interval,
            by_weekday: recurrence.by_weekday || [],
            by_monthday: recurrence.by_monthday || [],
            ends_at: recurrence.ends_at || null,
          },
        });
      } else {
        await tx.recurrenceRule.deleteMany({ where: { task_id: taskId } });
      }

      // d) **NEW**: if task is recurring and now marked complete, update its latest instance
      if (existing.is_recurring && newStatus === "Complete") {
        const latestInstance = await tx.taskInstance.findFirst({
          where: { task_id: taskId },
          orderBy: { due_date: "desc" },
        });
        if (latestInstance && latestInstance.completed_at === null) {
          await tx.taskInstance.update({
            where: { id: latestInstance.id },
            data: { status: "Complete", completed_at: new Date() },
          });
        }
      }

      // e) recalc project status
      const siblingStatuses = (
        await tx.task.findMany({
          where: { project_id: existing.project_id, deleted_at: null },
          select: { status: true },
        })
      ).map((t) => t.status);

      const project = await tx.project.findUnique({
        where: { id: existing.project_id },
        select: { status: true },
      });

      const newProjStatus = calculateProjectStatus(
        siblingStatuses,
        project.status
      );
      if (newProjStatus !== project.status) {
        await tx.project.update({
          where: { id: existing.project_id },
          data: { status: newProjStatus },
        });
      }

      // f) return updated task
      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          project: { select: { id: true, name: true, color: true } },
          recurrence: true,
        },
      });
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
