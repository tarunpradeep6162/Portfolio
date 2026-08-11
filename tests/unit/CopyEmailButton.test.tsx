import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";

describe("CopyEmailButton", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the email address", () => {
    render(<CopyEmailButton email="tarunpradeep2003@gmail.com" />);
    expect(screen.getByText("tarunpradeep2003@gmail.com")).toBeInTheDocument();
  });

  it("copies the email to the clipboard on click", async () => {
    render(<CopyEmailButton email="tarunpradeep2003@gmail.com" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "tarunpradeep2003@gmail.com",
      );
    });
  });

  it("announces the copy via an aria-live region for screen readers", async () => {
    render(<CopyEmailButton email="tarunpradeep2003@gmail.com" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/copied/i);
    });
  });
});
