// src/lib/recurrence.js
// Requires: npm install @prisma/client date-fns

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { addDays, addWeeks, addMonths } = require("date-fns");

/**
 * Generates the next TaskInstance for all recurring tasks in the given timezone.
 * It finds tasks whose latest instance was completed, computes the next due date
 * based on the rule, and inserts a new TaskInstance if one does not already exist.
 * @param {string} timezone - IANA timezone string (e.g. "Asia/Seoul").
 */
async function generateRecurrences(timezone) {
  console.log(`[Recurrence] Starting generation for timezone ${timezone}`);

  try {
    // 1. Fetch all tasks marked as recurring with a valid RecurrenceRule
    //    for users whose Settings.timezone matches
    const tasks = await prisma.task.findMany({
      where: {
        is_recurring: true,
        recurrence: { is: {} },
        project: {
          user: {
            Settings: { is: { timezone } },
          },
        },
      },
      include: {
        recurrence: true,
        instances: {
          orderBy: { due_date: "desc" },
          take: 1, // get the latest instance
        },
      },
    });
    console.log(
      `[Recurrence] ⚡️ ${tasks.length} recurring tasks loaded:`,
      tasks.map((t) => t.id)
    );

    // 2. Iterate and generate next instances
    for (const task of tasks) {
      const rule = task.recurrence;
      if (!rule) continue;

      const latest = task.instances[0];
      console.log(`→ Task ${task.id}: instances loaded? ${Boolean(latest)}`);
      if (!latest) {
        console.log(`   • No instances at all (should have been seeded)`);
        continue;
      }

      console.log(`   • Latest.completed_at = ${latest.completed_at}`);
      // Skip if no completed instance
      if (latest.completed_at === null) {
        console.log(`   • Skipping because not yet completed`);
        continue;
      }
      console.log(
        `   • Found completed_at = ${latest.completed_at.toISOString()}`
      );

      const lastDone = latest.completed_at;
      let nextDue;
      switch (rule.frequency) {
        case "DAILY":
          nextDue = addDays(lastDone, rule.interval);
          break;
        case "WEEKLY":
          nextDue = addWeeks(lastDone, rule.interval);
          break;
        case "MONTHLY":
          nextDue = addMonths(lastDone, rule.interval);
          break;
        default:
          console.warn(
            `[Recurrence] Unsupported frequency "${rule.frequency}" for task ${task.id}`
          );
          continue;
      }
      console.log(`   • Next due calculated as ${nextDue.toISOString()}`);

      // 3. Ensure we don't duplicate an existing instance
      const exists = await prisma.taskInstance.findFirst({
        where: { task_id: task.id, due_date: nextDue },
      });
      console.log(`   • exists? ${Boolean(exists)}`);
      if (exists) {
        console.log(`   • Skipping because instance already exists`);
        continue;
      }

      // 4. Create the new TaskInstance
      console.log(`   • Creating new instance…`);
      await prisma.taskInstance.create({
        data: {
          task_id: task.id,
          due_date: nextDue,
          status: "In Progress",
        },
      });
      console.log(
        `[Recurrence] Created new instance for task ${
          task.id
        } due ${nextDue.toISOString()}`
      );
    }

    console.log(`[Recurrence] Completed generation for timezone ${timezone}`);
  } catch (err) {
    console.error("[Recurrence] Error in generation:", err);
  }
}

module.exports = { generateRecurrences };
