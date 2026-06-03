import { Button } from "./Button";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * "Go back" button used across practice phases. Renders a ghost-style button
 * with default label "← Volver a selección".
 */
export function BackButton({ onClick, label = "← Volver a selección" }: BackButtonProps) {
  return (
    <Button variant="ghost" onClick={onClick} className="inline-flex items-center">
      {label}
    </Button>
  );
}
