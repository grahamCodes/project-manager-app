// // src/app/page.js
// import { cookies } from "next/headers";
// import { verifyToken } from "@/lib/jwt";
// import prisma from "@/lib/prisma";
// import Link from "next/link";
// import TaskList from "@/components/TaskList";
// import styles from "./page.module.css";

// export default async function HomePage() {
//   // 1) Read cookie & verify token (no await needed for cookies())
//   const cookieStore = cookies();
//   const token = cookieStore.get("token")?.value;

//   let userId = null;
//   try {
//     const payload = verifyToken(token);
//     userId = payload.sub;
//   } catch {
//     // unauthenticated
//   }

//   // 2) If not logged in, render the landing page (hero + auth card)
//   if (!userId) {
//     return (
//       <main className={styles.landing}>
//         <section className={styles.hero}>
//           <div className={styles.illustrationWrap} aria-hidden="true">
//             <img
//               src="/progress-512.webp"
//               alt=""
//               className={styles.illustration}
//               loading="eager"
//               width="320"
//               height="320"
//             />
//           </div>

//           <h1 className={styles.heading}>Make progress, not just lists.</h1>
//           <p className={styles.subhead}>
//             Organize tasks by project, see what’s next, and keep
//             momentum—without the noise.
//           </p>

//           <div className={styles.ctas}>
//             <Link href="/login" className={`${styles.btn} ${styles.primary}`}>
//               Log in
//             </Link>
//             <Link
//               href="/signup"
//               className={`${styles.btn} ${styles.secondary}`}
//             >
//               Create account
//             </Link>
//           </div>
//         </section>
//       </main>
//     );
//   }

//   // 3) Logged-in: fetch paging settings and render TaskList
//   const settings = await prisma.settings.findUnique({
//     where: { user_id: userId },
//     select: { tasks_per_day: true, more_tasks_count: true },
//   });

//   const limit = settings?.tasks_per_day ?? 6;
//   const moreCount = settings?.more_tasks_count ?? 3;

//   return (
//     <main className={styles.appMain}>
//       <TaskList initialCount={limit} moreCount={moreCount} />
//     </main>
//   );
// }
// src/app/page.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import styles from "./page.module.css";

export default async function HomePage() {
  // 1) Read cookie & verify token (no await needed for cookies())
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let userId = null;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    // unauthenticated
  }

  // 2) If not logged in, render the landing page (hero + auth card)
  if (!userId) {
    return (
      <main className={styles.landing}>
        <section className={styles.hero}>
          <div className={styles.illustrationWrap} aria-hidden="true">
            <img
              src="/progress-512.webp"
              alt=""
              className={styles.illustration}
              loading="eager"
              width="320"
              height="320"
            />
          </div>

          <h1 className={styles.heading}>Make progress, not just lists.</h1>
          <p className={styles.subhead}>
            Organize tasks by project, see what’s next, and keep
            momentum—without the noise.
          </p>

          <div className={styles.ctas}>
            <Link href="/login" className={`${styles.btn} ${styles.primary}`}>
              Log in
            </Link>
            <Link
              href="/signup"
              className={`${styles.btn} ${styles.secondary}`}
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3) Logged-in: fetch paging settings and render TaskList
  const settings = await prisma.settings.findUnique({
    where: { user_id: userId },
    select: { tasks_per_day: true, more_tasks_count: true, timezone: true },
  });

  const limit = settings?.tasks_per_day ?? 6;
  const moreCount = settings?.more_tasks_count ?? 3;
  const timezone = settings?.timezone ?? "UTC"; // used later when we wire tz helper

  return (
    <main className={styles.appMain}>
      <TaskList
        initialCount={limit}
        moreCount={moreCount}
        timezone={timezone}
      />
    </main>
  );
}
