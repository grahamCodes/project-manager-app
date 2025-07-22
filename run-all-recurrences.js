#!/usr/bin/env node

// run-all-recurrences.js
// A single invocation to generate recurrences for one of three time zones based on UTC hour,
// with support for an environment-override or CLI-argument override.

const { generateRecurrences } = require("./src/lib/recurrence");

(async () => {
  // 1. Optional CLI argument override
  const argTz = process.argv[2];

  // 2. Optional environment variable override
  const envTz = process.env.RECURR_TZ;

  // 3. Determine current UTC hour
  const utcHour = new Date().getUTCHours();

  // 4. Mapping of UTC hours to time zones
  const tzMap = {
    0: "UTC", // 00:00 UTC = Midnight in London
    5: "EST", // 05:00 UTC = Midnight in New York (UTC-5)
    15: "KST", // 15:00 UTC = Midnight in Seoul (UTC+9)
  };

  // 5. Pick the timezone: CLI > ENV > mapping
  const tz = argTz || envTz || tzMap[utcHour];

  if (!tz) {
    console.log(`[Recurrence] No mapping for UTC hour ${utcHour}. Exiting.`);
    process.exit(0);
  }

  console.log(`[Recurrence] Running generator for timezone ${tz}`);

  try {
    await generateRecurrences(tz);
    console.log(`[Recurrence] Completed generation for timezone ${tz}`);
    process.exit(0);
  } catch (err) {
    console.error("[Recurrence] Error in generator:", err);
    process.exit(1);
  }
})();
