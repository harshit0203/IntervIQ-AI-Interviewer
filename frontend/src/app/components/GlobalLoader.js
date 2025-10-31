"use client";
import { Bot } from "lucide-react";
import { useSelector } from "react-redux";

export default function GlobalLoader() {
  const loading = useSelector((state) => state.loader.loading);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Outer ping animation */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>

        {/* Central static orb with your icon */}
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg">
          <Bot size={32} />
        </span>
      </div>
    </div>
  );
}
