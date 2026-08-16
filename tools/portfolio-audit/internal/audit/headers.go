package audit

import "regexp"

// requiredSecurityHeaders mirrors next.config.ts's securityHeaders array -
// the same 5 headers docs/PORTFOLIO_V9_PHASE6_HARDENING.md verified with a
// live curl/Playwright check. This tool checks the *configuration source*
// instead (no server to hit in CI), which is a real, independent
// consolidation candidate for that same invariant.
var requiredSecurityHeaders = []string{
	"X-Content-Type-Options",
	"Referrer-Policy",
	"Permissions-Policy",
	"X-Frame-Options",
	"Strict-Transport-Security",
}

var headerKeyPattern = regexp.MustCompile(`key:\s*"([^"]+)"`)

// SecurityHeadersResult reports which required headers were found declared
// in next.config.ts's securityHeaders array.
type SecurityHeadersResult struct {
	Present []string `json:"present"`
	Missing []string `json:"missing"`
}

// CheckSecurityHeaders scans the raw text of next.config.ts for `key: "..."`
// entries and reports which of the required headers are present.
func CheckSecurityHeaders(nextConfigSource string) SecurityHeadersResult {
	found := make(map[string]bool)
	for _, m := range headerKeyPattern.FindAllStringSubmatch(nextConfigSource, -1) {
		found[m[1]] = true
	}

	result := SecurityHeadersResult{Present: []string{}, Missing: []string{}}
	for _, header := range requiredSecurityHeaders {
		if found[header] {
			result.Present = append(result.Present, header)
		} else {
			result.Missing = append(result.Missing, header)
		}
	}

	return result
}
