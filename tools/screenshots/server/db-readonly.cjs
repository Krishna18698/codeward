/* Preloaded into the harness's Next server with `--require`.
 *
 * Makes that server process unable to write to the database. The screenshots
 * and the flow test run against the same Neon database as production, so this
 * is not a convenience — it is the thing that makes running them safe.
 *
 * Every query the app makes goes through @neondatabase/serverless, which sends
 * the SQL as JSON in a POST to Neon's HTTP endpoint using the global `fetch`
 * (`(fetchFunction ?? fetch)(url, { body: JSON.stringify({ query }) })`). This
 * wraps that fetch: a statement that is not a read is refused before it leaves
 * the process, and the request never reaches Neon.
 *
 * The browser side (lib/guard.ts) already blocks every write request, so this
 * layer should never fire. If it does, a GET path is writing, and the counts in
 * examples/.cache/db-guard.json say so — the specs fail the run on it.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- loaded with `node --require`, so it has to be CommonJS */
const fs = require("node:fs");
const path = require("node:path");

const LOG = path.resolve(__dirname, "../../../examples/.cache/db-guard.json");
fs.mkdirSync(path.dirname(LOG), { recursive: true });

// The counts belong to a run, not to this process: the sign-in step clears the
// file when a run starts, and every server of that run adds to it — so a
// compose-only run (no queries of its own) still reports what capture did.
// Synchronous read-add-write: concurrent requests can't interleave inside it.
function record(change) {
  let stats = { reads: 0, blocked: [] };
  try {
    stats = JSON.parse(fs.readFileSync(LOG, "utf8"));
  } catch {}
  change(stats);
  fs.writeFileSync(LOG, JSON.stringify(stats, null, 2));
}

// Reads start with one of these…
const READ = /^\s*(select|with|show|explain)\b/i;
// …and contain none of these as whole words. `updatedAt` does not match
// \bupdate\b, and user input never appears here — Prisma sends it as params.
// A false positive fails safe: a read is refused, nothing is written.
const WRITE = /\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke|copy|vacuum|call|do)\b/i;

const isRead = (sql) => typeof sql === "string" && READ.test(sql) && !WRITE.test(sql);

function header(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name) ?? undefined;
  const hit = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return hit ? headers[hit] : undefined;
}

const realFetch = globalThis.fetch;

globalThis.fetch = function readOnlyFetch(input, init) {
  // Only database traffic carries this header; everything else passes through.
  if (header(init && init.headers, "Neon-Connection-String") === undefined) {
    return realFetch.call(this, input, init);
  }

  let statements;
  try {
    const body = JSON.parse(init.body);
    statements = Array.isArray(body.queries) ? body.queries.map((q) => q.query) : [body.query];
  } catch {
    statements = [undefined];
  }

  const refused = statements.find((sql) => !isRead(sql));
  if (refused !== undefined || statements.includes(undefined)) {
    const sql = String(refused ?? "<unparseable body>").replace(/\s+/g, " ").slice(0, 160);
    record((stats) => stats.blocked.push(sql));
    console.error(`[screenshots] refused a database write: ${sql}`);
    return Promise.reject(new Error("screenshots harness: database is read-only"));
  }

  record((stats) => (stats.reads += statements.length));
  return realFetch.call(this, input, init);
};
