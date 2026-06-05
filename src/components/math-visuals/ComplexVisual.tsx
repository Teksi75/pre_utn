import type { MathThemeVisualProps } from "./types";

export function ComplexVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M35 78h104M75 101V20M139 78l-5-3M139 78l-5 3M75 20l-3 5M75 20l3 5" strokeWidth="0.75" />
      <path d="M75 78l39-31" strokeWidth="1.2" opacity="0.62" />
      <circle cx="114" cy="47" r="3" fill="currentColor" stroke="none" opacity="0.72" />
      <path d="M92 78c0-7-3-13-8-18" strokeWidth="0.8" opacity="0.54" />
      <path d="M114 47v31M75 47h39" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.42" />
      <text x="123" y="86" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">Re</text>
      <text x="82" y="30" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">Im</text>
      <text x="118" y="45" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="9">z = a + bi</text>
      <text x="91" y="72" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">θ</text>
    </g>
  );
}
