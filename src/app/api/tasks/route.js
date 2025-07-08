// }// src/app/api/tasks/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  // 1) Authenticate and get userId
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

  // 3) Build Prisma query scoped to this user
  const options = {
    where: {
      deleted_at: null,
      project: { user_id: userId },
    },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
    },
  };
  if (skip !== undefined) options.skip = skip;
  if (take !== undefined) options.take = take;

  // 4) Fetch and return
  const tasks = await prisma.task.findMany(options);
  return NextResponse.json(tasks);
}

export async function POST(request) {
  // 1) Authenticate and get userId
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  try {
    // 2) Parse body
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

    // 3) Validate required fields
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

    // 4) Ensure the project belongs to this user
    const project = await prisma.project.findFirst({
      where: {
        id: project_id,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not authorized" },
        { status: 404 }
      );
    }

    // 5) If recurring, repeat_days must be positive
    if (is_recurring && (!repeat_days || repeat_days <= 0)) {
      return NextResponse.json(
        { error: "repeat_days must be a positive number for recurring tasks" },
        { status: 400 }
      );
    }

    // 6) Create the task scoped to the user’s project
    const task = await prisma.task.create({
      data: {
        project_id,
        name,
        description,
        due_date: due,
        status,
        is_recurring,
        repeat_days,
        priority: Number(priority),
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
