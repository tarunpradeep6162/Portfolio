package audit

import "testing"

// FuzzParseProjects targets the content/manifest parsing path per
// docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md's polyglot addendum ("targeted
// fuzz tests on the content/manifest parsing paths" - this file is the
// most input-shaped surface in this tool, since it's a hand-rolled
// brace-depth scanner over arbitrary text, not a real parser). The only
// invariant under fuzzing is that ParseProjects never panics - malformed
// input producing zero or garbage records is an acceptable, expected
// outcome for a scanner this narrow; a panic is not.
func FuzzParseProjects(f *testing.F) {
	seeds := []string{
		``,
		`export const projects = [];`,
		`{`,
		`}`,
		`{{{{{{{{{{`,
		`}}}}}}}}}}`,
		`{ kind: "flagship", slug: "x" }`,
		`{ kind: "flagship", slug: "x", screenshot: { status: "ready" } }`,
		`{ kind: "lab", slug: "y", links: { status: "needs-input" } }`,
		`import type { Project } from "./types";`,
	}
	for _, seed := range seeds {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, source string) {
		defer func() {
			if r := recover(); r != nil {
				t.Fatalf("ParseProjects panicked on input %q: %v", source, r)
			}
		}()
		_ = ParseProjects(source)
	})
}

// FuzzCheckProofReferences targets the other manifest-parsing entry point
// - extracting relatedProjectSlug citations from arbitrary scenario
// source text. Same invariant: never panic.
func FuzzCheckProofReferences(f *testing.F) {
	seeds := []string{
		``,
		`relatedProjectSlug: "x"`,
		`relatedProjectSlug: "`,
		`relatedProjectSlug:`,
	}
	for _, seed := range seeds {
		f.Add(seed)
	}

	projects := []ProjectRecord{{Slug: "project-aurora", Kind: "flagship"}}

	f.Fuzz(func(t *testing.T, source string) {
		defer func() {
			if r := recover(); r != nil {
				t.Fatalf("CheckProofReferences panicked on input %q: %v", source, r)
			}
		}()
		_ = CheckProofReferences(source, projects)
	})
}
