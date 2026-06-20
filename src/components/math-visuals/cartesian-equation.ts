import type { CartesianLineData } from "@/domain/visuals/types";

/**
 * Formats a Cartesian line as a human-readable equation label.
 *
 * Keeps the rendering contract explicit and shared between single-line and
 * system-of-lines visuals so the two renderers cannot drift apart.
 */
export function formatCartesianLineEquation(line: CartesianLineData): string {
  switch (line.form) {
    case "slope-intercept":
      return `y = ${line.slope}x ${line.intercept >= 0 ? "+ " : "- "}${Math.abs(line.intercept)}`;
    case "point-slope":
      return `y - ${line.point.y} = ${line.slope}(x - ${line.point.x})`;
    case "two-point":
      return `por (${line.points[0].x}, ${line.points[0].y}) y (${line.points[1].x}, ${line.points[1].y})`;
    case "horizontal":
      return `y = ${line.constant}`;
    case "vertical":
      return `x = ${line.constant}`;
  }
}
