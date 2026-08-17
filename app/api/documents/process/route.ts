// Document Processing API - RFP Extraction and Proposal Generation

import { NextRequest, NextResponse } from "next/server";
import { extractRFPFromText, analyzeRFPFit } from "@/lib/documents/rfp-extraction";
import { generateProposal, formatProposalAsHTML } from "@/lib/documents/proposal-generator";
import { sendSlackNotification } from "@/lib/integrations/slack";

export async function POST(request: NextRequest) {
  try {
    const { action, documentText, companyCapabilities, rfpData } = await request.json();

    if (action === "extract-rfp") {
      // Extract RFP from document text
      const rfp = await extractRFPFromText(documentText);

      await sendSlackNotification({
        type: "document_processing",
        title: "RFP Extracted",
        message: `Successfully extracted RFP: ${rfp.projectTitle} from ${rfp.clientName}`,
        metadata: {
          "Project": rfp.projectTitle,
          "Client": rfp.clientName,
          "Budget": `$${rfp.budget.min} - $${rfp.budget.max}`,
          "Duration": `${rfp.timeline.durationWeeks} weeks`,
        },
      });

      return NextResponse.json({ success: true, rfp });
    }

    if (action === "analyze-fit") {
      // Analyze how well we fit the RFP
      const fitAnalysis = await analyzeRFPFit(rfpData, companyCapabilities);

      const status = fitAnalysis.fitScore >= 80 ? "Strong fit" : fitAnalysis.fitScore >= 60 ? "Good fit" : "Potential fit";

      await sendSlackNotification({
        type: "document_processing",
        title: "RFP Fit Analysis Complete",
        message: `${status}: ${rfpData.projectTitle} - ${fitAnalysis.fitScore}% match`,
        metadata: {
          "Score": `${fitAnalysis.fitScore}%`,
          "Status": status,
          "Strengths": fitAnalysis.strengths.slice(0, 3).join(", "),
          "Gaps": fitAnalysis.gaps.slice(0, 3).join(", "),
        },
      });

      return NextResponse.json({ success: true, fitAnalysis });
    }

    if (action === "generate-proposal") {
      // Generate proposal from RFP
      const proposal = await generateProposal(
        rfpData,
        "Tarun Pradeep Consulting",
        "Tarun Pradeep"
      );

      const proposalHTML = formatProposalAsHTML(proposal);

      await sendSlackNotification({
        type: "document_processing",
        title: "Proposal Generated",
        message: `Generated proposal for ${rfpData.projectTitle}`,
        metadata: {
          "Client": rfpData.clientName,
          "Project": rfpData.projectTitle,
          "Investment": `$${proposal.budget.total.toLocaleString()}`,
          "Duration": proposal.budget.timeline,
        },
      });

      return NextResponse.json({
        success: true,
        proposal,
        html: proposalHTML,
        htmlPreview: proposalHTML.substring(0, 500) + "...",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Document processing error:", error);

    await sendSlackNotification({
      type: "error",
      title: "Document Processing Failed",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return NextResponse.json(
      {
        error: "Document processing failed",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
