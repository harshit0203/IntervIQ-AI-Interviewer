"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Play,
  RefreshCw,
  Briefcase,
  Mic,
  BarChart,
  Settings,
  BrainCircuit,
  Type,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import { apiService } from "@/app/api_service";
import { useSelector } from "react-redux";

const SummaryItem = ({ icon, label, value }) => (
  <div className="flex-1 min-w-[120px] bg-teal-50/80 rounded-xl p-4 text-center border border-teal-100/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-teal-200">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xs text-teal-700 uppercase tracking-wider font-semibold">
      {label}
    </p>
    <p className="font-bold text-lg text-teal-900 truncate">{value || "—"}</p>
  </div>
);

const SegmentedControlButton = ({ label, value, selectedValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
      selectedValue === value
        ? "bg-white text-teal-700 shadow-md"
        : "text-slate-500 hover:bg-white/50 hover:text-teal-700"
    }`}
  >
    {label}
  </button>
);

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
}) => (
  <div>
    <label className="text-sm font-medium text-slate-600 mb-2 block">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
      min={min}
    />
  </div>
);

export default function Page() {
  const router = useRouter();
  const user = useSelector((state) => state.user.user);
  const [interviewType, setInterviewType] = useState("Technical");
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Text");
  const [difficulty, setDifficulty] = useState("Easy");
  const [showVoiceWarning, setShowVoiceWarning] = useState(false);
  const [voiceButtonClicked, setVoiceButtonClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const years = parseInt(experience);
    if (!isNaN(years)) {
      if (years <= 2) setDifficulty("Easy");
      else if (years > 2 && years <= 5) setDifficulty("Medium");
      else setDifficulty("Hard");
    } else {
      setDifficulty("Easy");
    }
  }, [experience]);

  const isFormValid = jobRole.trim() !== "" && experience.trim() !== "";

  const handleReset = () => {
    setInterviewType("Technical");
    setJobRole("");
    setExperience("");
    setMode("Text");
    setDifficulty("Easy");
    setError(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);

    if (newMode === "Voice" && !voiceButtonClicked) {
      setShowVoiceWarning(true);
      setVoiceButtonClicked(true);
    }
  };

  const handleStartInterview = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    const payload = {
      user_id: user?.id,
      interview_type: interviewType,
      domain: jobRole,
      experience: String(experience),
      mode,
      difficulty,
    };

    try {
      const response = await apiService.post(
        "/interview/setup-interview",
        payload
      );

      if (!response?.status) {
        throw new Error(response?.message || "Failed to start the interview.");
      }

      router.push(`/interview/live/session/${response?.interview_id}`);
    } catch (err) {
      setError(err?.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#c9f0e8,transparent)]"></div>
      </div>

      <Sidebar active="setup" />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900">
              Interview Setup
            </h1>
            <p className="mt-2 text-slate-600">
              Configure your AI-powered mock interview to match your career
              goals.
            </p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <BrainCircuit size={22} className="text-teal-500" /> Basics
                  </h2>
                  <InputField
                    label="Job Role or Domain"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g., MERN Stack Developer"
                  />
                  <InputField
                    label="Experience (in years)"
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g., 2"
                    min="0"
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">
                      Interview Type
                    </label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none bg-no-repeat"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.5em 1.5em",
                      }}
                    >
                      <option>Technical</option>
                      <option>Managerial / Leadership</option>
                      <option>HR / Behavioral</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings size={22} className="text-teal-500" /> Mode &
                    Difficulty
                  </h2>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-3 block">
                      Interaction Mode
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <SegmentedControlButton
                        label="Text"
                        value="Text"
                        selectedValue={mode}
                        onClick={handleModeChange}
                      />
                      <SegmentedControlButton
                        label="Voice"
                        value="Voice"
                        selectedValue={mode}
                        onClick={handleModeChange}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-sm font-medium text-slate-600">
                        Difficulty
                      </label>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 rounded-lg bg-slate-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Difficulty is auto-set by experience, but you can
                          override it.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <SegmentedControlButton
                        label="Easy"
                        value="Easy"
                        selectedValue={difficulty}
                        onClick={setDifficulty}
                      />
                      <SegmentedControlButton
                        label="Medium"
                        value="Medium"
                        selectedValue={difficulty}
                        onClick={setDifficulty}
                      />
                      <SegmentedControlButton
                        label="Hard"
                        value="Hard"
                        selectedValue={difficulty}
                        onClick={setDifficulty}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-6">
                  Session Summary
                </h2>
                <div className="flex flex-wrap gap-4">
                  <SummaryItem
                    label="Type"
                    value={interviewType}
                    icon={<BrainCircuit size={24} className="text-teal-500" />}
                  />
                  <SummaryItem
                    label="Role"
                    value={jobRole}
                    icon={<Briefcase size={24} className="text-teal-500" />}
                  />
                  <SummaryItem
                    label="Mode"
                    value={mode}
                    icon={
                      mode === "Text" ? (
                        <Type size={24} className="text-teal-500" />
                      ) : (
                        <Mic size={24} className="text-teal-500" />
                      )
                    }
                  />
                  <SummaryItem
                    label="Difficulty"
                    value={difficulty}
                    icon={<BarChart size={24} className="text-teal-500" />}
                  />
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200 shadow-lg">
                {error && (
                  <div className="mb-4 flex items-center gap-3 bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    onClick={handleReset}
                    className="h-12 px-6 rounded-full font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Reset
                  </button>
                  <button
                    onClick={handleStartInterview}
                    disabled={!isFormValid || isLoading}
                    className="h-12 px-8 rounded-full font-semibold text-white transition-all duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Start Interview
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showVoiceWarning && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-30">
            <div className="bg-teal-600/95 backdrop-blur-md border-2 border-teal-500 rounded-2xl px-6 py-4 flex items-start gap-4 shadow-2xl">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">
                  A Note on Voice Mode
                </p>
                <p className="text-xs text-white/90 leading-relaxed">
                  In Voice Mode, interviews must be completed in one session as
                  progress cannot be saved. Please plan accordingly.
                </p>
              </div>

              <button
                onClick={() => setShowVoiceWarning(false)}
                className="flex-shrink-0 text-white/70 hover:text-white p-1 -mr-2 -mt-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
