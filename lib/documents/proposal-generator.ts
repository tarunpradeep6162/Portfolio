// AI-Powered Proposal Generator

import { openai } from "@/lib/integrations/openai";
import { ExtractedRFP } from "./rfp-extraction";

export interface ProposalSection {
  title: string;
  content: string;
}

export interface GeneratedProposal {
  clientName: string;
  projectTitle: string;
  sections: ProposalSection[];
  budget: {
    breakdown: Array<{ item: string; cost: number }>;
    total: number;
    timeline: string;
  };
  timeline: {
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  risks: Array<{
    risk: string;
    mitigation: string;
  }>;
  generatedAt: string;
}

export async function generateProposal(
  rfp: ExtractedRFP,
  companyName: string,
  consultantName: string
): Promise<GeneratedProposal> {
  const prompt = `Generate a professional consulting proposal based on this RFP.

Client: ${rfp.clientName}
Project: ${rfp.projectTitle}
Budget Range: $${rfp.budget.min} - $${rfp.budget.max}
Timeline: ${rfp.timeline.durationWeeks} weeks
Requirements: ${rfp.requirements.join(", ")}
Technologies: ${rfp.technologies.join(", ")}

Generate proposal sections in JSON:
{
  "executiveSummary": "compelling 2-3 paragraph summary",
  "approach": "detailed approach and methodology",
  "timeline": "project timeline with phases",
  "qualifications": "why we're the right fit",
  "successCriteria": "how success will be measured",
  "support": "ongoing support and maintenance",
  "teamBios": "key team member bios"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = response.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const sections = JSON.parse(jsonMatch ? jsonMatch[0] : content);

  // Generate budget breakdown
  const budgetResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: `Generate a detailed budget breakdown for a ${rfp.timeline.durationWeeks}-week ${rfp.projectTitle} project with budget $${rfp.budget.max}.

Return JSON:
{
  "breakdown": [
    {"item": "category", "cost": number},
    {"item": "category", "cost": number}
  ],
  "total": number
}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const budgetContent = budgetResponse.choices[0].message.content || "{}";
  const budgetMatch = budgetContent.match(/\{[\s\S]*\}/);
  const budget = JSON.parse(budgetMatch ? budgetMatch[0] : budgetContent);

  // Generate risk mitigation
  const riskResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: `Identify and mitigate risks for this project: ${rfp.projectTitle}
Requirements: ${rfp.requirements.join(", ")}
Constraints: ${rfp.constraints.join(", ")}

Return JSON:
{
  "risks": [
    {"risk": "specific risk", "mitigation": "how we'll handle it"}
  ]
}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
  });

  const riskContent = riskResponse.choices[0].message.content || "{}";
  const riskMatch = riskContent.match(/\{[\s\S]*\}/);
  const risks = JSON.parse(riskMatch ? riskMatch[0] : riskContent);

  return {
    clientName: rfp.clientName,
    projectTitle: rfp.projectTitle,
    sections: [
      {
        title: "Executive Summary",
        content: sections.executiveSummary || "Summary pending",
      },
      {
        title: "Approach & Methodology",
        content: sections.approach || "Approach pending",
      },
      {
        title: "Timeline & Phases",
        content: sections.timeline || "Timeline pending",
      },
      {
        title: "Our Qualifications",
        content: sections.qualifications || "Qualifications pending",
      },
      {
        title: "Success Criteria",
        content: sections.successCriteria || "Success criteria pending",
      },
      {
        title: "Ongoing Support",
        content: sections.support || "Support pending",
      },
      {
        title: "Team",
        content: sections.teamBios || "Team bios pending",
      },
    ],
    budget: {
      breakdown: budget.breakdown || [],
      total: budget.total || rfp.budget.max,
      timeline: `${rfp.timeline.durationWeeks} weeks`,
    },
    timeline: {
      phases: [
        {
          name: "Discovery & Planning",
          duration: "Week 1-2",
          deliverables: ["Project kickoff", "Requirements review", "Architecture design"],
        },
        {
          name: "Implementation",
          duration: `Week 3-${Math.max(rfp.timeline.durationWeeks - 2, 3)}`,
          deliverables: ["Core development", "Integration", "Testing"],
        },
        {
          name: "Deployment & Handoff",
          duration: `Week ${Math.max(rfp.timeline.durationWeeks - 1, 4)}-${rfp.timeline.durationWeeks}`,
          deliverables: ["Final testing", "Production deployment", "Documentation", "Knowledge transfer"],
        },
      ],
    },
    risks: risks.risks || [],
    generatedAt: new Date().toISOString(),
  };
}

export function formatProposalAsHTML(proposal: GeneratedProposal): string {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${proposal.projectTitle} - Proposal</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { color: #0066cc; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #0066cc; margin-top: 30px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .budget-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .budget-table th, .budget-table td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        .budget-table th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f0f0f0; }
        .timeline-phase { background-color: #f9f9f9; padding: 15px; margin-bottom: 10px; border-left: 4px solid #0066cc; }
        .risk-item { background-color: #fff3cd; padding: 10px; margin-bottom: 10px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${proposal.projectTitle}</h1>
        <p><strong>Client:</strong> ${proposal.clientName}</p>
        <p><strong>Proposal Date:</strong> ${new Date(proposal.generatedAt).toLocaleDateString()}</p>
      </div>
  `;

  // Add sections
  proposal.sections.forEach((section) => {
    html += `
      <div class="section">
        <h2>${section.title}</h2>
        <p>${section.content.replace(/\n/g, "</p><p>")}</p>
      </div>
    `;
  });

  // Add budget table
  html += `
    <div class="section">
      <h2>Investment & Budget</h2>
      <table class="budget-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Cost</th>
          </tr>
        </thead>
        <tbody>
  `;

  proposal.budget.breakdown.forEach((item) => {
    html += `
      <tr>
        <td>${item.item}</td>
        <td style="text-align: right;">$${item.cost.toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
          <tr class="total-row">
            <td>Total Investment</td>
            <td style="text-align: right;">$${proposal.budget.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Timeline:</strong> ${proposal.budget.timeline}</p>
    </div>
  `;

  // Add timeline
  html += `
    <div class="section">
      <h2>Project Timeline</h2>
  `;

  proposal.timeline.phases.forEach((phase) => {
    html += `
      <div class="timeline-phase">
        <h3>${phase.name}</h3>
        <p><strong>Duration:</strong> ${phase.duration}</p>
        <p><strong>Deliverables:</strong></p>
        <ul>
          ${phase.deliverables.map((d) => `<li>${d}</li>`).join("")}
        </ul>
      </div>
    `;
  });

  html += `
    </div>
  `;

  // Add risks
  if (proposal.risks.length > 0) {
    html += `
      <div class="section">
        <h2>Risk Management</h2>
    `;

    proposal.risks.forEach((item) => {
      html += `
        <div class="risk-item">
          <p><strong>Risk:</strong> ${item.risk}</p>
          <p><strong>Mitigation:</strong> ${item.mitigation}</p>
        </div>
      `;
    });

    html += `
      </div>
    `;
  }

  html += `
      <div class="footer">
        <p>This proposal is confidential and intended for the specified recipient.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}
