// // src/app/layout.js
// import "./globals.css";
// import Header from "@/components/Header";
// import { headers } from "next/headers";

// export const metadata = {
//   title: "Project Manager App",
//   description: "Manage your projects and tasks seamlessly",
// };

// export default async function RootLayout({ children }) {
//   // Grab the raw cookie header so our API route can authenticate
//   const cookie = headers().get("cookie") || "";

//   // Fetch this user's projects via your existing /api/projects
//   const res = await fetch(
//     `${
//       process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
//     }/api/projects`,
//     {
//       headers: { cookie },
//       cache: "no-store", // always fresh
//     }
//   );

//   // Will only contain projects for the authenticated user
//   let projects = await res.json();

//   // If you still want to filter out "Complete" on top:
//   projects = projects.filter((p) => p.status !== "Complete");

//   // Optionally sort by end_date if you like:
//   projects.sort(
//     (a, b) => new Date(a.end_date).valueOf() - new Date(b.end_date).valueOf()
//   );

//   return (
//     <html lang="en">
//       <body>
//         <Header projects={projects} />
//         <main style={{ paddingTop: "4rem" }}>{children}</main>
//       </body>
//     </html>
//   );
// }

// src/app/layout.js

import "./globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const metadata = {
  title: "Project Manager App",
  description: "Manage your projects and tasks seamlessly",
};

export default async function RootLayout({ children }) {
  // Extract cookies from the incoming request
  const cookieStore = cookies();
  // Authenticate user and get ID
  const { sub: userId } = requireAuth({ cookies: cookieStore });

  // Fetch active projects directly from the database
  const projects = await prisma.project.findMany({
    where: {
      user_id: userId,
      status: { not: "Complete" },
    },
    orderBy: {
      end_date: "asc",
    },
  });

  return (
    <html lang="en">
      <body>
        <Header projects={projects} />
        <main style={{ paddingTop: "4rem" }}>{children}</main>
      </body>
    </html>
  );
}
