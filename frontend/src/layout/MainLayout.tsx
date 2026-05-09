import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function MainLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs text-slate-500">
          <span>© 공생 空生</span>
          <span>hierolabs</span>
        </div>
      </footer>
    </div>
  );
}
