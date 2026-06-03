"use client";

import { ViewTransition } from "react";
import type { ReactNode } from "react";

interface DirectionalTransitionProps {
  children: ReactNode;
}

/**
 * Wraps a page in a directional View Transition. Pair this with the
 * `transitionTypes` prop on the corresponding `<Link>` (or `addTransitionType`
 * in programmatic navigation) to slide the page in from the right
 * (`nav-forward`) or from the left (`nav-back`).
 *
 * `default="none"` is critical: without it every transition — Suspense
 * resolves, background revalidations, etc. — would fire a cross-fade. Only
 * navigation that explicitly tags a type should animate.
 */
export function DirectionalTransition({ children }: DirectionalTransitionProps) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
