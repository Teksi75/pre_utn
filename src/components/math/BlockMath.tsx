"use client";

import { KaTeXBlock } from "./KaTeXBlock";

interface BlockMathProps {
  readonly tex: string;
  readonly className?: string;
}

export function BlockMath({ tex, className }: BlockMathProps) {
  return <KaTeXBlock expression={tex} displayMode={true} className={className} />;
}
