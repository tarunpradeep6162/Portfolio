// Package audit implements the content/evidence checks
// docs/PORTFOLIO_V9_ARCHITECTURE.md's polyglot addendum assigns to Go:
// route inventory, content/evidence manifest inspection, security-header
// verification, and broken proof-reference detection.
//
// This is deliberately a narrow, targeted scanner over the specific
// TypeScript content files this repository actually has - not a general
// TypeScript/JavaScript parser. See docs/PORTFOLIO_V9_PHASE9_GO_AUDIT_TOOL.md
// "Limitations" for what that trade-off costs.
package audit

import "regexp"

// ProjectRecord is the evidence-relevant subset of one entry from
// content/projects.ts - either a FlagshipProject or a LabProject, per
// content/types.ts.
type ProjectRecord struct {
	Slug              string `json:"slug"`
	Kind              string `json:"kind"` // "flagship" | "lab"
	HasRepositoryLink bool   `json:"hasRepositoryLink,omitempty"`
	ScreenshotStatus  string `json:"screenshotStatus,omitempty"` // flagship only: "ready" | "needs-input"
	LinksFieldStatus  string `json:"linksFieldStatus,omitempty"` // lab only: "ready" | "needs-input"
}

var (
	kindPattern             = regexp.MustCompile(`kind:\s*"(flagship|lab)"`)
	slugPattern             = regexp.MustCompile(`slug:\s*"([a-z0-9-]+)"`)
	screenshotStatusPattern = regexp.MustCompile(`screenshot:\s*\{\s*status:\s*"(ready|needs-input)"`)
	labLinksStatusPattern   = regexp.MustCompile(`links:\s*\{\s*status:\s*"(ready|needs-input)"`)
	repositoryLinkPattern   = regexp.MustCompile(`label:\s*"Repository"`)
)

// ParseProjects extracts every project entry from the raw text of
// content/projects.ts. It isolates each top-level object in the
// `projects: Project[] = [ ... ]` array by tracking brace depth (so
// nested structures - screenshot objects, link arrays - don't confuse
// object boundaries), then regex-extracts the evidence-relevant fields
// from each isolated block.
func ParseProjects(source string) []ProjectRecord {
	blocks := splitTopLevelBraceBlocks(source)
	records := make([]ProjectRecord, 0, len(blocks))

	for _, block := range blocks {
		kindMatch := kindPattern.FindStringSubmatch(block)
		slugMatch := slugPattern.FindStringSubmatch(block)
		if kindMatch == nil || slugMatch == nil {
			continue
		}

		record := ProjectRecord{Slug: slugMatch[1], Kind: kindMatch[1]}
		switch record.Kind {
		case "flagship":
			record.HasRepositoryLink = repositoryLinkPattern.MatchString(block)
			if m := screenshotStatusPattern.FindStringSubmatch(block); m != nil {
				record.ScreenshotStatus = m[1]
			}
		case "lab":
			if m := labLinksStatusPattern.FindStringSubmatch(block); m != nil {
				record.LinksFieldStatus = m[1]
			}
		}
		records = append(records, record)
	}

	return records
}

// splitTopLevelBraceBlocks returns the text of every `{ ... }` pair whose
// opening brace sits at depth 1 - i.e. not nested inside another `{ }`
// pair. In content/projects.ts, the only depth-1 brace pairs are the
// individual project objects inside the `projects: Project[] = [ ... ]`
// array (the array's own `[`/`]` aren't braces, so they don't affect this
// count) plus the occasional `{ Name }` from a `import type { X }`
// statement, which callers filter out because it won't match
// kindPattern/slugPattern.
//
// This is a plain brace-depth scanner, not a real parser: a `{` or `}`
// character appearing inside a string literal would throw off the count.
// content/projects.ts does not currently contain any, so this is a
// documented, accepted limitation rather than a silent risk.
func splitTopLevelBraceBlocks(source string) []string {
	var blocks []string
	depth := 0
	start := -1

	for i, r := range source {
		switch r {
		case '{':
			depth++
			if depth == 1 {
				start = i
			}
		case '}':
			if depth == 1 && start >= 0 {
				blocks = append(blocks, source[start:i+1])
				start = -1
			}
			depth--
		}
	}

	return blocks
}
