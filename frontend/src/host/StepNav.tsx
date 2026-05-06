import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  back?: string;
  next?: string;
  nextLabel?: string;
  disabled?: boolean;
  onNext?: () => void | Promise<void>;
};

export function StepNav({ back, next, nextLabel = "다음", disabled, onNext }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between pt-4">
      {back ? (
        <button
          type="button"
          onClick={() => navigate(back)}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          이전
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={async () => {
          if (onNext) await onNext();
          if (next) navigate(next);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {nextLabel}
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
