// src/app/api/tasks/[taskId]/status/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * PATCH /api/tasks/:taskId/status
 * Body: { action: "toggle" }
 *
 * Behavior:
 * - Non-recurring: toggles Task.status between "In Progress" and "Complete".
 *   Sets completed_at=now when completing; clears completed_at when reopening.
 * - Recurring: toggles the LATEST TaskInstance only (parent remains template).
 *   Never creates instances here; if missing, returns 409.
 * - Returns the updated Task with { project, recurrence, instances (latest) }.
 * - Does NOT recalc project status.
 */
export async function PATCH(request, { params }) {
  const { taskId } = params || {};
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  // Auth
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // Parse body (optional)
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { action = "toggle" } = body || {};
  if (action !== "toggle") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const now = new Date();

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Load task & check ownership
      const task = await tx.task.findFirst({
        where: { id: taskId, deleted_at: null, project: { user_id: userId } },
        select: {
          id: true,
          is_recurring: true,
          status: true,
          completed_at: true,
        },
      });
      if (!task) throw new Error("Not authorized or not found");

      if (!task.is_recurring) {
        const togglingToComplete = task.status !== "Complete";
        await tx.task.update({
          where: { id: taskId },
          data: togglingToComplete
            ? { status: "Complete", completed_at: now }
            : { status: "In Progress", completed_at: null },
        });

        return tx.task.findUnique({
          where: { id: taskId },
          include: {
            project: { select: { id: true, name: true, color: true } },
            recurrence: true,
            instances: { orderBy: { due_date: "desc" }, take: 1 },
          },
        });
      }

      // Recurring: toggle latest instance only
      const latest = await tx.taskInstance.findFirst({
        where: { task_id: taskId },
        orderBy: { due_date: "desc" },
      });

      if (!latest) {
        // Per product rule, do not create here
        return NextResponse.json(
          { error: "No task instance found for recurring task" },
          { status: 409 }
        );
      }

      const togglingToComplete = latest.status !== "Complete";
      await tx.taskInstance.update({
        where: { id: latest.id },
        data: togglingToComplete
          ? { status: "Complete", completed_at: now }
          : { status: "In Progress", completed_at: null },
      });

      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          project: { select: { id: true, name: true, color: true } },
          recurrence: true,
          instances: { orderBy: { due_date: "desc" }, take: 1 },
        },
      });
    });

    // If a nested handler (409) returned a NextResponse, pass it through
    if (updatedTask instanceof NextResponse) return updatedTask;

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error toggling task status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
