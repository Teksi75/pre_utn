import type { MathThemeVisualProps } from "./types";

export function LogsVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M35 86V24M27 78h104" strokeWidth="0.75" />
      <path d="M38 92c2-31 11-45 28-53 18-8 38-9 62-10" strokeWidth="1.5" opacity="0.58" />
      <path d="M50 78v6M68 78v4M95 78v4M124 78v4" strokeWidth="0.45" opacity="0.45" />
      <text x="73" y="44" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="12">log(x)</text>
      <text x="108" y="64" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" opacity="0.6">ln(x)</text>
    </g>
  );
}
