// // src/app/api/settings/route.js
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/auth";

// export async function GET(request) {
//   // Authenticate user
//   const { sub: userId } = requireAuth(request);

//   // Fetch user settings
//   const settings = await prisma.settings.findUnique({
//     where: { user_id: userId },
//   });

//   if (!settings) {
//     return NextResponse.json({ error: "Settings not found" }, { status: 404 });
//   }

//   return NextResponse.json(settings);
// }

// export async function PUT(request) {
//   // Authenticate user
//   const { sub: userId } = requireAuth(request);

//   try {
//     const {
//       tasks_per_day,
//       more_tasks_count,
//       checkin_hours,
//       sort_mode,
//       theme,
//       tone,
//       timezone,
//       daily_minimum,
//     } = await request.json();

//     // Validate required fields
//     if (
//       tasks_per_day == null ||
//       more_tasks_count == null ||
//       checkin_hours == null ||
//       !sort_mode ||
//       !theme ||
//       !tone ||
//       !timezone ||
//       daily_minimum == null
//     ) {
//       return NextResponse.json(
//         { error: "Missing required settings fields" },
//         { status: 400 }
//       );
//     }

//     // Update settings
//     const updated = await prisma.settings.update({
//       where: { user_id: userId },
//       data: {
//         tasks_per_day,
//         more_tasks_count,
//         checkin_hours,
//         sort_mode,
//         theme,
//         tone,
//         timezone,
//         daily_minimum,
//       },
//     });

//     return NextResponse.json(updated);
//   } catch (error) {
//     console.error("Error updating settings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/settings/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  // 1) Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Fetch user settings
  try {
    const settings = await prisma.settings.findUnique({
      where: { user_id: userId },
      select: {
        tasks_per_day: true,
        more_tasks_count: true,
        checkin_hours: true,
        sort_mode: true,
        sort_project_id: true,
        theme: true,
        tone: true,
        timezone: true,
        daily_minimum: true,
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  // 1) Authenticate user
  let payload;
  try {
    payload = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  // 2) Parse and validate body
  try {
    const {
      tasks_per_day,
      more_tasks_count,
      checkin_hours,
      sort_mode,
      sort_project_id,
      theme,
      tone,
      timezone,
      daily_minimum,
    } = await request.json();

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

    if (tasks_per_day < 1 || tasks_per_day > 20) {
      return NextResponse.json(
        { error: "tasks_per_day must be between 1 and 20" },
        { status: 400 }
      );
    }
    if (more_tasks_count < 0 || more_tasks_count > 5) {
      return NextResponse.json(
        { error: "more_tasks_count must be between 0 and 5" },
        { status: 400 }
      );
    }
    if (checkin_hours < 1) {
      return NextResponse.json(
        { error: "checkin_hours must be at least 1" },
        { status: 400 }
      );
    }
    if (daily_minimum < 1) {
      return NextResponse.json(
        { error: "daily_minimum must be at least 1" },
        { status: 400 }
      );
    }
    if (!["due_date", "project"].includes(sort_mode)) {
      return NextResponse.json({ error: "Invalid sort_mode" }, { status: 400 });
    }
    if (sort_mode === "project" && !sort_project_id) {
      return NextResponse.json(
        { error: "sort_project_id is required when sort_mode is 'project'" },
        { status: 400 }
      );
    }

    // 3) Perform update
    const updated = await prisma.settings.update({
      where: { user_id: userId },
      data: {
        tasks_per_day,
        more_tasks_count,
        checkin_hours,
        sort_mode,
        sort_project_id: sort_mode === "project" ? sort_project_id : null,
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
