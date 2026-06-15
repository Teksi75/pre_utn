"use client";

import { KaTeXBlock } from "./KaTeXBlock";

interface InlineMathProps {
  readonly tex: string;
  readonly className?: string;
}

export function InlineMath({ tex, className }: InlineMathProps) {
  return <KaTeXBlock expression={tex} displayMode={false} className={className} />;
}
