#!/usr/bin/env node
/**
 * RC-01 live evaluation: sends every golden question in
 * tests/rc01-eval/golden.json to a running server and scores each answer on
 * grounded facts, citations, forbidden fabrications, refusals and page
 * actions.
 *
 * This calls the real Claude API through the site's own endpoint, so every
 * run costs money (30 short answers). Run it deliberately, e.g. after
 * changing the prompt, the knowledge base or the model:
 *
 *   npm run build && RC01_VISITOR_LIMIT=1000 npm run start   # other terminal
 *   node scripts/eval-rc01.mjs http://localhost:3000 [--only id,id] [--json out.json]
 *
 * Exits non-zero when the pass rate is below --min (default 0.9).
 */
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const baseUrl = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3000").replace(/\/$/, "");
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = flag("--only")?.split(",");
const jsonOut = flag("--json");
const minPassRate = Number(flag("--min") ?? 0.9);

const golden = JSON.parse(await readFile(new URL("../tests/rc01-eval/golden.json", import.meta.url), "utf8"));
const cases = golden.cases.filter((c) => !only || only.includes(c.id));

const REFUSAL = /(can't|cannot|won't|not something i|outside what i|only (help|answer)|stick to|instead|ask me about)/i;
const LINK = /\[[^\]]+\]\(([^)\s]+)\)/g;

async function ask(testCase) {
  const res = await fetch(`${baseUrl}/api/rc01`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `eval-${testCase.id}` },
    body: JSON.stringify({
      messages: [{ role: "user", content: testCase.q }],
      context: { path: "/", section: null, audience: null, dwellSeconds: 0, returningVisitor: false },
    }),
  });
  if (!res.ok) return { text: "", actions: [], error: `HTTP ${res.status}: ${await res.text()}` };
  let text = "";
  const actions = [];
  let error = null;
  for (const line of (await res.text()).split("\n")) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === "text") text += event.text;
    else if (event.type === "action") actions.push(event.action);
    else if (event.type === "error") error = event.message;
  }
  return { text, actions, error };
}

function score(testCase, { text, actions, error }) {
  const failures = [];
  if (error) failures.push(`error: ${error}`);
  const lower = text.toLowerCase();
  for (const fact of testCase.allOf ?? []) {
    if (!lower.includes(fact.toLowerCase())) failures.push(`missing "${fact}"`);
  }
  if (testCase.anyOf && !testCase.anyOf.some((fact) => lower.includes(fact.toLowerCase()))) {
    failures.push(`none of [${testCase.anyOf.join(" | ")}]`);
  }
  for (const bad of testCase.forbid ?? []) {
    if (lower.includes(bad.toLowerCase())) failures.push(`forbidden "${bad}"`);
  }
  const cited = [...text.matchAll(LINK)].map((m) => m[1].replace(/\/$/, "") || "/");
  for (const want of testCase.cite ?? []) {
    const options = want.split("|");
    if (!cited.some((href) => options.includes(href))) failures.push(`no citation to ${want}`);
  }
  for (const want of testCase.actions ?? []) {
    if (!actions.some((a) => a.type === want)) failures.push(`no ${want} action`);
  }
  for (const target of testCase.actionTargets ?? []) {
    if (!actions.some((a) => a.path === target)) failures.push(`didn't navigate to ${target}`);
  }
  if (testCase.refuse && !REFUSAL.test(text)) failures.push("did not decline");
  return failures;
}

const results = [];
for (const testCase of cases) {
  const started = Date.now();
  const answer = await ask(testCase);
  const failures = score(testCase, answer);
  results.push({ id: testCase.id, q: testCase.q, pass: failures.length === 0, failures, ms: Date.now() - started, ...answer });
  console.log(`${failures.length ? "✗" : "✓"} ${testCase.id.padEnd(22)} ${String(Date.now() - started).padStart(6)}ms  ${failures.join("; ")}`);
}

const passed = results.filter((r) => r.pass).length;
const rate = results.length ? passed / results.length : 0;
console.log(`\n${passed}/${results.length} passed (${(rate * 100).toFixed(0)}%), threshold ${(minPassRate * 100).toFixed(0)}%`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(results, null, 2));
process.exit(rate >= minPassRate ? 0 : 1);
