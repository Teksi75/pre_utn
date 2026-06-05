import type { MathThemeVisualProps } from "./types";

export function RootsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <text x="29" y="67" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="39">√x</text>
      <path d="M50 41h56" strokeWidth="0.8" opacity="0.55" />
      <path d="M93 54h36v36H93zM93 54l36 36" strokeWidth="0.75" opacity="0.44" />
      <text x="107" y="76" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.62">√2</text>
      <text x="48" y="91" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.58">√a²</text>
    </g>
  );
}
