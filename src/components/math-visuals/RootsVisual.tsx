import type { MathThemeVisualProps } from "./types";

export function RootsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 62h10l8 22 18-51h52" strokeWidth="2.4" opacity="0.78" />
      <text x="70" y="71" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="35">x</text>
      <path d="M93 54h36v36H93zM93 54l36 36" strokeWidth="0.75" opacity="0.44" />
      <path d="M105 73h4l3 8 7-18h18" strokeWidth="0.75" opacity="0.58" />
      <text x="121" y="78" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.62">2</text>
      <path d="M48 90h4l3 8 7-18h18" strokeWidth="0.72" opacity="0.52" />
      <text x="64" y="95" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.58">a²</text>
    </g>
  );
}
