// src/app/api/projects/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  // Authenticate and get userId from token payload
  const { sub: userId } = requireAuth(request);

  // Fetch non-deleted projects, ordered by sort_order then created_at
  const projects = await prisma.project.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
  });

  return NextResponse.json(projects);
}

export async function POST(request) {
  const { sub: userId } = requireAuth(request);
  try {
    const {
      name,
      description = null,
      color,
      status,
      start_date,
      end_date,
      sort_order = 0,
    } = await request.json();

    // Validate required fields
    if (!name || !color || !status || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required project fields" },
        { status: 400 }
      );
    }

    // Validate date ordering
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start) || isNaN(end) || start > end) {
      return NextResponse.json(
        { error: "start_date must be before or equal to end_date" },
        { status: 400 }
      );
    }

    // Create project
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
