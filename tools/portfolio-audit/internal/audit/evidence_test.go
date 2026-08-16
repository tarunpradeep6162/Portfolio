package audit

import "testing"

func TestParseProjects(t *testing.T) {
	cases := []struct {
		name   string
		source string
		want   []ProjectRecord
	}{
		{
			name:   "empty source yields no projects",
			source: `export const projects = [];`,
			want:   nil,
		},
		{
			name: "a flagship project with a repository link and a needs-input screenshot",
			source: `export const projects = [
				{
					kind: "flagship",
					slug: "project-aurora",
					links: [{ label: "Repository", href: "https://example.com" }],
					screenshot: { status: "needs-input", note: "No screenshot yet." },
				},
			];`,
			want: []ProjectRecord{
				{Slug: "project-aurora", Kind: "flagship", HasRepositoryLink: true, ScreenshotStatus: "needs-input"},
			},
		},
		{
			name: "a flagship project with no repository link and a ready screenshot",
			source: `export const projects = [
				{
					kind: "flagship",
					slug: "some-project",
					links: [],
					screenshot: { status: "ready", value: { src: "/x.png", alt: "x" } },
				},
			];`,
			want: []ProjectRecord{
				{Slug: "some-project", Kind: "flagship", HasRepositoryLink: false, ScreenshotStatus: "ready"},
			},
		},
		{
			name: "a lab project with a needs-input links field",
			source: `export const projects = [
				{
					kind: "lab",
					slug: "some-lab",
					links: { status: "needs-input", note: "No link yet." },
				},
			];`,
			want: []ProjectRecord{
				{Slug: "some-lab", Kind: "lab", LinksFieldStatus: "needs-input"},
			},
		},
		{
			name: "multiple projects in one array are all extracted independently",
			source: `export const projects = [
				{
					kind: "flagship",
					slug: "first",
					links: [{ label: "Repository", href: "https://example.com/1" }],
					screenshot: { status: "needs-input", note: "n/a" },
				},
				{
					kind: "flagship",
					slug: "second",
					links: [],
					screenshot: { status: "needs-input", note: "n/a" },
				},
			];`,
			want: []ProjectRecord{
				{Slug: "first", Kind: "flagship", HasRepositoryLink: true, ScreenshotStatus: "needs-input"},
				{Slug: "second", Kind: "flagship", HasRepositoryLink: false, ScreenshotStatus: "needs-input"},
			},
		},
		{
			name:   "an object without a recognizable kind/slug pair is skipped, not crashed on",
			source: `import type { Project } from "./types";`,
			want:   nil,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ParseProjects(tc.source)
			if len(got) != len(tc.want) {
				t.Fatalf("got %d records, want %d: %+v", len(got), len(tc.want), got)
			}
			for i := range got {
				if got[i] != tc.want[i] {
					t.Errorf("record %d: got %+v, want %+v", i, got[i], tc.want[i])
				}
			}
		})
	}
}

func TestParseProjectsAgainstTheRealContentFile(t *testing.T) {
	source, err := readFile("../../../..", "content", "projects.ts")
	if err != nil {
		t.Skipf("real content/projects.ts not reachable from this test's working directory: %v", err)
	}

	records := ParseProjects(source)

	var flagshipCount, flagshipWithRepoLink, labCount int
	for _, r := range records {
		switch r.Kind {
		case "flagship":
			flagshipCount++
			if r.HasRepositoryLink {
				flagshipWithRepoLink++
			}
			if r.ScreenshotStatus == "" {
				t.Errorf("flagship project %q has no detected screenshot status", r.Slug)
			}
		case "lab":
			labCount++
		default:
			t.Errorf("project %q has unexpected kind %q", r.Slug, r.Kind)
		}
	}

	// The real, current state of content/projects.ts, per
	// docs/PORTFOLIO_V9_CONTENT_MATRIX.md: 4 flagship projects, exactly 1
	// (Project Aurora) with a verified repository link, 0 screenshots
	// supplied yet.
	if flagshipCount != 4 {
		t.Errorf("expected 4 flagship projects in the real content file, got %d", flagshipCount)
	}
	if flagshipWithRepoLink != 1 {
		t.Errorf("expected exactly 1 flagship project with a repository link, got %d", flagshipWithRepoLink)
	}
	if labCount == 0 {
		t.Error("expected at least 1 lab project in the real content file, got 0")
	}
}
