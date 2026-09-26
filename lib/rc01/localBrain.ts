import { site, hero, about, resumeFile } from "@/content/site";
// hero/about copy is first-person ("I build..."); RC-01 speaks about Tarun
// in the third person, so answers use `site.description` instead.
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";
import { skillDomains } from "@/content/skills";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { blogPosts } from "@/content/blog";
import { isReady, type FlagshipProject } from "@/content/types";
import type { Rc01Action } from "./actions";

/**
 * RC-01's built-in answer engine: no API, no key, no cost.
 *
 * It answers questions about Tarun from the same typed content the pages
 * render, in two layers:
 * 1. Intents for the questions visitors actually ask (who, contact, skills,
 *    projects, experience, education, certifications, résumé, the spine),
 *    with hand-shaped answers and a citation.
 * 2. Keyword retrieval (BM25-style) over every content chunk for anything
 *    else about the portfolio.
 * Questions it can't ground in the portfolio get an honest "I can't answer
 * that in offline mode" - it never makes things up.
 */
export interface LocalAnswer {
  text: string;
  actions: Rc01Action[];
  /** false when the engine had nothing grounded to say. */
  grounded: boolean;
}

const first = site.name.split(" ")[0];
const flagships = projects.filter((p): p is FlagshipProject => p.kind === "flagship");
const labs = projects.filter((p) => p.kind === "lab");

const STOP = new Set(
  "a an the is are was were be been of to in on for and or with what whats who whos how does do did can could would should tell me about his he him tarun tarun's pradeep please show give i you your it this that there any some which where when my list".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

// ---------------------------------------------------------------------------
// Retrieval corpus
// ---------------------------------------------------------------------------

interface Chunk {
  title: string;
  source: string;
  text: string;
  tokens: string[];
}

function chunk(title: string, source: string, text: string): Chunk {
  return { title, source, text, tokens: tokenize(`${title} ${title} ${text}`) };
}

const corpus: Chunk[] = [
  chunk("About Tarun", "/about", `${hero.supportingCopy} ${about.narrative} ${about.philosophy}`),
  ...experience.map((role) =>
    chunk(
      `${role.role} at ${role.org}`,
      "/resume",
      `${role.role} at ${role.org}, ${role.dates}. ${
        isReady(role.achievements) ? role.achievements.value.join(" ") : ""
      }`,
    ),
  ),
  ...skillDomains.map((d) => chunk(d.domain, "/about", `${d.domain}: ${d.items.join(", ")}.`)),
  ...flagships.flatMap((p) => [
    chunk(p.title, `/work/${p.slug}`, `${p.summary} ${p.context} Tools: ${p.toolsAndServices.join(", ")}.`),
    chunk(`${p.title}: decisions`, `/work/${p.slug}`, p.implementationDecisions.join(" ")),
    chunk(`${p.title}: hardest problem`, `/work/${p.slug}`, `${p.challengeAndResolution} ${p.outcome}`),
  ]),
  ...labs.map((p) => chunk(p.title, "/work", `${p.summary} Tools: ${p.toolsAndServices.join(", ")}.`)),
  ...spineStages.map((s) => chunk(`Reliability Spine: ${s.label}`, "/#spine", s.description)),
  ...blogPosts.map((b) => chunk(b.title, `/blog/${b.slug}`, `${b.description} ${b.tags.join(" ")}`)),
];

const docFreq = new Map<string, number>();
for (const c of corpus) for (const t of new Set(c.tokens)) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
const avgLen = corpus.reduce((n, c) => n + c.tokens.length, 0) / corpus.length;

export function search(query: string, limit = 2): Array<{ chunk: Chunk; score: number }> {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const k1 = 1.4;
  const b = 0.75;
  return corpus
    .map((c) => {
      let score = 0;
      for (const term of terms) {
        const tf = c.tokens.filter((t) => t === term).length;
        if (!tf) continue;
        const df = docFreq.get(term) ?? 0;
        const idf = Math.log(1 + (corpus.length - df + 0.5) / (df + 0.5));
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * c.tokens.length) / avgLen)));
      }
      return { chunk: c, score };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Intents
// ---------------------------------------------------------------------------

const link = (label: string, path: string) => `[${label}](${path})`;
const firstSentence = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim();

// Words in project titles that don't identify one project ("project",
// "application", "aws"...) - weighted by how many titles share them.
const GENERIC_TITLE_WORDS = new Set(["project", "projects", "application", "app", "and", "with", "on"]);
const titleTokens = new Map(
  flagships.map((p) => [
    p,
    new Set(tokenize(`${p.title} ${p.slug.replace(/-/g, " ")}`).filter((w) => !GENERIC_TITLE_WORDS.has(w))),
  ]),
);
const titleFreq = new Map<string, number>();
for (const words of titleTokens.values()) for (const w of words) titleFreq.set(w, (titleFreq.get(w) ?? 0) + 1);

