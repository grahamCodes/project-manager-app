// src/app/api/tasks/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { sub: userId } = requireAuth(request);

  // Fetch non-deleted tasks for the user, ordered by due_date then created_at
  const tasks = await prisma.task.findMany({
    where: {
      deleted_at: null,
      project: { user_id: userId },
    },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request) {
  const { sub: userId } = requireAuth(request);
  try {
    const {
      project_id,
      name,
      description = null,
      due_date,
      status,
      is_recurring = false,
      repeat_days = null,
      priority = 0,
    } = await request.json();

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
