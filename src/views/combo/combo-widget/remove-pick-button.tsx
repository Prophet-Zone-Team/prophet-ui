import { Minus } from "lucide-react";

export type RemovePickButtonProps = {
  onClick?: () => void;
  label: string;
};

export function RemovePickButton({ onClick, label }: RemovePickButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.4px] border-prophet-muted text-prophet-muted transition-opacity hover:opacity-70"
      aria-label={label}
    >
      <Minus className="size-2.5" strokeWidth={2} aria-hidden />
    </button>
  );
}
