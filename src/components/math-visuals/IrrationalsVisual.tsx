import type { MathThemeVisualProps } from "./types";

export function IrrationalsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M105 13c23 31 20 68-5 86-26 19-65 8-76-21-8-22 0-48 20-61" strokeWidth="0.45" opacity="0.32" />
      <path d="M45 52h42v42H45zM45 52l42 42" strokeWidth="0.75" opacity="0.45" />
      <path d="M36 70c-9 9-11 28-5 45M101 17c12 5 33 12 47 23" strokeWidth="0.55" strokeDasharray="2 3" opacity="0.42" />
      <text x="79" y="73" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="70" fontStyle="italic" opacity="0.74">π</text>
      <text x="91" y="86" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7" opacity="0.58">≈ 3.14159265...</text>
      <text x="67" y="78" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="12" opacity="0.58">√2</text>
      <text x="34" y="39" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.42">φ</text>
    </g>
  );
}
