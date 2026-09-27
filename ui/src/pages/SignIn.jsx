import { useState } from "react";

export default function SignIn() {
  const [mode, setMode] = useState("signin"); // "signin" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const isRegister = mode === "register";

  const resetForm = (nextMode) => {
    setMode(nextMode);
    setForm({ name: "", email: "", password: "", confirm: "" });
    setErrors({});
    setShowPassword(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const errs = {};
    if (isRegister && !form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (isRegister && form.confirm !== form.password)
      errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    // TODO: API call
    // signin  -> POST /api/auth/login
    // register-> POST /api/auth/register
    console.log(isRegister ? "Register:" : "Sign in:", form);
    setTimeout(() => setLoading(false), 1200);
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:bg-white/[0.05] ${
      errors[field]
        ? "border-red-500/50 focus:border-red-500"
        : "border-white/10 focus:border-purple-500/60"
    }`;

  return (
    <section className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
            📉
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            PriceNazar
          </span>
        </div>

        {/* Toggle tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-sm">
          <button
            type="button"
            onClick={() => resetForm("signin")}
            className={`rounded-lg py-2 font-medium transition ${
              !isRegister
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => resetForm("register")}
            className={`rounded-lg py-2 font-medium transition ${
              isRegister
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {isRegister
              ? "Start tracking prices in under a minute"
              : "Sign in to continue tracking prices"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="mb-4">
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-medium text-gray-300"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                autoComplete="name"
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder={isRegister ? "At least 6 characters" : "••••••••"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={inputClass("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm password (register only) */}
          {isRegister && (
            <div className="mb-4">
              <label
                htmlFor="confirm"
                className="mb-2 block text-xs font-medium text-gray-300"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? "text" : "password"}
                value={form.confirm}
                onChange={handleChange}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={inputClass("confirm")}
              />
              {errors.confirm && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirm}</p>
              )}
            </div>
          )}

          {/* Extras row */}
          <div className="mb-6 flex items-center justify-between text-xs">
            {isRegister ? (
              <label className="flex items-start gap-2 text-gray-400">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-purple-500"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" className="text-purple-400 hover:text-purple-300">
                    Terms
                  </a>{" "}
                  &{" "}
                  <a href="/privacy" className="text-purple-400 hover:text-purple-300">
                    Privacy
                  </a>
                </span>
              </label>
            ) : (
              <>
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-purple-500"
                  />
                  Remember me
                </label>
                <a
                  href="/forgot-password"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Forgot password?
                </a>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {isRegister ? "Creating account…" : "Signing in…"}
              </>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Bottom switch link */}
        <p className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => resetForm(isRegister ? "signin" : "register")}
            className="font-medium text-purple-400 hover:text-purple-300"
          >
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </section>
  );
}