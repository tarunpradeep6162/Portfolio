package audit

import (
	"reflect"
	"sort"
	"testing"
)

func TestCheckSecurityHeaders(t *testing.T) {
	cases := []struct {
		name        string
		source      string
		wantPresent []string
		wantMissing []string
	}{
		{
			name:        "no headers declared at all",
			source:      `const x = 1;`,
			wantPresent: []string{},
			wantMissing: requiredSecurityHeaders,
		},
		{
			name: "all 5 required headers present, in the real next.config.ts shape",
			source: `const securityHeaders = [
				{ key: "X-Content-Type-Options", value: "nosniff" },
				{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
				{ key: "X-Frame-Options", value: "DENY" },
				{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
			];`,
			wantPresent: requiredSecurityHeaders,
			wantMissing: []string{},
		},
		{
			name: "one header missing is reported precisely",
			source: `const securityHeaders = [
				{ key: "X-Content-Type-Options", value: "nosniff" },
				{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
				{ key: "X-Frame-Options", value: "DENY" },
			];`,
			wantPresent: []string{"X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"},
			wantMissing: []string{"Strict-Transport-Security"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := CheckSecurityHeaders(tc.source)
			assertSameSet(t, "present", result.Present, tc.wantPresent)
			assertSameSet(t, "missing", result.Missing, tc.wantMissing)
		})
	}
}

func TestCheckSecurityHeadersAgainstTheRealNextConfig(t *testing.T) {
	source, err := readFile("../../../..", "next.config.ts")
	if err != nil {
		t.Skipf("real next.config.ts not reachable from this test's working directory: %v", err)
	}

	result := CheckSecurityHeaders(source)
	if len(result.Missing) != 0 {
		t.Errorf("expected zero missing security headers in the real next.config.ts, got %v", result.Missing)
	}
}

func assertSameSet(t *testing.T, label string, got, want []string) {
	t.Helper()
	gotSorted := append([]string{}, got...)
	wantSorted := append([]string{}, want...)
	sort.Strings(gotSorted)
	sort.Strings(wantSorted)
	if !reflect.DeepEqual(gotSorted, wantSorted) {
		t.Errorf("%s: got %v, want %v", label, gotSorted, wantSorted)
	}
}
