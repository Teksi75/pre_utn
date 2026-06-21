import type { PedagogicalVisual } from "@/domain/visuals/types";
import { CartesianLineVisual } from "./CartesianLineVisual";
import { DistanceOnLineVisual } from "./DistanceOnLineVisual";
import { IntervalSetVisual } from "./IntervalSetVisual";
import { SignChartVisual } from "./SignChartVisual";
import { SystemsOfLinesVisual } from "./SystemsOfLinesVisual";

interface PedagogicalVisualRendererProps {
  readonly visual: PedagogicalVisual;
}

export function PedagogicalVisualRenderer({
  visual,
}: PedagogicalVisualRendererProps) {
  switch (visual.kind) {
    case "sign-chart":
      return <SignChartVisual visual={visual} />;
    case "distance-on-line":
      return <DistanceOnLineVisual visual={visual} />;
    case "cartesian-line":
      return <CartesianLineVisual visual={visual} />;
    case "systems-of-lines":
      return <SystemsOfLinesVisual visual={visual} />;
    case "interval-set":
      return <IntervalSetVisual visual={visual} />;
    default:
      throw new Error(
        `Unsupported pedagogical visual kind: ${(visual as { kind?: string }).kind ?? "undefined"}`
      );
  }
}
