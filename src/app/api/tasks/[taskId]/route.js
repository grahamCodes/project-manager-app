// // src/app/api/tasks/[taskId]/route.js

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/auth";

// const calculateProjectStatus = (statuses, currentStatus) => {
//   if (statuses.every((s) => s === "Complete")) return "Complete";
//   if (statuses.some((s) => s === "In Progress")) return "In Progress";
//   if (currentStatus === "Complete") return "In Progress";
//   return currentStatus;
// };

// export async function PUT(request, { params }) {
//   const { taskId } = await params;

//   // 1) Auth
//   let payload;
//   try {
//     payload = await requireAuth();
//   } catch {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   const userId = payload.sub;

//   // 2) Parse body
//   const {
//     name,
//     description = null,
//     due_date: dueDateStr,
//     status: newStatus,
//     priority = 0,
//     recurrence = null,
//   } = await request.json();

//   if (!name || !dueDateStr || !newStatus) {
//     return NextResponse.json(
//       { error: "Missing required fields" },
//       { status: 400 }
//     );
//   }
//   const dueDate = new Date(dueDateStr);
//   if (isNaN(dueDate)) {
//     return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
//   }

//   try {
//     const updatedTask = await prisma.$transaction(async (tx) => {
//       // a) verify ownership
//       const existing = await tx.task.findFirst({
//         where: { id: taskId, deleted_at: null, project: { user_id: userId } },
//         select: { project_id: true, is_recurring: true },
//       });
//       if (!existing) throw new Error("Not authorized or not found");

//       // b) update the Task row
//       await tx.task.update({
//         where: { id: taskId },
//         data: {
//           name,
//           description,
//           due_date: dueDate,
//           status: newStatus,
//           priority: Number(priority),
//           // always keep is_recurring in sync
//           is_recurring: existing.is_recurring,
//           completed_at: newStatus === "Complete" ? new Date() : null,
//         },
//       });

//       // c) upsert/delete the rule if they provided one
//       if (recurrence) {
//         await tx.recurrenceRule.upsert({
//           where: { task_id: taskId },
//           create: {
//             task_id: taskId,
//             frequency: recurrence.frequency,
//             interval: recurrence.interval,
//             by_weekday: recurrence.by_weekday || [],
//             by_monthday: recurrence.by_monthday || [],
//             ends_at: recurrence.ends_at || null,
//           },
//           update: {
//             frequency: recurrence.frequency,
//             interval: recurrence.interval,
//             by_weekday: recurrence.by_weekday || [],
//             by_monthday: recurrence.by_monthday || [],
//             ends_at: recurrence.ends_at || null,
//           },
//         });
//       } else {
//         await tx.recurrenceRule.deleteMany({ where: { task_id: taskId } });
//       }

//       // d) **NEW**: if task is recurring and now marked complete, update its latest instance
//       if (existing.is_recurring && newStatus === "Complete") {
//         const latestInstance = await tx.taskInstance.findFirst({
//           where: { task_id: taskId },
//           orderBy: { due_date: "desc" },
//         });
//         if (latestInstance && latestInstance.completed_at === null) {
//           await tx.taskInstance.update({
//             where: { id: latestInstance.id },
//             data: { status: "Complete", completed_at: new Date() },
//           });
//         }
//       }

//       // e) recalc project status
//       const siblingStatuses = (
//         await tx.task.findMany({
//           where: { project_id: existing.project_id, deleted_at: null },
//           select: { status: true },
//         })
//       ).map((t) => t.status);

//       const project = await tx.project.findUnique({
//         where: { id: existing.project_id },
//         select: { status: true },
//       });

//       const newProjStatus = calculateProjectStatus(
//         siblingStatuses,
//         project.status
//       );
//       if (newProjStatus !== project.status) {
//         await tx.project.update({
//           where: { id: existing.project_id },
//           data: { status: newProjStatus },
//         });
//       }

//       // f) return updated task
//       return tx.task.findUnique({
//         where: { id: taskId },
//         include: {
//           project: { select: { id: true, name: true, color: true } },
//           recurrence: true,
//         },
//       });
//     });

