import type { MathThemeVisualProps } from "./types";

export function PowersVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: 10 }, (_, i) => <path key={`v${i}`} d={`M${24 + i * 9} 28v68`} strokeWidth="0.35" opacity="0.18" />)}
      {Array.from({ length: 7 }, (_, i) => <path key={`h${i}`} d={`M19 ${34 + i * 9}h97`} strokeWidth="0.35" opacity="0.18" />)}
      <path d="M29 55h18v18H29zM66 47h18v18H66zM71 42h18v18H71zM66 47l5-5M84 47l5-5M84 65l5-5" strokeWidth="0.75" opacity="0.54" />
      <text x="27" y="36" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10">2²</text>
      <text x="66" y="34" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10">2³</text>
      <text x="103" y="61" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="13">xⁿ</text>
    </g>
  );
}
