import type { MathThemeVisualProps } from "./types";

export function AbsoluteVisual({ className }: MathThemeVisualProps) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M25 64h108M79 54v20M45 58v12M113 58v12" strokeWidth="0.8" />
      <path d="M45 51c11-13 23-13 34 0M113 51c-11-13-23-13-34 0" strokeWidth="0.9" opacity="0.52" />
      <path d="M52 50l-7 1 3-6M106 50l7 1-3-6" strokeWidth="0.9" opacity="0.52" />
      <text x="75" y="84" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">0</text>
      <text x="39" y="84" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">-a</text>
      <text x="109" y="84" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="8">a</text>
      <text x="66" y="38" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="18">|x|</text>
    </g>
  );
}