//     return NextResponse.json(updatedTask);
//   } catch (error) {
//     console.error("Error updating task:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
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
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Parse body
  const {
    name,
    description = null,
    due_date: dueDateStr, // yyyy-mm-dd or full ISO
    status: requestedStatus,
    priority = 0,
    recurrence = null, // {frequency, interval, by_weekday, by_monthday, ends_at} | null
  } = await request.json();

  if (!name || !dueDateStr || !requestedStatus) {
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
      // a) verify ownership & load minimal flags
      const existing = await tx.task.findFirst({
        where: { id: taskId, deleted_at: null, project: { user_id: userId } },
        select: {
          id: true,
          project_id: true,
          is_recurring: true,
          status: true,
        },
      });
      if (!existing) throw new Error("Not authorized or not found");

      // helper to read latest instance
      const getLatestInstance = async () =>
        tx.taskInstance.findFirst({
          where: { task_id: taskId },
          orderBy: { due_date: "desc" },
        });

      // Track whether we are keeping recurrence after this update
      const willHaveRecurrence = Boolean(
        recurrence && recurrence.frequency && recurrence.frequency.length > 0
      );
      const hadRecurrence = Boolean(existing.is_recurring);

      // b) base task update (name/desc/priority always update)
      //    NOTE: we only set status/completed_at/due_date on the parent when non-recurring
      const baseTaskData = {
        name,
        description,
        priority: Number(priority),
        updated_at: new Date(),
      };

      // c) Recurrence on → parent is a template (status "Recurring")
      if (willHaveRecurrence) {
        // upsert recurrence rule
        await tx.recurrenceRule.upsert({
          where: { task_id: taskId },
          create: {
            task_id: taskId,
            frequency: recurrence.frequency,
            interval: recurrence.interval ?? 1,
            by_weekday: recurrence.by_weekday || [],
            by_monthday: recurrence.by_monthday || [],
            ends_at: recurrence.ends_at || null,
          },
          update: {
            frequency: recurrence.frequency,
            interval: recurrence.interval ?? 1,
            by_weekday: recurrence.by_weekday || [],
            by_monthday: recurrence.by_monthday || [],
            ends_at: recurrence.ends_at || null,
          },
        });

        // lock parent as Recurring; completed_at cleared; keep due_date for reference
        await tx.task.update({
          where: { id: taskId },
          data: {
            ...baseTaskData,
            is_recurring: true,
            status: "Recurring",
            completed_at: null,
            due_date: dueDate,
          },
        });

        // ensure latest instance exists and reflects requested status + due date
        const latest = await getLatestInstance();
        if (!latest) {
          await tx.taskInstance.create({
            data: {
              task_id: taskId,
              due_date: dueDate,
              status:
                requestedStatus === "Complete" ? "Complete" : requestedStatus,
              completed_at: requestedStatus === "Complete" ? new Date() : null,
            },
          });
        } else {
          await tx.taskInstance.update({
            where: { id: latest.id },
            data: {
              due_date: dueDate,
              status:
                requestedStatus === "Complete" ? "Complete" : requestedStatus,
              completed_at: requestedStatus === "Complete" ? new Date() : null,
            },
          });
        }
      }
      // d) Recurrence off AND it previously had recurrence → FLATTEN instance → parent
      else if (!willHaveRecurrence && hadRecurrence) {
        const latest = await getLatestInstance();

        // If there is a latest instance, first apply the requested status/due to it
        let flattenedStatus = requestedStatus;
        let flattenedCompletedAt =
          requestedStatus === "Complete" ? new Date() : null;

        if (latest) {
          await tx.taskInstance.update({
            where: { id: latest.id },
            data: {
              due_date: dueDate,
              status:
                requestedStatus === "Complete" ? "Complete" : requestedStatus,
              completed_at: flattenedCompletedAt,
            },
          });
        }

        // remove recurrence rule and mark parent non-recurring, copying instance state
        await tx.recurrenceRule.deleteMany({ where: { task_id: taskId } });

        await tx.task.update({
          where: { id: taskId },
          data: {
            ...baseTaskData,
            is_recurring: false,
            status: flattenedStatus,
            completed_at: flattenedCompletedAt,
            due_date: dueDate,
          },
        });

        // delete the flattened instance to avoid orphans
        if (latest) {
          await tx.taskInstance.delete({ where: { id: latest.id } });
        }
      }
      // e) Non-recurring path
      else {
        // simple: parent carries status/due/completed_at
        await tx.task.update({
          where: { id: taskId },
          data: {
            ...baseTaskData,
            is_recurring: false,
            status: requestedStatus,
            completed_at: requestedStatus === "Complete" ? new Date() : null,
            due_date: dueDate,
          },
        });

        // ensure no recurrence dangling
        await tx.recurrenceRule.deleteMany({ where: { task_id: taskId } });
      }

      // f) Recalculate project status (kept simple for now, parent-only)
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

      // g) Return updated task in the SAME SHAPE as GET /api/tasks
      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          project: { select: { id: true, name: true, color: true } },
          recurrence: true,
          instances: { orderBy: { due_date: "desc" }, take: 1 },
        },
      });
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
