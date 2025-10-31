"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Bot,
  Briefcase,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { apiService } from "../api_service";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";
import Cookies from "js-cookie";
import Link from "next/link";

export default function Page() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const formType = searchParams.get("form");
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [isFilled, setIsFilled] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  const isLogin = mode === "login";

  const features = [
    {
      icon: <Bot size={24} className="text-teal-600" />,
      text: "Instant, AI-Powered Feedback",
    },
    {
      icon: <Briefcase size={24} className="text-teal-600" />,
      text: "Tailored, Role-Specific Practice",
    },
    {
      icon: <Award size={24} className="text-teal-600" />,
      text: "Build Real-World Confidence",
    },
  ];

  useEffect(() => {
    (async () => {
      const filled = await checkInputFilled();
      setIsFilled(filled);
    })();
  }, [form, isLogin]);

  useEffect(() => {
    if (!form.confirm_password) {
      setError("");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
    } else {
      setError("");
    }
  }, [form.password, form.confirm_password]);

  useEffect(() => {
    setMode(formType);
  }, [formType]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [features.length]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const payload = isLogin
      ? {
          email: form.email,
          password: form.password,
        }
      : {
          name: form.name,
          email: form.email,
          password: form.password,
          confirm_password: form.confirm_password,
        };

    const url = isLogin ? "/auth/login" : "/auth/register";
    const response = await apiService.post(url, payload);
    if (response.status) {
      if (isLogin) {
        const { user, token, expiresIn } = response;
        dispatch(setUser({ user, token, expiresIn }));
        Cookies.set("auth_token", token, {
          expires: expiresIn / 86400,
          secure: true,
        });

        router.replace("/dashboard");
      } else {
        setMode("login");
      }
    } else {
      setError(response?.message);
    }
  };

  async function checkInputFilled() {
    if (isLogin) {
      return form.email?.trim() && form.password?.trim() ? true : false;
    } else {
      return form.name?.trim() &&
        form.email?.trim() &&
        form.password?.trim() &&
        form.confirm_password?.trim()
        ? true
        : false;
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center">
      <header className="max-w-[1080px] w-full mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-3xl font-bold">
            <span className="text-teal-600">Interv</span>
            <span className="text-black">IQ</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1080px] w-full mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(16,24,40,0.05)] p-10">
            <div className="relative min-h-[330px]">
              <div
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  isLogin ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Welcome back
                </h2>
                <p className="mt-3 text-base text-gray-500">
                  Practice interviews and get instant, personalized feedback.
                </p>

                <div className="mt-8 h-48 rounded-2xl bg-teal-50/70 border border-teal-200/50 flex flex-col items-center justify-center p-6 text-center transition-all duration-500">
                  <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-lg shadow-teal-100/80 mb-4">
                    {features[currentFeature].icon}
                  </div>
                  <p className="font-semibold text-base text-teal-800">
                    {features[currentFeature].text}
                  </p>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">
                  Secure authentication. Your data stays private.
                </p>
              </div>

              <div
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  !isLogin ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Create your account
                </h2>
                <p className="mt-3 text-base text-gray-500">
                  Sign up to get personalized interview practice.
                </p>

                <div className="mt-8 h-48 rounded-2xl bg-teal-50/70 border border-teal-200/50 flex flex-col items-center justify-center p-6 text-center transition-all duration-500">
                  <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-lg shadow-teal-100/80 mb-4">
                    {features[currentFeature].icon}
                  </div>
                  <p className="font-semibold text-base text-teal-800">
                    {features[currentFeature].text}
                  </p>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">
                  We respect your privacy and keep your data secure.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(16,24,40,0.05)] p-10">
            <div className="w-full flex">
              {/* ... (Your Login/Signup toggle buttons) */}
              <div className="bg-gray-100 p-1 rounded-full inline-flex">
                <button
                  aria-pressed={isLogin}
                  onClick={() => setMode("login")}
                  className={`px-5 py-2.5 rounded-full text-base font-semibold transition-all duration-300 ease-in-out ${
                    isLogin
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Login
                </button>
                <button
                  aria-pressed={!isLogin}
                  onClick={() => {
                    setMode("signup");
                  }}
                  className={`px-5 py-2.5 rounded-full text-base font-semibold transition-all duration-300 ease-in-out ${
                    !isLogin
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Signup
                </button>
              </div>
            </div>

            {/* --- NEW: ERROR MESSAGE DISPLAY --- */}
            {/* This block will only render if the 'error' state has a value. */}
            {error && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                submitForm(e);
              }}
              className="mt-6 space-y-5"
            >
              {/* --- All your form fields (Name, Email, Password, etc.) go here --- */}
              {/* ... Name Field ... */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isLogin
                    ? "grid-rows-[0fr] opacity-0"
                    : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="overflow-hidden">
                  <label
                    className="block text-sm font-medium text-gray-500 mb-2"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    onChange={(e) => {
                      handleChange(e);
                    }}
                    name="name"
                    id="name"
                    type="text"
                    placeholder="Name"
                    className="w-full h-12 px-5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* ... Email Field ... */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-500 mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    onChange={(e) => {
                      handleChange(e);
                    }}
                    name="email"
                    id="email"
                    type="email"
                    placeholder="name@email.com"
                    className="w-full h-12 pl-12 pr-5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* ... Password Field ... */}
              <div className="relative">
                <label
                  className="block text-sm font-medium text-gray-500 mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  name="password"
                  onChange={handleChange}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-12 px-5 pr-12 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* ... Confirm Password Field ... */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isLogin
                    ? "grid-rows-[0fr] opacity-0"
                    : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="overflow-hidden relative">
                  <label
                    className="block text-sm font-medium text-gray-500 mb-2"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <input
                    onChange={handleChange}
                    name="confirm_password"
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-12 px-5 pr-12 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFilled || !!error} 
                className={`w-full h-12 rounded-full font-semibold flex justify-center items-center gap-2 transition-colors 
                  ${
                    !isFilled || !!error
                      ? "bg-gray-400 cursor-default text-gray-200"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full 
                   ${!isFilled || !!error ? "bg-gray-300" : "bg-white/20"}`}
                >
                  <ArrowRight size={18} />
                </span>
                Continue
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
