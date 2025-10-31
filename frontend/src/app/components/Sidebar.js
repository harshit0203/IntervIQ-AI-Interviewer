"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
  PlusSquare,
  History,
  ArrowLeft,
  Home,
} from "lucide-react";
import { logout } from "../redux/userSlice";
import { useDispatch } from "react-redux";

export default function Sidebar() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [isInterviewsOpen, setIsInterviewsOpen] = useState(false);

  const isPathActive = (path, isSubItem = false) => {
    if (isSubItem) {
      return pathname === path;
    }
    if (path === "/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const logoutFunc = (event) => {
    event.preventDefault();
    dispatch(logout());
    window.location.href = "/";
  };

  const navItemClasses = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors duration-200 ${
      isPathActive(path) && !path.startsWith("/interview")
        ? "bg-teal-600 text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`;

  const subNavItemClasses = (path) =>
    `flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm transition-colors ${
      isPathActive(path, true)
        ? "bg-teal-50 text-teal-700 font-semibold"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`;

  useEffect(() => {
    setIsInterviewsOpen(pathname.startsWith("/interview"));
  }, [pathname]);

  return (
    <aside className="sticky top-0 h-screen w-64 bg-white flex flex-col p-6 rounded-r-2xl shadow-sm border-r border-gray-100 overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <Link href="/dashboard" className="text-2xl font-bold">
          <span className="text-teal-600">Interv</span>
          <span className="text-black">IQ</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.back()}
            title="Go Back"
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <Link
            href="/"
            title="Go to Home"
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Home size={18} />
          </Link>
        </div>
      </div>

      <nav className="flex flex-col space-y-2 flex-1">
        <Link href="/dashboard" className={navItemClasses("/dashboard")}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <div>
          <button
            onClick={() => setIsInterviewsOpen(!isInterviewsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold transition-colors duration-200 ${
              isPathActive("/interview")
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList size={20} />
              <span>Interviews</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${
                isInterviewsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isInterviewsOpen
                ? "grid-rows-[1fr] opacity-100 pt-2"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden space-y-1 pl-5">
              <Link
                href="/interview/setup"
                className={subNavItemClasses("/interview/setup")}
              >
                <PlusSquare size={16} />
                <span>New Interview</span>
              </Link>
              <Link
                href="/interview/history-reports"
                className={subNavItemClasses("/interview/history-reports")}
              >
                <History size={16} />
                <span>History & Reports</span>
              </Link>
            </div>
          </div>
        </div>

        <Link href="/profile" className={navItemClasses("/profile")}>
          <User size={20} />
          <span>Profile</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-1">
        <Link
          href="/"
          onClick={(e) => {
            logoutFunc(e);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
