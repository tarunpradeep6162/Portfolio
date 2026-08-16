package audit

import "testing"

func TestCheckProofReferences(t *testing.T) {
	projects := []ProjectRecord{
		{Slug: "project-aurora", Kind: "flagship"},
		{Slug: "secure-aws-production-architecture", Kind: "flagship"},
		{Slug: "some-lab", Kind: "lab"}, // lab projects never count as a valid citation target
	}

	cases := []struct {
		name            string
		scenariosSource string
		wantBroken      []string
	}{
		{
			name:            "every reference resolves to a real flagship project",
			scenariosSource: `relatedProjectSlug: "project-aurora", relatedProjectSlug: "secure-aws-production-architecture",`,
			wantBroken:      nil,
		},
		{
			name:            "a reference to a project that doesn't exist at all is broken",
			scenariosSource: `relatedProjectSlug: "project-aurora", relatedProjectSlug: "totally-made-up-project",`,
			wantBroken:      []string{"totally-made-up-project"},
		},
		{
			name:            "a reference to a real lab project (not flagship) is still broken",
			scenariosSource: `relatedProjectSlug: "some-lab",`,
			wantBroken:      []string{"some-lab"},
		},
		{
			name:            "the same broken slug cited twice is only reported once",
			scenariosSource: `relatedProjectSlug: "ghost", relatedProjectSlug: "ghost",`,
			wantBroken:      []string{"ghost"},
		},
		{
			name:            "no references at all",
			scenariosSource: `export const scenarios = [];`,
			wantBroken:      nil,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := CheckProofReferences(tc.scenariosSource, projects)
			if len(got) != len(tc.wantBroken) {
				t.Fatalf("got %v, want %v", got, tc.wantBroken)
			}
			for i := range got {
				if got[i] != tc.wantBroken[i] {
					t.Errorf("got %v, want %v", got, tc.wantBroken)
				}
			}
		})
	}
}

func TestCheckProofReferencesAgainstTheRealContentFiles(t *testing.T) {
	projectsSource, err := readFile("../../../..", "content", "projects.ts")
	if err != nil {
		t.Skipf("real content files not reachable from this test's working directory: %v", err)
	}
	scenariosSource, err := readFile("../../../..", "content", "v9", "scenarios.ts")
	if err != nil {
		t.Skipf("real content files not reachable from this test's working directory: %v", err)
	}

	projects := ParseProjects(projectsSource)
	broken := CheckProofReferences(scenariosSource, projects)

	if len(broken) != 0 {
		t.Errorf("expected zero broken proof references in the real Scenario Simulator content, got %v", broken)
	}
}
