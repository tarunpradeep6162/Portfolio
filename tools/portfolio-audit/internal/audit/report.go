package audit

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Report is the full audit result: every check this tool runs, plus a
// single OK verdict CI can gate on. Marshals directly to the
// machine-readable JSON output docs/PORTFOLIO_V9_ARCHITECTURE.md
// requires; Render produces the human-readable Markdown counterpart from
// the same data, so the two outputs can never drift from each other.
type Report struct {
	RepoRoot               string                `json:"repoRoot"`
	Routes                 []RouteCheckResult    `json:"routes"`
	Projects               []ProjectRecord       `json:"projects"`
	FlagshipCount          int                   `json:"flagshipCount"`
	FlagshipWithRepoLink   int                   `json:"flagshipWithRepositoryLink"`
	FlagshipWithScreenshot int                   `json:"flagshipWithScreenshot"`
	SecurityHeaders        SecurityHeadersResult `json:"securityHeaders"`
	BrokenProofReferences  []string              `json:"brokenProofReferences"`
	OK                     bool                  `json:"ok"`
	FailureReasons         []string              `json:"failureReasons,omitempty"`
}

// Run reads the real content/config files under repoRoot and assembles a
// full Report. Read-only - never writes to the repository.
func Run(repoRoot string) (Report, error) {
	report := Report{RepoRoot: repoRoot, BrokenProofReferences: []string{}}

	report.Routes = CheckRouteInventory(filepath.Join(repoRoot, "app"))

	projectsSource, err := readFile(repoRoot, "content", "projects.ts")
	if err != nil {
		return report, err
	}
	report.Projects = ParseProjects(projectsSource)

	for _, p := range report.Projects {
		if p.Kind != "flagship" {
			continue
		}
		report.FlagshipCount++
		if p.HasRepositoryLink {
			report.FlagshipWithRepoLink++
		}
		if p.ScreenshotStatus == "ready" {
			report.FlagshipWithScreenshot++
		}
	}

	nextConfigSource, err := readFile(repoRoot, "next.config.ts")
	if err != nil {
		return report, err
	}
	report.SecurityHeaders = CheckSecurityHeaders(nextConfigSource)

	scenariosSource, err := readFile(repoRoot, "content", "v9", "scenarios.ts")
	if err != nil {
		return report, err
	}
	report.BrokenProofReferences = CheckProofReferences(scenariosSource, report.Projects)
	if report.BrokenProofReferences == nil {
		report.BrokenProofReferences = []string{}
	}

	report.OK, report.FailureReasons = evaluate(report)
	return report, nil
}

func evaluate(report Report) (bool, []string) {
	var reasons []string

	for _, route := range report.Routes {
		if !route.Exists {
			reasons = append(reasons, fmt.Sprintf("missing route: %s (%s)", route.Route, route.Path))
		}
	}
	for _, header := range report.SecurityHeaders.Missing {
		reasons = append(reasons, fmt.Sprintf("missing security header: %s", header))
	}
	for _, slug := range report.BrokenProofReferences {
		reasons = append(reasons, fmt.Sprintf("broken proof reference: scenario cites unknown project slug %q", slug))
	}
	if report.FlagshipCount == 0 {
		reasons = append(reasons, "no flagship projects found - content/projects.ts may have failed to parse")
	}

	return len(reasons) == 0, reasons
}

func readFile(repoRoot string, parts ...string) (string, error) {
	path := filepath.Join(append([]string{repoRoot}, parts...)...)
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("reading %s: %w", path, err)
	}
	return string(data), nil
}

// RenderMarkdown produces the human-readable counterpart to Report's JSON
// encoding, from the exact same data - suitable for a CI job summary or a
// PR comment.
func RenderMarkdown(report Report) string {
	var b strings.Builder

	status := "PASS"
	if !report.OK {
		status = "FAIL"
	}
	fmt.Fprintf(&b, "# Portfolio audit: %s\n\n", status)

	b.WriteString("## Route inventory\n\n")
	b.WriteString("| Route | Exists |\n|---|---|\n")
	for _, route := range report.Routes {
		mark := "yes"
		if !route.Exists {
			mark = "**missing**"
		}
		fmt.Fprintf(&b, "| `%s` | %s |\n", route.Route, mark)
	}

	fmt.Fprintf(&b, "\n## Flagship project evidence (%d found)\n\n", report.FlagshipCount)
	b.WriteString("| Slug | Repository link | Screenshot |\n|---|---|---|\n")
	for _, p := range report.Projects {
		if p.Kind != "flagship" {
			continue
		}
		repo := "no"
		if p.HasRepositoryLink {
			repo = "yes"
		}
		screenshot := p.ScreenshotStatus
		if screenshot == "" {
			screenshot = "unknown"
		}
		fmt.Fprintf(&b, "| `%s` | %s | %s |\n", p.Slug, repo, screenshot)
	}
	fmt.Fprintf(&b, "\n%d/%d flagship projects have a verified repository link. %d/%d have a supplied screenshot.\n",
		report.FlagshipWithRepoLink, report.FlagshipCount, report.FlagshipWithScreenshot, report.FlagshipCount)

	b.WriteString("\n## Security headers (next.config.ts)\n\n")
	fmt.Fprintf(&b, "Present: %s\n\n", joinOrNone(report.SecurityHeaders.Present))
	fmt.Fprintf(&b, "Missing: %s\n", joinOrNone(report.SecurityHeaders.Missing))

	b.WriteString("\n## Scenario Simulator proof references\n\n")
	if len(report.BrokenProofReferences) == 0 {
		b.WriteString("All `relatedProjectSlug` references resolve to a real flagship project.\n")
	} else {
		fmt.Fprintf(&b, "Broken references: %s\n", joinOrNone(report.BrokenProofReferences))
	}

	if !report.OK {
		b.WriteString("\n## Failure reasons\n\n")
		for _, reason := range report.FailureReasons {
			fmt.Fprintf(&b, "- %s\n", reason)
		}
	}

	return b.String()
}

func joinOrNone(items []string) string {
	if len(items) == 0 {
		return "none"
	}
	return strings.Join(items, ", ")
}
