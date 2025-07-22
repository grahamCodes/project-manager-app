// server.js
const next = require("next");
const http = require("http");
const cron = require("node-cron");
const { generateRecurrences } = require("./src/lib/recurrence");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Schedule recurrence generation at midnight in each timezone
  cron.schedule("0 0 * * *", () => generateRecurrences("KST"));
  // cron.schedule("*/1 * * * *", () => generateRecurrences("KST"));

  cron.schedule("0 0 * * *", () => generateRecurrences("UTC"));
  cron.schedule("0 0 * * *", () => generateRecurrences("EST"));

  // Create HTTP server to handle all Next.js requests
  const server = http.createServer((req, res) => {
    return handle(req, res);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server ready on http://localhost:${port}`);
  });
});
