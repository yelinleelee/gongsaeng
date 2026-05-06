import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function MainLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            gongsaeng
          </Link>

          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <NavLink
              to="/stays"
              className={({ isActive }) =>
                isActive ? "text-slate-900" : "hover:text-slate-900"
              }
            >
              Stays
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "text-slate-900" : "hover:text-slate-900"
              }
            >
              About
            </NavLink>
            <NavLink
              to="/neighborhood"
              className={({ isActive }) =>
                isActive ? "text-slate-900" : "hover:text-slate-900"
              }
            >
              동네 매칭
            </NavLink>
            {user && (
              <NavLink
                to="/bookings/my"
                className={({ isActive }) =>
                  isActive ? "text-slate-900" : "hover:text-slate-900"
                }
              >
                My bookings
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  isActive ? "text-slate-900" : "hover:text-slate-900"
                }
              >
                Messages
              </NavLink>
            )}
            {user?.role === "host" && (
              <NavLink
                to="/host/bookings"
                className={({ isActive }) =>
                  isActive ? "text-slate-900" : "hover:text-slate-900"
                }
              >
                Host
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {!ready ? null : user ? (
              <>
                <Link
                  to="/mypage"
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
                >
                  <UserCircle className="size-5" />
                  <span>{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                <LogIn className="size-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs text-slate-500">
          <span>© gongsaeng</span>
          <span>hierolabs</span>
        </div>
      </footer>
    </div>
  );
}
