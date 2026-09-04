import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

import AuthContext from "../lib/AuthContext";

const BACKGROUND_IMAGES = [
  "/images/login-background.png",
  "/images/8d0f66c5-56b2-4244-afe2-be44082dcaa0.png",
  "/images/816361ee-d49e-4a9d-a18b-61ee8bf90b7a.png",
];

const REMEMBERED_EMAIL_KEY = "sptc_remembered_email";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /*
   * Selects one of the three backgrounds when the page loads.
   * Refreshing the page selects another random image.
   */
  const [backgroundImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[randomIndex];
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      toast.error("All fields are required.");
      return;
    }

    try {
      const response = await login(cleanEmail, password);

      if (!response?.success) {
        toast.error(response?.message || "Login failed");
        return;
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      toast.success("Login successful");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to sign in. Please try again."
      );
    }
  };

  const handleForgotPassword = () => {
    /*
     * Change this route if your forgot-password page uses
     * a different route.
     */
    navigate("/forgot-password");
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-slate-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${backgroundImage}")` }}
    >
      {/* Light overlays for readability without making it too dark */}
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/15 to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/5" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header branding */}
        <header className="flex items-center">
          <div className="ml-3 border-white/40 pl-4 text-white drop-shadow-md">
            <p className="text-base font-extrabold uppercase leading-tight tracking-wide sm:text-xl lg:text-2xl">
              San Pedro Transport
            </p>
            <p className="text-base font-extrabold uppercase leading-tight tracking-wide sm:text-xl lg:text-2xl">
              Cooperative
            </p>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_470px] xl:gap-20">
          {/* Left content */}
          <section className="hidden max-w-3xl self-end pb-8 text-white lg:block xl:pb-12">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.22em] text-white">
              Cooperative Portal
            </p>

            <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.08] tracking-tight drop-shadow-lg xl:text-6xl">
              Moving San Pedro
              <span className="block">Together.</span>
            </h1>

            <div className="my-5 h-1 w-44 rounded-full bg-red-600" />

            <p className="max-w-2xl text-base leading-7 text-white/95 drop-shadow-md xl:text-lg xl:leading-8">
              A unified platform for members and employees of San Pedro Transport
              Cooperative to manage operations, records, reports, and services
              efficiently.
            </p>

            <div className="mt-8 grid max-w-4xl grid-cols-3 divide-x divide-white/30">
              <div className="flex gap-3 pr-5">
                <ShieldCheck size={34} strokeWidth={1.8} className="mt-1 shrink-0 text-red-500" />
                <div>
                  <h2 className="font-bold text-white">Secure Access</h2>
                  <p className="mt-1 text-sm leading-5 text-white/85">
                    Your account is protected with advanced security.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-5">
                <Users size={34} strokeWidth={1.8} className="mt-1 shrink-0 text-red-500" />
                <div>
                  <h2 className="font-bold text-white">Member Focused</h2>
                  <p className="mt-1 text-sm leading-5 text-white/85">
                    Built for the cooperative community we serve.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pl-5">
                <BarChart3 size={34} strokeWidth={1.8} className="mt-1 shrink-0 text-red-500" />
                <div>
                  <h2 className="font-bold text-white">Smart Operations</h2>
                  <p className="mt-1 text-sm leading-5 text-white/85">
                    Streamline tasks and improve efficiency.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Login card */}
          <section className="w-full max-w-[440px] overflow-hidden rounded-[26px] border border-white/60 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.34)] backdrop-blur-xl xl:max-w-[470px]">
            <form onSubmit={handleSubmit} className="px-6 py-7 sm:px-9 sm:py-8 xl:px-10">
              {/* Login header */}
              <div className="mb-7 text-center">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-red-600">
                  Cooperative Portal
                </p>

                <img
                  src="/images/SPTC_LOGO-removebg-preview.png"
                  alt="San Pedro Transport Cooperative logo"
                  className="mx-auto h-36 w-full max-w-[270px] object-contain drop-shadow-sm sm:h-40"
                />

                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  San Pedro Transport Cooperative
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sign in to access your account
                </p>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-white-700">
                  Email
                </label>
                <div className="relative">
                  <Mail aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember and forgot password */}
              <div className="mb-6 flex items-center justify-between gap-3 text-sm">
                <label htmlFor="remember-me" className="flex cursor-pointer items-center gap-2 text-slate-700">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-800 disabled:cursor-not-allowed"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="font-medium text-blue-600 transition hover:text-blue-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign-in button */}
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition duration-200 hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading && <LoaderCircle aria-hidden="true" size={19} className="animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase text-slate-400">
                  Or
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Need an account? Contact your{" "}
                <a
                  href="mailto:sptcadmin@gmail.com"
                  className="font-medium text-blue-600 transition hover:text-blue-800 hover:underline"
                >
                  administrator
                </a>
                .
              </p>
            </form>
          </section>
        </div>

        {/* Footer */}
        <footer className="pb-1 text-center text-xs text-white/90 drop-shadow-md sm:text-sm">
          © {new Date().getFullYear()} San Pedro Transport Cooperative. All rights reserved.
        </footer>
      </div>
    </main>
  );
};

export default LoginPage;