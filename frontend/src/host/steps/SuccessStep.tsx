import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export function SuccessStep() {
  return (
    <section className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">등록 완료!</h1>
      <p className="max-w-md text-sm text-slate-500">
        숙소가 등록되었습니다. 호스트 대시보드에서 예약과 숙소를 관리할 수 있어요.
      </p>
      <div className="flex gap-2 pt-2">
        <Link
          to="/host"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          호스트 대시보드
        </Link>
        <Link
          to="/stays"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          숙소 둘러보기
        </Link>
      </div>
    </section>
  );
}
