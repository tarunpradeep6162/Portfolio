import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

/**
 * site.url feeds canonical metadata, link-preview images, the sitemap and
 * robots.txt. It once pointed at an unregistered placeholder domain, which
 * silently broke every shared link preview; it must match the live address
 * published in security.txt.
 */
describe("site.url", () => {
  const securityTxt = readFileSync(join(process.cwd(), "public/.well-known/security.txt"), "utf8");
  const canonical = securityTxt.match(/^Canonical:\s*(\S+)/m)?.[1];

  it("matches the live address published in security.txt", () => {
    expect(canonical).toBeTruthy();
    expect(new URL(site.url).origin).toBe(new URL(canonical!).origin);
  });

  it("is the host used by the sitemap and robots.txt", () => {
    const host = new URL(site.url).host;
    for (const entry of sitemap()) expect(new URL(entry.url).host).toBe(host);
    expect(new URL(robots().sitemap as string).host).toBe(host);
  });
});
