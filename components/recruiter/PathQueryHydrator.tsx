"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useExperienceDispatch, useExperienceState } from "@/lib/v6/ExperienceProvider";
import type { VisitorPath } from "@/lib/v6/types";

const VALID_PATHS = new Set(["recruiter", "engineer", "explorer"]);

/**
 * The docs/PORTFOLIO_V9_ARCHITECTURE.md "shareable, bookmarkable URL
 * variant" for visitorPath: hydrates the existing, already-persisted
 * visitorPath state from a `?path=` query param on first load, so a
 * recruiter link like `/?path=recruiter` lands them straight into that
 * framing without them having to find and click the path selector
 * themselves. Renders nothing - purely a side-effect component.
 *
 * Deliberately does not introduce a new route (`/recruiter`) - per the
 * Architecture doc's routing decision, visitorPath stays a lens on one
 * shared homepage, not a content fork.
 *
 * Only ever sets the path, never clears it and never overrides an
 * already-selected path with a different query value - a stale or
 * accidentally-shared link should not silently switch someone already
 * mid-session in one path into a different one.
 */
export function PathQueryHydrator() {
  const searchParams = useSearchParams();
  const dispatch = useExperienceDispatch();
  const { visitorPath } = useExperienceState();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const requested = searchParams.get("path");
    if (requested && VALID_PATHS.has(requested) && !visitorPath) {
      applied.current = true;
      dispatch({ type: "VISITOR_PATH_SET", path: requested as VisitorPath });
    }
  }, [searchParams, visitorPath, dispatch]);

  return null;
}
