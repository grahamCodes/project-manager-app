// src/app/api/projects/[projectId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET    /api/projects/:projectId   - Fetch a single project
 * PUT    /api/projects/:projectId   - Update a project
 * DELETE /api/projects/:projectId   - Soft-delete a project
 */
export async function GET(request, { params }) {
  // Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // Fetch project belonging to this user
  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      user_id: userId,
      deleted_at: null,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(request, { params }) {
  // Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

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

    // Update the project (throws if not found)
    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        name,
        description,
        color,
        status,
        start_date: start,
        end_date: end,
        sort_order,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  // Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  try {
    // Soft-delete by setting deleted_at
    const deleted = await prisma.project.update({
      where: { id: params.projectId },
      data: { deleted_at: new Date() },
    });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
