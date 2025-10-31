"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Download,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import { useParams } from "next/navigation";
import { apiService } from "@/app/api_service";

export default function DetailedBreakdown() {
  const params = useParams();
  const interview_id = params.interview_id;
  const [openQuestion, setOpenQuestion] = useState(null);
  const [detailedBreakdown, setDetailedBreakdown] = useState(null);
  const [interviewDuration, setInterviewDuration] = useState(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    getDetailedBreakdown();
    calledRef.current = true;
  }, [interview_id]);

  const getDetailedBreakdown = async () => {
    try {
      const response = await apiService.post(
        `/interview-report/detailed-breakdown/${interview_id}`,
        {"time": localStorage.getItem("interviewTiming")}
      );
      if (response?.status) {
        const parsedBreakdown = JSON.parse(response?.detailed_breakdown);
        const getFormattedDuration = (totalSeconds) => {
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes}m ${seconds}s`;
        };
        setDetailedBreakdown(parsedBreakdown);
        setInterviewDuration(
          getFormattedDuration(response?.interview_duration)
        );
        console.log("Fetched Interview Report:", parsedBreakdown);
      }
    } catch (err) {
      console.error("Error fetching interview report:", err);
    }
  };

  function getAverageScore(breakdown) {
    if (!breakdown || breakdown.length === 0) return 0;
    const totalScore = breakdown.reduce((sum, q) => sum + q.score, 0);
    return Math.round(totalScore / breakdown.length);
  }

  function getCompletionPercentage(breakdown) {
    const totalQuestions = 10;

    if (!breakdown || breakdown.length === 0) return 0;

    const answeredQuestions = breakdown.filter((q) => q.score !== null).length;

    const percentage = (answeredQuestions / totalQuestions) * 100;

    return Math.round(percentage);
  }

  const toggleQuestion = (aiAnalysis) => {
    setOpenQuestion(openQuestion === aiAnalysis ? null : aiAnalysis);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar />

      <main className="flex-1 p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <Link
                href={`/interview/report/${interview_id}`}
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold mb-3 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Report
              </Link>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Detailed Breakdown
              </h1>
              <p className="mt-2 text-gray-500">
                Question-by-question analysis of your interview performance
              </p>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Total Questions
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {detailedBreakdown?.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Average Score
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {getAverageScore(detailedBreakdown)}%
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Total Duration
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {interviewDuration}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Completed
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {getCompletionPercentage(detailedBreakdown)}%
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Question Analysis
            </h2>

            <div className="space-y-4">
              {detailedBreakdown?.map((q, index) => (
                <div
                  key={q.aiAnalysis}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleQuestion(q.aiAnalysis)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 text-left">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                        <span className="text-lg font-bold text-teal-600">
                          Q{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {q.question}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              q.score >= 80
                                ? "bg-green-100 text-green-700"
                                : q.score >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            Score: {q.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      size={24}
                      className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${
                        openQuestion === q.aiAnalysis ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openQuestion === q.aiAnalysis
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-6 pt-0 space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                            Your Answer
                          </h4>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-gray-700 leading-relaxed">
                              {q?.userAnswer}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                            Score Breakdown
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-900">
                                  Clarity
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                  {q.clarityScore}%
                                </span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${q.clarityScore}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-900">
                                  Relevance
                                </span>
                                <span className="text-lg font-bold text-purple-600">
                                  {q.relevanceScore}%
                                </span>
                              </div>
                              <div className="w-full bg-purple-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${q.relevanceScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                            AI Analysis
                          </h4>
                          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                            <p className="text-teal-900 leading-relaxed">
                              {q.aiAnalysis}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckCircle
                                size={16}
                                className="text-green-600"
                              />
                              Strengths
                            </h4>
                            <ul className="space-y-2">
                              {q.strengths.map((strength, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <AlertCircle
                                size={16}
                                className="text-amber-600"
                              />
                              Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                              {q.improvements.map((improvement, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/interview/report/${interview_id}`}
              className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center"
            >
              View Full Report
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
