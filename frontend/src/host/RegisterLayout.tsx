import { Outlet, useLocation } from "react-router-dom";
import { RegisterProvider } from "./RegisterContext";

const STEPS = [
  { path: "type", label: "유형" },
  { path: "concept", label: "컨셉" },
  { path: "basics", label: "기본정보" },
  { path: "description", label: "소개" },
  { path: "location", label: "위치" },
  { path: "photos", label: "사진" },
  { path: "price", label: "가격" },
  { path: "success", label: "완료" },
];

export function RegisterLayout() {
  const location = useLocation();
  const currentIndex = STEPS.findIndex((s) => location.pathname.endsWith(`/${s.path}`));

  return (
    <RegisterProvider>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-4">
        <ProgressBar current={currentIndex < 0 ? 0 : currentIndex} />
        <Outlet />
      </div>
    </RegisterProvider>
  );
}

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>
          {current + 1} / {STEPS.length} · {STEPS[current]?.label}
        </span>
        <span>호스트 등록</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-slate-900 transition-all"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
