import { Minus, Plus } from "lucide-react";
import { Button } from "./ui";

export function QtyPicker({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" className={small ? "h-8 w-8" : ""} onClick={() => onChange(value - 1)} aria-label="Menos">
        <Minus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </Button>
      <span className={`w-8 text-center font-semibold ${small ? "text-sm" : "font-display text-lg"}`}>{value}</span>
      <Button variant="outline" size="icon" className={small ? "h-8 w-8" : ""} onClick={() => onChange(value + 1)} aria-label="Mais">
        <Plus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </Button>
    </div>
  );
}
