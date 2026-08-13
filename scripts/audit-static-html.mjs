import { JSDOM } from "jsdom";

const baseUrl = process.env.V4_BASE_URL ?? "http://127.0.0.1:3200";
const routes = [
  "/",
  "/work",
  "/work/project-aurora",
  "/work/distributed-jenkins-controller",
  "/work/secure-aws-production-architecture",
  "/work/nodejs-auth-mysql-rds",
  "/about",
  "/resume",
  "/contact",
];

const failures = [];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  const html = await response.text();
  const document = new JSDOM(html).window.document;

  if (response.status !== 200)
    failures.push(`${route}: expected 200, received ${response.status}`);

  const h1Count = document.querySelectorAll("h1").length;
  if (h1Count !== 1)
    failures.push(`${route}: expected one h1, received ${h1Count}`);

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
    (heading) => Number(heading.tagName[1]),
  );
  headings.forEach((level, index) => {
    if (index > 0 && level > headings[index - 1] + 1)
      failures.push(
        `${route}: heading level jumps from h${headings[index - 1]} to h${level}`,
      );
  });

  const ids = [...document.querySelectorAll("[id]")].map(
    (element) => element.id,
  );
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0)
    failures.push(
      `${route}: duplicate ids ${[...new Set(duplicateIds)].join(", ")}`,
    );

  for (const link of document.querySelectorAll("a")) {
    const href = link.getAttribute("href")?.trim();
    if (!href || href === "#")
      failures.push(`${route}: empty link for '${link.textContent?.trim()}'`);
  }

  for (const image of document.querySelectorAll("img")) {
    if (!image.hasAttribute("alt"))
      failures.push(`${route}: image without alt text`);
  }

  if (/needs input|lorem ipsum|todo:/i.test(document.body.textContent ?? "")) {
    failures.push(
      `${route}: internal placeholder language leaked into public HTML`,
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Static HTML audit passed for ${routes.length} routes.`);
