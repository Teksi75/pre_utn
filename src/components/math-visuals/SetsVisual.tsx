import type { MathThemeVisualProps } from "./types";

export function SetsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M83 12v100M18 78h136" strokeWidth="0.4" opacity="0.24" />
      <path d="M98 16 39 86M29 83l7 2-2-7M136 50l3-6 3 6" strokeWidth="0.55" opacity="0.34" />
      <circle cx="54" cy="56" r="25" strokeWidth="0.95" fill="currentColor" opacity="0.08" />
      <circle cx="77" cy="56" r="25" strokeWidth="0.95" fill="currentColor" opacity="0.07" />
      <circle cx="100" cy="56" r="25" strokeWidth="0.95" fill="currentColor" opacity="0.06" />
      <circle cx="123" cy="56" r="25" strokeWidth="0.95" fill="currentColor" opacity="0.05" />
      <text x="50" y="58" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">N</text>
      <text x="73" y="58" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">Z</text>
      <text x="96" y="58" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">Q</text>
      <text x="119" y="58" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="7">R</text>
      <text x="65" y="27" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" opacity="0.62">∈</text>
      <text x="88" y="27" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" opacity="0.62">∪</text>
      <text x="111" y="27" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" opacity="0.62">∩</text>
      <text x="66" y="93" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" opacity="0.68">N ⊂ Z ⊂ Q ⊂ R</text>
    </g>
  );
}
