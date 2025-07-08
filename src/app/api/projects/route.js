// src/app/api/projects/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET   /api/projects    - List all projects for the authenticated user
 * POST  /api/projects    - Create a new project for the authenticated user
 */
export async function GET(request) {
  // 1) Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Fetch projects belonging to this user
  const projects = await prisma.project.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
  });

  return NextResponse.json(projects);
}

export async function POST(request) {
  // 1) Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  try {
    // 2) Parse and validate request body
    const {
      name,
      description = null,
      color,
      status,
      start_date,
      end_date,
      sort_order = 0,
    } = await request.json();

    if (!name || !color || !status || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required project fields" },
        { status: 400 }
      );
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start) || isNaN(end) || start > end) {
      return NextResponse.json(
        { error: "start_date must be before or equal to end_date" },
        { status: 400 }
      );
    }

    // 3) Create the project
    const project = await prisma.project.create({
      data: {
        user_id: userId,
        name,
        description,
        color,
        status,
        start_date: start,
        end_date: end,
        sort_order,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
