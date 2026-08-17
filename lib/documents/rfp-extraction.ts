// RFP (Request for Proposal) Extraction using OpenAI

import { openai } from "@/lib/integrations/openai";

export interface ExtractedRFP {
  clientName: string;
  projectTitle: string;
  description: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    durationWeeks: number;
  };
  requirements: string[];
  technologies: string[];
  deliverables: string[];
  evaluationCriteria: string[];
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
  };
  keyDates: {
    proposalDeadline: string;
    presentationDate?: string;
    projectStart: string;
  };
  successMetrics: string[];
  constraints: string[];
}

export async function extractRFPFromText(
  documentText: string
): Promise<ExtractedRFP> {
  const prompt = `Extract structured information from this RFP document. Return valid JSON only.

Document:
${documentText}

Extract and return JSON with these fields:
{
  "clientName": "company name",
  "projectTitle": "project name",
  "description": "project overview",
  "budget": {
    "min": number,
    "max": number,
    "currency": "USD"
  },
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "durationWeeks": number
  },
  "requirements": ["requirement1", "requirement2"],
  "technologies": ["tech1", "tech2"],
  "deliverables": ["deliverable1", "deliverable2"],
  "evaluationCriteria": ["criteria1", "criteria2"],
  "contactPerson": {
    "name": "contact name",
    "email": "email@example.com",
    "phone": "phone number"
  },
  "keyDates": {
    "proposalDeadline": "YYYY-MM-DD",
    "presentationDate": "YYYY-MM-DD",
    "projectStart": "YYYY-MM-DD"
  },
  "successMetrics": ["metric1", "metric2"],
  "constraints": ["constraint1", "constraint2"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const extractedData = JSON.parse(jsonMatch ? jsonMatch[0] : content);

  return {
    clientName: extractedData.clientName || "Unknown",
    projectTitle: extractedData.projectTitle || "Untitled Project",
    description: extractedData.description || "",
    budget: {
      min: extractedData.budget?.min || 0,
      max: extractedData.budget?.max || 0,
      currency: extractedData.budget?.currency || "USD",
    },
    timeline: {
      startDate: extractedData.timeline?.startDate || new Date().toISOString().split("T")[0],
      endDate: extractedData.timeline?.endDate || new Date().toISOString().split("T")[0],
      durationWeeks: extractedData.timeline?.durationWeeks || 0,
    },
    requirements: extractedData.requirements || [],
    technologies: extractedData.technologies || [],
    deliverables: extractedData.deliverables || [],
    evaluationCriteria: extractedData.evaluationCriteria || [],
    contactPerson: {
      name: extractedData.contactPerson?.name || "Unknown",
      email: extractedData.contactPerson?.email || "",
      phone: extractedData.contactPerson?.phone,
    },
    keyDates: {
      proposalDeadline: extractedData.keyDates?.proposalDeadline || "",
      presentationDate: extractedData.keyDates?.presentationDate,
      projectStart: extractedData.keyDates?.projectStart || "",
    },
    successMetrics: extractedData.successMetrics || [],
    constraints: extractedData.constraints || [],
  };
}

export async function analyzeRFPFit(
  rfp: ExtractedRFP,
  companyCapabilities: string[]
): Promise<{ fitScore: number; gaps: string[]; strengths: string[] }> {
  const prompt = `Analyze how well our company matches this RFP.

Our Capabilities:
${companyCapabilities.join("\n")}

RFP Requirements:
${rfp.requirements.join("\n")}

RFP Technologies:
${rfp.technologies.join("\n")}

Return JSON:
{
  "fitScore": 0-100,
  "gaps": ["gap1", "gap2"],
  "strengths": ["strength1", "strength2"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);

  return {
    fitScore: analysis.fitScore || 0,
    gaps: analysis.gaps || [],
    strengths: analysis.strengths || [],
  };
}
