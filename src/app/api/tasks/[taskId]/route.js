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
