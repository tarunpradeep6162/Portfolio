// OpenAI API Integration - Stub for build

export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        console.warn("OpenAI not configured. Using stub response.");
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  clientName: "Sample Client",
                  projectTitle: "Sample Project",
                  budget: { min: 10000, max: 50000, currency: "USD" },
                  timeline: { startDate: "2024-09-01", endDate: "2024-12-31", durationWeeks: 16 },
                  requirements: ["Requirement 1", "Requirement 2"],
                  technologies: ["Tech 1", "Tech 2"],
                  deliverables: ["Deliverable 1"],
                  evaluationCriteria: ["Criteria 1"],
                  contactPerson: { name: "John Doe", email: "john@example.com" },
                  keyDates: { proposalDeadline: "2024-08-30", projectStart: "2024-09-01" },
                  successMetrics: ["Metric 1"],
                  constraints: ["Constraint 1"],
                }),
              },
            },
          ],
        };
      },
    },
  },
};
