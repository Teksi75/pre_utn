import type { MathThemeVisualProps } from "./types";

export function IntervalsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 62h112M136 62l-5-3M136 62l-5 3" strokeWidth="0.8" />
      <path d="M48 62h48" strokeWidth="2.2" opacity="0.5" />
      <circle cx="48" cy="62" r="3.6" strokeWidth="1.2" fill="white" />
      <circle cx="96" cy="62" r="3.8" strokeWidth="1.2" fill="currentColor" opacity="0.45" />
      <path d="M48 55v14M72 57v10M96 55v14" strokeWidth="0.55" opacity="0.55" />
      <text x="41" y="78" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">a</text>
      <text x="93" y="78" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">b</text>
      <text x="30" y="42" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.62">(-∞, a]</text>
      <text x="86" y="42" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.62">[b, ∞)</text>
    </g>
  );
}
