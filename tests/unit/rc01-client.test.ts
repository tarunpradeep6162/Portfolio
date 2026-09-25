import { describe, it, expect, beforeEach } from "vitest";
import { extractCitations, parseRichText, takeSentences, toSpeech } from "@/lib/rc01/text";
import { suggestionsFor } from "@/lib/rc01/suggestions";
import {
  ensureMemory,
  forgetMemory,
  readMemory,
  recordPath,
  recordSession,
  returningGreeting,
} from "@/lib/companion/visitorMemory";

describe("parseRichText", () => {
  it("turns internal citations into links and leaves plain text alone", () => {
    expect(parseRichText("See [Aurora](/work/project-aurora) for details.")).toEqual([
      { type: "text", text: "See " },
      { type: "link", label: "Aurora", href: "/work/project-aurora" },
      { type: "text", text: " for details." },
    ]);
  });

  it("degrades external or unknown links to their label", () => {
    expect(parseRichText("[click](https://evil.example)")).toEqual([{ type: "text", text: "click" }]);
    expect(parseRichText("[x](javascript:alert(1))")).not.toContainEqual(
      expect.objectContaining({ type: "link" }),
    );
  });

  it("never interprets HTML - it stays literal text", () => {
    const segments = parseRichText("<img src=x onerror=alert(1)>");
    expect(segments).toEqual([{ type: "text", text: "<img src=x onerror=alert(1)>" }]);
  });

  it("supports bold emphasis", () => {
    expect(parseRichText("a **b** c")).toEqual([
      { type: "text", text: "a " },
      { type: "strong", text: "b" },
      { type: "text", text: " c" },
    ]);
  });

  it("extracts de-duplicated citations", () => {
    expect(extractCitations("[A](/about) and [again](/about) and [C](/contact)")).toEqual([
      { label: "A", href: "/about" },
      { label: "C", href: "/contact" },
    ]);
  });
});

describe("speech text", () => {
  it("speaks link labels, not markdown", () => {
    expect(toSpeech("Read **the** [case study](/work/project-aurora).")).toBe("Read the case study.");
  });

  it("releases complete sentences from a streaming buffer and keeps the tail", () => {
    const { sentences, rest } = takeSentences("He works on AWS. He also uses Jenk");
    expect(sentences).toEqual(["He works on AWS."]);
    expect(rest).toBe("He also uses Jenk");
  });

  it("doesn't split on abbreviations or version numbers", () => {
    expect(takeSentences("Tools e.g. Docker and v1.0 ship. Next").sentences).toEqual([
      "Tools e.g. Docker and v1.0 ship.",
    ]);
  });

  it("treats newlines as sentence boundaries", () => {
    expect(takeSentences("First line\nSecond").sentences).toEqual(["First line"]);
  });
});

describe("suggestionsFor", () => {
  it("offers project-specific questions on a case study, going deeper with dwell time", () => {
    const quick = suggestionsFor({ path: "/work/project-aurora", section: null, audience: null, dwellSeconds: 0 });
    const deep = suggestionsFor({ path: "/work/project-aurora", section: null, audience: null, dwellSeconds: 60 });
    expect(quick[0]).toMatch(/Project Aurora/i);
    expect(deep).not.toEqual(quick);
  });

  it("adapts to the audience and the section in view", () => {
    expect(suggestionsFor({ path: "/", section: "spine", audience: null, dwellSeconds: 0 })[0]).toMatch(
      /Reliability Spine/,
    );
    expect(suggestionsFor({ path: "/", section: null, audience: "recruiter", dwellSeconds: 0 })[0]).toMatch(
      /30 seconds/,
    );
  });

  it("always returns exactly three suggestions", () => {
    for (const path of ["/", "/about", "/contact", "/blog", "/work/project-aurora", "/work/unknown"]) {
      expect(suggestionsFor({ path, section: null, audience: null, dwellSeconds: 0 })).toHaveLength(3);
    }
  });
});

describe("visitor memory", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("records nothing until the visitor has activated RC-01", () => {
    recordSession();
    recordPath("/work/project-aurora");
    expect(readMemory()).toBeNull();
  });

  it("remembers recent case studies and greets returning visitors", () => {
    ensureMemory();
    recordPath("/work/project-aurora");
    recordPath("/about"); // not a project - ignored
    expect(readMemory()?.recentProjects).toEqual(["project-aurora"]);
    expect(returningGreeting(readMemory())).toBeNull(); // first visit

    window.sessionStorage.clear(); // a new browsing session
    recordSession();
    expect(readMemory()?.visits).toBe(2);
    expect(returningGreeting(readMemory())).toMatch(/Welcome back.*Project Aurora/);
  });

  it("ignores unknown project slugs and forgets everything on request", () => {
    ensureMemory();
    recordPath("/work/not-real");
    expect(readMemory()?.recentProjects).toEqual([]);
    forgetMemory();
    expect(readMemory()).toBeNull();
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem("rc01-memory", "{not json");
    expect(readMemory()).toBeNull();
  });
});
