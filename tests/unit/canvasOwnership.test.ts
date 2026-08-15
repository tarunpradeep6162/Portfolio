import { describe, it, expect, beforeEach } from "vitest";
import {
  claimCanvasOwnership,
  releaseCanvasOwnership,
  getCanvasOwner,
  __resetCanvasOwnershipForTests,
} from "@/lib/v8/canvasOwnership";

describe("canvasOwnership", () => {
  beforeEach(() => {
    __resetCanvasOwnershipForTests();
  });

  it("grants ownership to the first claimant", () => {
    const violation = claimCanvasOwnership("atlas");
    expect(violation).toBeNull();
    expect(getCanvasOwner()).toBe("atlas");
  });

  it("re-claiming by the same owner is a no-op success, not a violation", () => {
    claimCanvasOwnership("atlas");
    const violation = claimCanvasOwnership("atlas");
    expect(violation).toBeNull();
    expect(getCanvasOwner()).toBe("atlas");
  });

  it("reports a violation when a second scene claims while the first still holds ownership", () => {
    claimCanvasOwnership("atlas");
    const violation = claimCanvasOwnership("operational-twin");
    expect(violation).toEqual({ attempted: "operational-twin", currentOwner: "atlas" });
    // The conflicting claim must not have silently taken over ownership.
    expect(getCanvasOwner()).toBe("atlas");
  });

  it("releases ownership so a different scene can claim it afterward", () => {
    claimCanvasOwnership("atlas");
    releaseCanvasOwnership("atlas");
    expect(getCanvasOwner()).toBeNull();

    const violation = claimCanvasOwnership("rc01");
    expect(violation).toBeNull();
    expect(getCanvasOwner()).toBe("rc01");
  });

  it("releasing a scene that does not currently hold ownership is a no-op", () => {
    claimCanvasOwnership("atlas");
    releaseCanvasOwnership("operational-twin");
    expect(getCanvasOwner()).toBe("atlas");
  });

  it("supports the real activate -> close -> reopen -> switch lifecycle sequence", () => {
    // activate atlas
    expect(claimCanvasOwnership("atlas")).toBeNull();
    // close atlas
    releaseCanvasOwnership("atlas");
    // reopen atlas
    expect(claimCanvasOwnership("atlas")).toBeNull();
    // close atlas, switch to rc01
    releaseCanvasOwnership("atlas");
    expect(claimCanvasOwnership("rc01")).toBeNull();
    expect(getCanvasOwner()).toBe("rc01");
  });
});
