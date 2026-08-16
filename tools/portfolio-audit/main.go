// Command portfolio-audit runs the real, load-bearing audit checks
// docs/PORTFOLIO_V9_ARCHITECTURE.md's polyglot addendum assigns to Go:
// route inventory, flagship-project evidence manifest inspection,
// security-header verification, and Scenario Simulator proof-reference
// validation. Read-only against the repository; exits non-zero (and
// prints failure reasons to stderr) when any check fails, so CI can gate
// on it directly.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"portfolio-audit/internal/audit"
)

func main() {
	repoRoot := flag.String("repo-root", ".", "path to the portfolio repository root")
	jsonPath := flag.String("json", "", "write the machine-readable JSON report here (default: stdout)")
	markdownPath := flag.String("markdown", "", "write the human-readable Markdown report here (default: stdout)")
	flag.Parse()

	report, err := audit.Run(*repoRoot)
	if err != nil {
		fmt.Fprintln(os.Stderr, "portfolio-audit: error:", err)
		os.Exit(1)
	}

	jsonBytes, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, "portfolio-audit: error encoding JSON:", err)
		os.Exit(1)
	}
	if err := writeOutput(*jsonPath, jsonBytes); err != nil {
		fmt.Fprintln(os.Stderr, "portfolio-audit: error writing JSON report:", err)
		os.Exit(1)
	}

	markdown := audit.RenderMarkdown(report)
	if err := writeOutput(*markdownPath, []byte(markdown)); err != nil {
		fmt.Fprintln(os.Stderr, "portfolio-audit: error writing Markdown report:", err)
		os.Exit(1)
	}

	if !report.OK {
		fmt.Fprintln(os.Stderr, "\nportfolio-audit: FAILED:")
		for _, reason := range report.FailureReasons {
			fmt.Fprintln(os.Stderr, " -", reason)
		}
		os.Exit(1)
	}
}

func writeOutput(path string, data []byte) error {
	if path == "" {
		fmt.Println(string(data))
		return nil
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}
