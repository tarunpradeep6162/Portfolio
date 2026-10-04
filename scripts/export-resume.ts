/**
 * Generates the downloadable résumé PDF from the site's own content
 * (content/*.ts), so the PDF can never drift from the /resume page:
 *
 *   npm run export:resume      ->  public/resume/Tarun-Pradeep-B-Resume.pdf
 *
 * A4, selectable text (ATS-readable), fonts embedded from the project's
 * own @fontsource packages, printed with the repo's Playwright Chromium.
 * Anything marked "needs-input" in content is left out, never invented.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { site, hero, about } from "../content/site";
import { experience } from "../content/experience";
import { education } from "../content/education";
import { certifications } from "../content/certifications";
import { skillDomains } from "../content/skills";
import { projects } from "../content/projects";
import type { FlagshipProject } from "../content/types";

const ROOT = process.cwd();
const OUT = join(ROOT, "public/resume/Tarun-Pradeep-B-Resume.pdf");
/** The live portfolio address (site.url is a placeholder domain until one is connected). */
const PORTFOLIO = process.env.RESUME_PORTFOLIO_URL ?? "https://portfolio-tarun-dun.vercel.app";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const firstSentence = (t: string) => (t.match(/^.*?[.!?](\s|$)/)?.[0] ?? t).trim();
const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

async function fontFace(family: string, file: string) {
  const data = await readFile(join(ROOT, "node_modules", file));
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data.toString("base64")}) format("woff2");font-weight:100 900;font-display:block}`;
}

async function main() {
  const fonts = [
    await fontFace("Syne", "@fontsource-variable/syne/files/syne-latin-wght-normal.woff2"),
    await fontFace("Manrope", "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2"),
  ].join("\n");

  const flagships = projects.filter((p): p is FlagshipProject => p.kind === "flagship");
  const ordered = [...flagships.filter((p) => p.featured), ...flagships.filter((p) => !p.featured)];

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(site.name)} - Résumé</title>
<style>
${fonts}
@page { size: A4; margin: 12mm 14mm 12mm 14mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Manrope, Arial, sans-serif; font-size: 9.1pt; line-height: 1.4; color: #161b21; }
a { color: inherit; text-decoration: none; }
header { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; padding-bottom: 10px; border-bottom: 2.2px solid #161b21; }
h1 { font-family: Syne, Arial, sans-serif; font-size: 22pt; white-space: nowrap; line-height: 0.95; letter-spacing: -0.03em; margin: 0; text-transform: uppercase; }
.role { margin-top: 5px; font-size: 10.5pt; font-weight: 700; color: #3e5a00; letter-spacing: 0.02em; }
.contact { text-align: right; font-size: 8.2pt; line-height: 1.55; color: #39424c; white-space: nowrap; }
h2 { font-family: Syne, Arial, sans-serif; font-size: 9.6pt; letter-spacing: 0.14em; text-transform: uppercase; margin: 11px 0 5px; padding-bottom: 3px; border-bottom: 1px solid #c9ced3; color: #161b21; }
p { margin: 0; }
.summary { color: #2a323b; }
.skills { display: grid; grid-template-columns: 9.5em 1fr; gap: 2px 10px; }
.skills dt { font-weight: 700; }
.skills dd { margin: 0; color: #2a323b; }
.item { margin-bottom: 6px; break-inside: avoid; }
.item-head { display: flex; justify-content: space-between; gap: 10px; }
.item-title { font-weight: 800; }
.item-meta { font-size: 8.4pt; color: #56606b; white-space: nowrap; }
.org { color: #3e5a00; font-weight: 700; }
ul { margin: 3px 0 0; padding-left: 14px; }
li { margin: 1px 0; }
.proj-tools { font-size: 8.2pt; color: #56606b; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
.certs li { break-inside: avoid; }
footer { margin-top: 12px; font-size: 7.6pt; color: #8a939c; text-align: center; }
</style></head><body>
<header>
  <div>
    <h1>${esc(site.name)}</h1>
    <div class="role">Cloud Engineer · DevOps</div>
  </div>
  <div class="contact">
    ${esc(site.location)}<br>
    <a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>
    <a href="${esc(site.linkedin)}">${esc(bare(site.linkedin))}</a><br>
    <a href="${esc(site.github)}">${esc(bare(site.github))}</a> · <a href="${esc(PORTFOLIO)}">${esc(bare(PORTFOLIO))}</a>
  </div>
</header>

<h2>Profile</h2>
<p class="summary">${esc(hero.supportingCopy)} ${esc(about.philosophy)}</p>

<h2>Skills</h2>
<dl class="skills">
${skillDomains.map((d) => `<dt>${esc(d.domain)}</dt><dd>${esc(d.items.join(", "))}</dd>`).join("\n")}
</dl>

<h2>Experience</h2>
${experience
  .map(
    (r) => `<div class="item">
  <div class="item-head"><div><span class="item-title">${esc(r.role)}</span> · <span class="org">${esc(r.org)}</span></div><div class="item-meta">${esc(r.dates)}${r.location ? ` · ${esc(r.location)}` : ""}</div></div>
  ${r.achievements.status === "ready" ? `<ul>${r.achievements.value.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
</div>`,
  )
  .join("\n")}

<h2>Selected projects</h2>
${ordered
  .map(
    (p) => `<div class="item">
  <div class="item-head"><a class="item-title" href="${esc(PORTFOLIO)}/work/${p.slug}">${esc(p.title)}</a></div>
  <p>${esc(firstSentence(p.summary))} ${esc(firstSentence(p.outcome))}</p>
  <p class="proj-tools">${esc(p.toolsAndServices.join(" · "))}</p>
</div>`,
  )
  .join("\n")}

<div class="cols">
  <div>
    <h2>Education</h2>
    ${education.map((e) => `<div class="item"><div class="item-title">${esc(e.credential)}</div><div class="item-meta">${esc(e.institution)} · ${esc(e.date)}</div></div>`).join("\n")}
  </div>
  <div>
    <h2>Certifications</h2>
    <ul class="certs">${certifications.map((c) => `<li>${esc(c.name)}${c.completed ? ` <span class="item-meta">(${esc(c.completed)})</span>` : ""}</li>`).join("")}</ul>
  </div>
</div>

<footer>Full case studies with architecture, decisions and evidence: ${esc(bare(PORTFOLIO))}/work</footer>
</body></html>`;

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  await browser.close();
  await mkdir(join(ROOT, "public/resume"), { recursive: true });
  await writeFile(OUT, pdf);
  console.log(`wrote public/resume/Tarun-Pradeep-B-Resume.pdf (${Math.round(pdf.length / 1024)} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
