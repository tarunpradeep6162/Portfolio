import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NeedsInput } from "@/components/shared/NeedsInput";

describe("NeedsInput", () => {
  it("renders the note text passed to it", () => {
    render(<NeedsInput note="Achievements not supplied yet." />);
    expect(screen.getByText(/achievements not supplied yet/i)).toBeInTheDocument();
  });

  it("always renders the 'Needs input' label so missing facts are never silently blank", () => {
    render(<NeedsInput note="Some fact is missing." />);
    expect(screen.getByText(/needs input/i)).toBeInTheDocument();
  });

  it("exposes the note via an accessible role", () => {
    render(<NeedsInput note="Missing fact." />);
    expect(screen.getByRole("note")).toBeInTheDocument();
  });
});
