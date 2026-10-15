import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Features from "./pages/Features";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./components/ProductDetail";
import NotificationBell from "./components/NotificationBell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationsPage from "./pages/Notifications";

/* ------------------------------ Navbar ------------------------------ */
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navClass = ({ isActive }) =>
    `transition ${
      isActive ? "font-medium text-white" : "text-gray-400 hover:text-white"
    }`;

  const mobileNavClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2.5 text-sm transition ${
      isActive
        ? "bg-white/5 font-medium text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  const closeMenu = () => setMenuOpen(false);

  /* Lock body scroll while the drawer is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <nav className="relative z-30 mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
            📉
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            PriceNazar
          </span>
        </Link>

        {/* ---------- Desktop links ---------- */}
        <div className="hidden gap-8 text-sm md:flex">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/features" className={navClass}>
            Features
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/add-product" className={navClass}>
                Track a Product
              </NavLink>
            </>
          )}
        </div>

        {/* ---------- Desktop right side ---------- */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <NotificationBell />

              <span className="hidden text-xs text-gray-400 lg:block">
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* ---------- Mobile hamburger ---------- */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/10 md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 h-0.5 w-4 rounded-full bg-white transition-all ${
                menuOpen ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-4 rounded-full bg-white transition-all ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-4 rounded-full bg-white transition-all ${
                menuOpen ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      {menuOpen && (
        <div className="mt-3 space-y-1 rounded-xl border border-white/10 bg-[#0b0f1a]/95 p-2 backdrop-blur md:hidden">
          <NavLink to="/" end className={mobileNavClass} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink
            to="/features"
            className={mobileNavClass}
            onClick={closeMenu}
          >
            Features
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={mobileNavClass}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/add-product"
                className={mobileNavClass}
                onClick={closeMenu}
              >
                Track a Product
              </NavLink>

              <NotificationBell mobileMode />

              <div className="mt-1 border-t border-white/5 pt-2">
                <p className="px-3 pb-1.5 text-[11px] text-gray-500">
                  Signed in as{" "}
                  <span className="text-gray-300">
                    {user?.name || user?.email}
                  </span>
                </p>
                <button
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="mt-1 border-t border-white/5 pt-2">
              <Link
                to="/signin"
                onClick={closeMenu}
                className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f1a] text-white antialiased">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <Navbar />

      <Routes>
        {/* ---------- Public routes ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/features" element={<Features />} />

        {/* ---------- 🔒 Protected routes ---------- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

/* ------------------------------ Root App ------------------------------ */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;