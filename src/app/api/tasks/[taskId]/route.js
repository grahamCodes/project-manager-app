// src/app/api/tasks/[taskId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  const { sub: userId } = requireAuth(request);
  const { taskId } = params;

  // Fetch task + project in one query
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deleted_at: null,
      project: { user_id: userId },
    },
    include: {
      project: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(request, { params }) {
  const { sub: userId } = requireAuth(request);
  const { taskId } = params;

  try {
    // const {
    //   name,
    //   description = null,
    //   due_date,
    //   status,
    //   is_recurring = false,
    //   repeat_days = null,
    //   priority = 0,
    // } = await request.json();
    const raw = await request.json();

    // 2. coerce types
    const name = raw.name;
    const description = raw.description ?? null;
    const due_date = raw.due_date;
    const status = raw.status;
    const is_recurring = Boolean(raw.is_recurring);
    const repeat_days =
      raw.repeat_days != null ? Number(raw.repeat_days) : null;
    const priority = Number(raw.priority) || 0;

    // Validate required fields
    if (!name || !due_date || !status) {
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

    // If recurring, repeat_days must be > 0
    if (is_recurring && (!repeat_days || repeat_days <= 0)) {
      return NextResponse.json(
        { error: "repeat_days must be a positive number for recurring tasks" },
        { status: 400 }
      );
    }

    // Verify the task belongs to this user
    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        deleted_at: null,
        project: { user_id: userId },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Task not found or not authorized" },
        { status: 404 }
      );
    }

    // Perform the update and include project data
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        name,
        description,
        due_date: due,
        status,
        is_recurring,
        repeat_days,
        priority,
      },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { sub: userId } = requireAuth(request);
  const { taskId } = params;

  const deleted = await prisma.task.updateMany({
    where: {
      id: taskId,
      deleted_at: null,
      project: { user_id: userId },
    },
    data: { deleted_at: new Date() },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Task not found or not authorized" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
