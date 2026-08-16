package audit

import (
	"os"
	"path/filepath"
)

// RouteCheckResult reports whether one expected static route's
// app/<segment>/page.tsx exists.
type RouteCheckResult struct {
	Route  string `json:"route"`
	Path   string `json:"path"`
	Exists bool   `json:"exists"`
}

// expectedStaticRoutes mirrors the route list scripts/measure-v9-baseline.mjs
// tracks and lib/v9/commandIndex.ts indexes - the top-level, statically
// rendered routes (not /work/[slug]'s dynamic segments, which
// generateStaticParams derives from content/projects.ts directly and are
// covered by ParseProjects instead).
var expectedStaticRoutes = []string{"", "about", "contact", "resume", "work"}

// CheckRouteInventory verifies every expected static route has a real
// app/<segment>/page.tsx file under appDir.
func CheckRouteInventory(appDir string) []RouteCheckResult {
	results := make([]RouteCheckResult, 0, len(expectedStaticRoutes))

	for _, segment := range expectedStaticRoutes {
		pagePath := filepath.Join(appDir, segment, "page.tsx")
		_, err := os.Stat(pagePath)
		results = append(results, RouteCheckResult{
			Route:  "/" + segment,
			Path:   pagePath,
			Exists: err == nil,
		})
	}

	return results
}
