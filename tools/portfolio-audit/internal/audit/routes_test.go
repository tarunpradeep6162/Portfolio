package audit

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCheckRouteInventory(t *testing.T) {
	dir := t.TempDir()

	mustMkdirAll(t, filepath.Join(dir, "about"))
	mustWriteFile(t, filepath.Join(dir, "page.tsx"), "export default function Home() {}")
	mustWriteFile(t, filepath.Join(dir, "about", "page.tsx"), "export default function About() {}")
	// Deliberately no contact/resume/work directories, to exercise the
	// missing-route path.

	results := CheckRouteInventory(dir)

	byRoute := make(map[string]RouteCheckResult)
	for _, r := range results {
		byRoute[r.Route] = r
	}

	cases := []struct {
		route  string
		exists bool
	}{
		{"/", true},
		{"/about", true},
		{"/contact", false},
		{"/resume", false},
		{"/work", false},
	}

	for _, tc := range cases {
		got, ok := byRoute[tc.route]
		if !ok {
			t.Fatalf("no result for route %q", tc.route)
		}
		if got.Exists != tc.exists {
			t.Errorf("route %q: got exists=%v, want %v", tc.route, got.Exists, tc.exists)
		}
	}
}

func TestCheckRouteInventoryAgainstTheRealAppDirectory(t *testing.T) {
	appDir := "../../../../app"
	if _, err := os.Stat(appDir); err != nil {
		t.Skipf("real app/ directory not reachable from this test's working directory: %v", err)
	}

	results := CheckRouteInventory(appDir)
	for _, r := range results {
		if !r.Exists {
			t.Errorf("expected route %q to exist in the real app/ directory, but it doesn't (%s)", r.Route, r.Path)
		}
	}
}

func mustMkdirAll(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q): %v", path, err)
	}
}

func mustWriteFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("WriteFile(%q): %v", path, err)
	}
}
