#!/usr/bin/env node
// run-all-recurrences.js

const { generateRecurrences } = require("./src/lib/recurrence");

(async () => {
  // 1. Figure out current UTC hour (0–23)
  const utcHour = new Date().getUTCHours();

  // 2. Map UTC hours → your IANA/KST strings
  const tzMap = {
    0: "Europe/London", // 00:00 UTC = 00:00 London
    5: "America/New_York", // 05:00 UTC = 00:00 New York (UTC−5)
    15: "KST", // 15:00 UTC = 00:00 Seoul (UTC+9)
  };

  const tz = tzMap[utcHour];
  if (!tz) {
    console.log(`[Recurrence] No mapping for UTC hour ${utcHour}. Exiting.`);
    process.exit(0);
  }

  console.log(`[Recurrence] Running generator for timezone ${tz}`);
  try {
    await generateRecurrences(tz);
    console.log(`[Recurrence] Done for ${tz}`);
    process.exit(0);
  } catch (err) {
    console.error("[Recurrence] Error in generator:", err);
    process.exit(1);
  }
})();
