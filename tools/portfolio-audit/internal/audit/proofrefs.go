package audit

import "regexp"

var relatedProjectSlugPattern = regexp.MustCompile(`relatedProjectSlug:\s*"([a-z0-9-]+)"`)

// FindProofReferences extracts every relatedProjectSlug value referenced
// from the raw text of content/v9/scenarios.ts.
func FindProofReferences(scenariosSource string) []string {
	matches := relatedProjectSlugPattern.FindAllStringSubmatch(scenariosSource, -1)
	slugs := make([]string, 0, len(matches))
	for _, m := range matches {
		slugs = append(slugs, m[1])
	}
	return slugs
}

// CheckProofReferences cross-references every relatedProjectSlug in
// content/v9/scenarios.ts against the real flagship project slugs parsed
// from content/projects.ts, returning any that don't resolve to a real
// project - a broken proof reference, exactly the failure mode
// docs/PORTFOLIO_V9_DISCOVERY.md flags the Scenario Simulator as the
// highest risk of (an outcome citing a project that doesn't exist).
func CheckProofReferences(scenariosSource string, projects []ProjectRecord) []string {
	validFlagshipSlugs := make(map[string]bool)
	for _, p := range projects {
		if p.Kind == "flagship" {
			validFlagshipSlugs[p.Slug] = true
		}
	}

	var broken []string
	seen := make(map[string]bool)
	for _, slug := range FindProofReferences(scenariosSource) {
		if !validFlagshipSlugs[slug] && !seen[slug] {
			broken = append(broken, slug)
			seen[slug] = true
		}
	}

	return broken
}
