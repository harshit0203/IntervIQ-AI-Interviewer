"use client";
import {
  Play,
  Mic,
  BotMessageSquare,
  Sparkles,
  BarChart,
  FileText,
  Lock,
  ChevronRight,
  LogOut,
  ArrowRight,
  CheckCircle,
  Award,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./redux/userSlice";

const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);
};

export default function Home() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state?.user?.isAuthenticated);
  const user = useSelector((state) => state?.user?.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useScrollAnimation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-teal-500" />,
      title: "Personalized Reports",
      description:
        "Receive detailed feedback on your performance, highlighting your strengths and areas for improvement.",
    },
    {
      icon: <BarChart className="w-8 h-8 text-teal-500" />,
      title: "Progress Tracking",
      description:
        "Monitor your improvement over time with our analytics dashboard and track your scores.",
    },
    {
      icon: <BotMessageSquare className="w-8 h-8 text-teal-500" />,
      title: "Realistic Scenarios",
      description:
        "Practice with interview questions tailored to specific roles like SWE, Product Management, and more.",
    },
    {
      icon: <Lock className="w-8 h-8 text-teal-500" />,
      title: "Private & Secure",
      description:
        "Your interview data and recordings are encrypted and accessible only to you.",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Create an Account",
      description: "Sign up for free and tell us which role you're targeting.",
    },
    {
      number: 2,
      title: "Choose Your Interview",
      description:
        "Select from text or voice modes and pick a difficulty level.",
    },
    {
      number: 3,
      title: "Start Practicing",
      description:
        "Begin your mock interview and get instant, actionable feedback from our AI.",
    },
  ];

  const benefits = [
    {
      icon: <Award className="w-7 h-7 text-teal-600" />,
      title: "Build Real Confidence",
      description:
        "Practice in a stress-free zone to eliminate interview anxiety.",
    },
    {
      icon: <BarChart className="w-7 h-7 text-teal-600" />,
      title: "Actionable Insights",
      description: "Receive detailed reports on your performance and clarity.",
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/"
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-50 w-full border-b border-slate-100/80 bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-2xl font-bold flex items-center gap-2"
              >
                <span className="text-teal-600">
                  Interv<span className="text-slate-800">IQ</span>
                </span>
              </Link>
            </div>

            {user?.id && user?.id !== null ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-full hover:bg-teal-700 transition-colors shadow-sm"
                >
                  Go to Dashboard
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full h-10 w-10 sm:w-auto sm:p-1.5 border border-slate-200 bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm font-semibold text-slate-800 pr-2">
                      {user?.name}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden animate-fade-in-up">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <nav className="p-1">
                        <Link
                          href="/dashboard"
                          className="flex sm:hidden items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                          <BotMessageSquare size={16} /> Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  href="/auth?form=login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth?form=signup"
                  className="group inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-full hover:bg-slate-900 transition-colors shadow"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#c9f0e8,transparent)]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-animate">
            <Link
              href="/blog/introducing-interv-iq"
              className="inline-flex items-center justify-center bg-white px-3 py-1 mb-6 text-sm font-medium text-teal-700 rounded-full ring-1 ring-inset ring-teal-200/80 hover:bg-teal-50 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2 text-teal-500" />
              <span>Now in Public Beta! Read the announcement</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
              Nail Your Next Interview with AI
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 mb-10">
              Practice live interviews, get instant, AI-powered feedback, and
              track your progress. IntervIQ is your personal coach to help you
              land your dream tech job.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-teal-600 border border-transparent rounded-full shadow-lg hover:bg-teal-700 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2 -ml-1" />
                Start Free Simulation
              </Link>
              <a
                href="#features"
                className="group inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-full shadow-sm hover:bg-slate-100 transition-colors"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28 scroll-animate">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50 rounded-2xl p-2.5 border border-slate-200/80">
              {/* 
        FIX #1: Changed the background from bg-slate-100 to bg-white.
        This removes the grey bars from the top and bottom.
      */}
              <div className="aspect-video bg-white rounded-xl flex items-center justify-center p-4 sm:p-6">
                <img
                  src="/interview.png"
                  alt="IntervIQ Live Interview Preview"
                  /* 
            FIX #2: Ensured the class is 'object-contain'.
            This makes the entire image visible without cropping.
          */
                  className="rounded-lg shadow-lg w-full h-full object-contain"
                />
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-slate-500">
              A clean and intuitive interface for your interview practice.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-slate-100/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto scroll-animate">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Everything You Need to Succeed
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                From real-time feedback to progress tracking, IntervIQ offers a
                comprehensive toolset for interview preparation.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-8 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-teal-100/80 hover:border-teal-200 hover:-translate-y-2 scroll-animate"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-center w-14 h-14 mb-6 bg-teal-50 rounded-full border-2 border-teal-100 group-hover:bg-teal-100 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 bg-gray-50/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* --- Header --- */}
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              From signup to your first session in under five minutes. Here’s
              how to begin your journey to interview mastery.
            </p>

            {/* --- Steps List --- */}
            <div className="mt-12 max-w-lg mx-auto text-left">
              <ol className="space-y-10">
                {steps.map((step) => (
                  <li key={step.number} className="flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-white border-2 border-teal-200 rounded-full text-teal-600 font-bold text-xl shadow-sm">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-slate-600">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* --- "Perfect For You If..." Section --- */}
            <div className="mt-16 pt-12 border-t border-slate-200">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center text-slate-800 mb-6">
                  Is{" "}
                  <span className="text-teal-600">
                    Interv<span className="text-slate-800">IQ</span>
                  </span>{" "}
                  Right For You?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start p-4 bg-white rounded-lg shadow-md border border-slate-100">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        You get nervous before interviews
                      </h4>
                      <p className="text-slate-600">
                        Practice in a safe space to build confidence and
                        overcome anxiety.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start p-4 bg-white rounded-lg shadow-md border border-slate-100">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        You want feedback you can trust
                      </h4>
                      <p className="text-slate-600">
                        Get unbiased, AI-driven insights on your clarity, tone,
                        and technical accuracy.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start p-4 bg-white rounded-lg shadow-md border border-slate-100">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        You need to prepare for a specific role
                      </h4>
                      <p className="text-slate-600">
                        Access tailored questions for your target job, for
                        Software Engineers and Developers.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Take the next step in your career. Start practicing with IntervIQ
              today and build the confidence to succeed.
            </p>
            <div className="mt-10">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-800 bg-white border border-transparent rounded-full shadow-lg hover:bg-slate-100 transition-all transform hover:scale-105"
              >
                Start Your Free Trial Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} IntervIQ. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Designed & Built by{" "}
              <a
                href="https://www.linkedin.com/in/harshit-sharma-190230244/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-600 hover:underline"
              >
                Harshit Sharma
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
