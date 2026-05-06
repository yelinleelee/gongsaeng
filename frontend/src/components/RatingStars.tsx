import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
  readOnly?: boolean;
};

export function RatingStars({ value, onChange, size = 18, readOnly }: Props) {
  const interactive = !readOnly && !!onChange;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            aria-label={`${n} stars`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber-400 stroke-amber-400" : "stroke-slate-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
