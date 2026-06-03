// Enable React canary types so `ViewTransition` and `addTransitionType`
// are recognized as exports of the `react` module. This file exists once
// and augments the module globally for the rest of the project.
//
// React 19.2 in Next.js App Router is the canary build at runtime; the
// typings simply need the same opt-in.
import type {} from "react/canary";