function findProject(q: string): FlagshipProject | undefined {
  const words = new Set(tokenize(q));
  let best: { project: FlagshipProject; score: number } | undefined;
  for (const [project, distinctive] of titleTokens) {
    let score = 0;
    for (const w of distinctive) if (words.has(w)) score += 1 / (titleFreq.get(w) ?? 1);
    if (score > 0 && (!best || score > best.score)) best = { project, score };
  }
  // A word shared by every title (e.g. "aws" if all were AWS) isn't enough.
  return best && best.score >= 0.5 ? best.project : undefined;
}

const wantsToOpen = (q: string) => /\b(show|open|take me|go to|navigate|see)\b/.test(q);

type Intent = { test: RegExp; answer: (q: string) => LocalAnswer };

const answer = (text: string, actions: Rc01Action[] = []): LocalAnswer => ({ text, actions, grounded: true });

const intents: Intent[] = [
  {
    test: /^(hi|hello|hey|yo|hola|good (morning|afternoon|evening))\b|^what'?s up/,
    answer: () =>
      answer(
        `Hi! I'm RC-01, ${first}'s portfolio assistant. Ask me about his projects, skills, experience, certifications, or how to contact him.`,
        [{ type: "gesture", gesture: "wave" }],
      ),
  },
  {
    test: /\b(thank|thanks|thx|cheers|great|awesome|cool)\b/,
    answer: () => answer("Happy to help! Anything else you'd like to know?", [{ type: "gesture", gesture: "nod" }]),
  },
  {
    test: /\b(what can you do|help|who are you|what are you)\b/,
    answer: () =>
      answer(
        `I'm running in offline mode, so I answer questions about ${first}'s work straight from this portfolio: his projects, skills, experience, education, certifications and contact details. Try "What projects has he built?" or "How do I contact him?".`,
      ),
  },
  {
    test: /\b(contact|email|e-mail|reach|hire|get in touch|linkedin|github|phone|call)\b/,
    answer: (q) =>
      answer(
        `The fastest way to reach ${first} is email: **${site.email}**. He's also on [GitHub](${site.github}) and [LinkedIn](${site.linkedin}), and the ${link("contact page", "/contact")} has everything in one place.${/\bphone|call\b/.test(q) ? " A phone number isn't published." : ""}`,
        /\bcopy\b/.test(q) ? [{ type: "copy_email" }] : [],
      ),
  },
  {
    test: /\b(resume|résumé|cv)\b/,
    answer: () =>
      answer(
        isReady(resumeFile)
          ? `You can download ${first}'s résumé from the ${link("résumé page", "/resume")}.`
          : `The full work history is on the ${link("résumé page", "/resume")}. A downloadable PDF isn't published yet - email ${site.email} to request the latest one.`,
      ),
  },
  {
    test: /\b(certif|certified|credential|azure admin|ccna)/,
    answer: () =>
      answer(
        `${first}'s certifications include:\n\n${certifications
          .map((c) => `- ${c.name}${c.completed ? ` (${c.completed})` : ""}`)
          .join("\n")}\n\nDetails are on the ${link("résumé page", "/resume")}.`,
      ),
  },
  {
    test: /\b(educat|degree|study|studied|college|university|b\.?tech|diploma|graduat)/,
    answer: () =>
      answer(
        `${education.map((e) => `- ${e.credential}, ${e.institution} (${e.date})`).join("\n")}\n\nSee the ${link("résumé page", "/resume")}.`,
      ),
  },
  {
    test: /\b(experience|work(ed|s|ing)? (at|for|now)|jobs?|roles?|employ\w*|compan(y|ies)|current(ly)?|stackly|vaata|years)\b/,
    answer: () =>
      answer(
        `${experience
          .map(
            (r) =>
              `- **${r.role}**, ${r.org} (${r.dates})${
                isReady(r.achievements) ? `: ${r.achievements.value[0]}` : " - detailed achievements not published yet"
              }`,
          )
          .join("\n")}\n\nThe full history is on the ${link("résumé page", "/resume")}.`,
      ),
  },
  {
    test: /\b(location|located|based|live[sd]?|city|country|relocat\w*|from)\b|where (is|does) (he|tarun) (live|stay|from|based)|^where is (he|tarun)\??$/,
    answer: () => answer(`${first} is based in ${site.location}. See the ${link("about page", "/about")}.`),
  },
  {
    test: /\b(skills?|tech|techs|stack|tools?|technolog\w*|knows?|languages?|expertise|good at)\b/,
    answer: () =>
      answer(
        `${first}'s skills, grouped by the work he's actually done:\n\n${skillDomains
          .map((d) => `- **${d.domain}:** ${d.items.slice(0, 6).join(", ")}${d.items.length > 6 ? ", and more" : ""}`)
          .join("\n")}\n\nMore on the ${link("about page", "/about")}.`,
      ),
  },
  {
    test: /\b(spine|reliability|stages?)\b/,
    answer: () =>
      answer(
        `The Reliability Spine is the eight-stage path every one of ${first}'s systems follows: ${spineStages
          .map((s) => s.label)
          .join(" → ")}. Each case study maps to the stages it covers. See it on the ${link("home page", "/#spine")}.`,
        [{ type: "highlight_spine_stage", stage: "all" }],
      ),
  },
  {
    test: /\b(blogs?|articles?|posts?|written|writes? about)\b/,
    answer: () =>
      answer(
        `${first} has written ${blogPosts.length} articles:\n\n${blogPosts
          .map((b) => `- ${link(b.title, `/blog/${b.slug}`)}`)
          .join("\n")}`,
      ),
  },
  {
    test: /\b(projects?|portfolio|built|build|case stud|work|strongest|best)\b/,
    answer: (q) => {
      const project = findProject(q);
      if (project) return projectAnswer(project, q);
      return answer(
        `${first} has ${flagships.length} flagship case studies:\n\n${flagships
          .map((p) => `- ${link(p.title, `/work/${p.slug}`)} - ${firstSentence(p.summary)}`)
          .join("\n")}\n\nPlus ${labs.length} smaller lab builds on the ${link("work page", "/work")}.`,
        wantsToOpen(q) ? [{ type: "navigate", path: "/work" }] : [],
      );
    },
  },
  {
    test: /\b(who|introduce|summary|summari[sz]e|overview|recruiter|30 seconds|one line)\b/,
    answer: () =>
      answer(
        `${site.name} is a ${site.description.replace(/\.$/, "")}. He's currently a ${experience[0].role} at ${experience[0].org} and has ${flagships.length} documented case studies. Start with the ${link("work page", "/work")} or the ${link("about page", "/about")}.`,
      ),
  },
];

