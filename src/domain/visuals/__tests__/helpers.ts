import type {
  CartesianLineVisual,
  DistanceOnLineVisual,
  IntervalSetVisual,
  PedagogicalVisual,
  SignChartVisual,
  SystemsOfLinesVisual,
} from "../types";

export function assertSignChart(visual: PedagogicalVisual): SignChartVisual {
  if (visual.kind !== "sign-chart") {
    throw new Error(`expected sign-chart, got ${visual.kind}`);
  }
  return visual;
}

export function assertDistanceOnLine(visual: PedagogicalVisual): DistanceOnLineVisual {
  if (visual.kind !== "distance-on-line") {
    throw new Error(`expected distance-on-line, got ${visual.kind}`);
  }
  return visual;
}

export function assertCartesianLine(visual: PedagogicalVisual): CartesianLineVisual {
  if (visual.kind !== "cartesian-line") {
    throw new Error(`expected cartesian-line, got ${visual.kind}`);
  }
  return visual;
}

export function assertSystemsOfLines(visual: PedagogicalVisual): SystemsOfLinesVisual {
  if (visual.kind !== "systems-of-lines") {
    throw new Error(`expected systems-of-lines, got ${visual.kind}`);
  }
  return visual;
}

export function assertIntervalSet(visual: PedagogicalVisual): IntervalSetVisual {
  if (visual.kind !== "interval-set") {
    throw new Error(`expected interval-set, got ${visual.kind}`);
  }
  return visual;
}
