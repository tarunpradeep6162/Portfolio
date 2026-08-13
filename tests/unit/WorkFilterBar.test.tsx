import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkFilterBar } from "@/components/work/WorkFilterBar";
import type { Project } from "@/content/types";

const sample: Project[] = [
  {
    kind: "lab",
    slug: "a-cloud-thing",
    title: "A Cloud Thing",
    categories: ["Cloud"],
    summary: "A cloud project.",
    toolsAndServices: ["AWS"],
    links: { status: "needs-input", note: "No link yet." },
  },
  {
    kind: "lab",
    slug: "a-devops-thing",
    title: "A DevOps Thing",
    categories: ["DevOps"],
    summary: "A devops project.",
    toolsAndServices: ["Jenkins"],
    links: { status: "needs-input", note: "No link yet." },
  },
];

describe("WorkFilterBar", () => {
  it("shows every project under the 'All' filter by default", () => {
    render(<WorkFilterBar projects={sample} />);
    expect(screen.getByText("A Cloud Thing")).toBeInTheDocument();
    expect(screen.getByText("A DevOps Thing")).toBeInTheDocument();
  });

  it("narrows the list when a category filter is selected", () => {
    render(<WorkFilterBar projects={sample} />);
    fireEvent.click(screen.getByRole("button", { name: "Cloud" }));
    expect(screen.getByText("A Cloud Thing")).toBeInTheDocument();
    expect(screen.queryByText("A DevOps Thing")).not.toBeInTheDocument();
  });

  it("marks the active filter button as pressed for assistive tech", () => {
    render(<WorkFilterBar projects={sample} />);
    const cloudButton = screen.getByRole("button", { name: "Cloud" });
    fireEvent.click(cloudButton);
    expect(cloudButton).toHaveAttribute("aria-pressed", "true");
  });
});