function projectAnswer(project: FlagshipProject, q: string): LocalAnswer {
  const path = `/work/${project.slug}`;
  let body: string;
  if (/\b(hard|challenge|problem|difficult)/.test(q)) body = project.challengeAndResolution;
  else if (/\b(tool|stack|tech|use[ds]?)\b/.test(q)) body = `Tools and services: ${project.toolsAndServices.join(", ")}.`;
  else if (/\b(responsib|role|his part|did he do)/.test(q)) body = project.responsibility;
  else if (/\b(why|decision|design|architect)/.test(q)) body = project.implementationDecisions.slice(0, 3).map((d) => `- ${d}`).join("\n");
  else if (/\b(result|outcome|impact|shipped)/.test(q)) body = project.outcome;
  else body = `${project.summary} ${project.outcome}`;
  return answer(`**${project.title}**\n\n${body}\n\nFull case study: ${link(project.title, path)}.`, wantsToOpen(q) ? [{ type: "navigate", path }] : []);
}

const OUT_OF_SCOPE = `I'm in offline mode right now, so I can only answer questions about ${first}'s portfolio - his projects, skills, experience and how to reach him. For anything else, try asking again once full AI chat is enabled, or email ${site.email}.`;

export function answerLocally(question: string): LocalAnswer {
  const q = question.toLowerCase().trim();

  // A named project beats every generic intent ("tools used in Aurora").
  const project = findProject(q);
  if (project && !/\b(contact|email)\b/.test(q)) return projectAnswer(project, q);

  for (const intent of intents) {
    if (intent.test.test(q)) return intent.answer(q);
  }

  const hits = search(q);
  if (hits.length && hits[0].score >= 2.2) {
    const [top, second] = hits;
    const lines = [`Here's what the portfolio says - **${top.chunk.title}**: ${top.chunk.text.slice(0, 420).trim()}`];
    lines.push(`\nSource: ${link(top.chunk.title, top.chunk.source)}`);
    if (second && second.chunk.source !== top.chunk.source && second.score > top.score * 0.6) {
      lines.push(`\nRelated: ${link(second.chunk.title, second.chunk.source)}`);
    }
    return answer(lines.join(""));
  }

  return { text: OUT_OF_SCOPE, actions: [{ type: "gesture", gesture: "shrug" }], grounded: false };
}
