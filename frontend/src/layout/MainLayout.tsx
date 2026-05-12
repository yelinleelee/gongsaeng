import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMatchPolling } from "../lib/useMatchPolling";

export function MainLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 + 알림 ON + 사용자 선호 입력 했을 때만 10분 간격 매칭 폴링
  useMatchPolling();
  const isHome = location.pathname === "/";
  const logoSrc = isHome ? "/logo-1.png" : "/logo-2.png";

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <header
        className={
          isHome
            ? "absolute inset-x-0 top-0 z-20"
            : "sticky top-0 z-10 bg-white"
        }
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6 pb-4">
          <Link to="/">
            <img src={logoSrc} alt="잇다 로고" className="h-20 w-auto" />
          </Link>

          <div className="flex items-center gap-3 text-sm">
            {!ready ? null : user ? (
              <>
                <Link
                  to="/mypage"
                  className={`flex items-center gap-1.5 hover:opacity-80 ${
                    isHome ? "text-white drop-shadow" : "text-slate-900"
                  }`}
                >
                  <UserCircle className="size-4" />
                  <span className="font-semibold">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold hover:opacity-80 ${
                    isHome ? "text-white drop-shadow" : "text-slate-900"
                  }`}
                >
                  <LogOut className="size-3.5" />
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 rounded-md border px-4 py-1.5 font-bold transition-colors ${
                  isHome
                    ? "border-white bg-transparent text-white hover:bg-white hover:text-slate-900"
                    : "border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <LogIn className="size-3.5" />
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full flex-1 ${
          isHome ? "max-w-none px-0 py-0" : "max-w-6xl px-6 py-8"
        }`}
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-300 bg-slate-200">
        {/* px-[18px] + grid-cols-[320px_1fr_auto] 로 FAQ 섹션의 우측 컨텐츠 시작점(=320px)에 2단 정확히 정렬. 3단은 auto + 1fr 로 우측 끝에 붙음 */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-[18px] py-6 md:grid-cols-[320px_1fr_auto]">
          {/* Logo */}
          <div>
            <img
              src="/logo-2.png"
              alt="ITDA"
              className="h-[60px] w-auto"
            />
          </div>

          {/* Data sources + copyright */}
          <div
            className="text-xs text-slate-600"
            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
          >
            <p className="font-black text-slate-900">데이터 출처</p>
            <ul className="mt-2 space-y-1">
              <li>서울 열린데이터광장</li>
              <li>서울시 공공서비스예약</li>
              <li>네이버 지도 API</li>
            </ul>
            <p className="mt-4 text-slate-400">© 2026 ITDA.</p>
          </div>

          {/* Company info + legal */}
          <div
            className="text-xs text-slate-600"
            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
          >
            <p>상호 : 잇다</p>
            <p className="mt-1">대표 : 아로</p>
            <div className="mt-4 space-y-1.5">
              <a href="#" className="block transition-colors hover:text-slate-900">
                개인정보 처리 방침
              </a>
              <a href="#" className="block transition-colors hover:text-slate-900">
                서비스 이용약관
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
