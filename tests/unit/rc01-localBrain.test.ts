import { describe, it, expect } from "vitest";
import { answerLocally, search, tokenize } from "@/lib/rc01/localBrain";
import { resolveInternalHref } from "@/lib/rc01/routes";
import { site } from "@/content/site";

const LINK = /\[[^\]]+\]\(([^)\s]+)\)/g;

function citations(text: string) {
  return [...text.matchAll(LINK)].map((m) => m[1]).filter((href) => href.startsWith("/"));
}

describe("RC-01 built-in answer engine", () => {
  const cases: Array<[string, RegExp, string?]> = [
    ["Who is Tarun?", /cloud engineer/i, "/work"],
    ["How can I contact him?", new RegExp(site.email.replace(".", "\\.")), "/contact"],
    ["Where is he based?", /chennai/i, "/about"],
    ["What are his skills?", /aws/i, "/about"],
    ["Which certifications does he have?", /azure administrator/i, "/resume"],
    ["Where did he study?", /information technology/i, "/resume"],
    ["Where did he graduate from?", /information technology/i, "/resume"],
    ["Where does he work now?", /stackly/i, "/resume"],
    ["What projects has he built?", /project aurora/i, "/work/project-aurora"],
    ["Tell me about the Jenkins controller", /jenkins/i, "/work/distributed-jenkins-controller"],
    ["Which tools did he use in the Jenkins project?", /tools and services: jenkins/i, "/work/distributed-jenkins-controller"],
    ["What was hard about the Node.js RDS app?", /node\.js/i, "/work/nodejs-auth-mysql-rds"],
    ["What tools were used in Project Aurora?", /tools and services/i, "/work/project-aurora"],
    ["Explain the reliability spine", /commit/i, "/#spine"],
    ["Has he written any blog articles?", /articles/i],
    ["Can I get his resume?", /résumé/i, "/resume"],
  ];

  it.each(cases)("%s", (question, expected, cite) => {
    const result = answerLocally(question);
    expect(result.grounded).toBe(true);
    expect(result.text).toMatch(expected);
    if (cite) expect(citations(result.text)).toContain(cite);
  });

  it("only ever cites pages that exist", () => {
    for (const [question] of cases) {
      for (const href of citations(answerLocally(question).text)) {
        expect(resolveInternalHref(href), `${question} -> ${href}`).not.toBeNull();
      }
    }
  });

  it("speaks about Tarun in the third person", () => {
    const text = answerLocally("Who is Tarun?").text;
    expect(text).toMatch(/^Tarun Pradeep B is a Cloud Engineer/);
    expect(text).not.toMatch(/\bI'm Tarun|\bI build/);
  });

  it("is honest about questions it can't ground in the portfolio", () => {
    for (const q of ["What's the capital of France?", "Write me a poem about cats"]) {
      const result = answerLocally(q);
      expect(result.grounded).toBe(false);
      expect(result.text).toMatch(/offline mode/i);
    }
  });

  it("never invents unpublished facts", () => {
    expect(answerLocally("What's his phone number?").text).toMatch(/isn't published/);
    expect(answerLocally("What did he achieve at Stackly?").text).toMatch(/not published yet/);
  });

  it("proposes page actions only when asked to show something", () => {
    expect(answerLocally("Show me Project Aurora").actions).toContainEqual({
      type: "navigate",
      path: "/work/project-aurora",
    });
    expect(answerLocally("What is Project Aurora?").actions).toEqual([]);
    expect(answerLocally("Copy his email").actions).toContainEqual({ type: "copy_email" });
  });

  it("retrieves relevant chunks for free-form portfolio questions", () => {
    expect(tokenize("What is Tarun's AWS VPC work?")).toEqual(["aws", "vpc", "work"]);
    const [top] = search("private subnets security groups");
    expect(top.chunk.source).toMatch(/^\/work/);
  });
});
