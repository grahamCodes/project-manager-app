// src/app/api/projects/[projectId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  const { sub: userId } = requireAuth(request);
  const { projectId } = params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
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
  const { sub: userId } = requireAuth(request);
  const { projectId } = params;

  try {
    const {
      name,
      description = null,
      color,
      status,
      start_date,
      end_date,
      sort_order,
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

    // Update project
    const updated = await prisma.project.updateMany({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
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

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Project not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { sub: userId } = requireAuth(request);
  const { projectId } = params;

  // Soft-delete by setting deleted_at
  const deleted = await prisma.project.updateMany({
    where: {
      id: projectId,
      user_id: userId,
      deleted_at: null,
    },
    data: { deleted_at: new Date() },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Project not found or not authorized" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
