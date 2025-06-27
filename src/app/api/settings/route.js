// src/app/api/settings/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  // Authenticate user
  const { sub: userId } = requireAuth(request);

  // Fetch user settings
  const settings = await prisma.settings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PUT(request) {
  // Authenticate user
  const { sub: userId } = requireAuth(request);

  try {
    const {
      tasks_per_day,
      more_tasks_count,
      checkin_hours,
      sort_mode,
      theme,
      tone,
      timezone,
      daily_minimum,
    } = await request.json();

    // Validate required fields
    if (
      tasks_per_day == null ||
      more_tasks_count == null ||
      checkin_hours == null ||
      !sort_mode ||
      !theme ||
      !tone ||
      !timezone ||
      daily_minimum == null
    ) {
      return NextResponse.json(
        { error: "Missing required settings fields" },
        { status: 400 }
      );
    }

    // Update settings
    const updated = await prisma.settings.update({
      where: { user_id: userId },
      data: {
        tasks_per_day,
        more_tasks_count,
        checkin_hours,
        sort_mode,
        theme,
        tone,
        timezone,
        daily_minimum,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
