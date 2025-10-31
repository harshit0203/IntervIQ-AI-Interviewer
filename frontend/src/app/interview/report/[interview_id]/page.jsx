"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Download,
  RotateCw,
  BarChartHorizontal,
  Target,
  Clock,
  User,
  Icon,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import { useParams } from "next/navigation";
import { apiService } from "@/app/api_service";
import Link from "next/link";

const StatCard = ({ title, score, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-teal-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{score}%</p>
    </div>
  </div>
);

const FeedbackItem = ({ text, type }) => (
  <div className="flex items-start gap-3">
    <div className="w-5 h-5 mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center bg-opacity-10">
      {type === "strength" ? (
        <CheckCircle className="w-5 h-5 text-teal-500" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-500" />
      )}
    </div>
    <p className="text-sm text-gray-700">{text}</p>
  </div>
);

export default function Page() {
  const params = useParams();
  const interview_id = params?.interview_id;
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    getInterviewReport();
    calledRef.current = true;
  }, []);

  const checkInterviewMode = async () => {
    try {
      const response = await apiService.get(
        `/interview/check-interview-mode/${interview_id}`
      );
      return response?.mode;
    } catch (err) {
      console.error("Error checking interview mode:", err);
    }
  };

  const getInterviewReport = async () => {
    try {
      const interviewTime = localStorage.getItem("interviewTiming");
      const checkMode = await checkInterviewMode();

      const payload = checkMode === "Voice" ? {} : { time: interviewTime };
      const response = await apiService.post(
        `/interview-report/generate-report/${interview_id}`,
        payload
      );
      if (response?.status) {
        const parsedReport = JSON.parse(response?.report);
        setReport(parsedReport);
      }
    } catch (err) {
      console.error("Error fetching interview report:", err);
    }
  };

  const downloadFullReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const blob = await apiService.get(
        `/interview-report/download-report/${interview_id}`,
        null,
        "blob"
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Interview_Report_${interview_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading full report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar />

      <main className="flex-1 p-8 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-extrabold text-gray-900">
              Interview Report
            </h1>
            <p className="mt-2 text-gray-500">
              Here's a summary of your performance. Well done!
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="sm:col-span-2 lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold text-gray-800">Overall Score</h3>
              <div className="relative my-3">
                <svg
                  className="w-28 h-28 transform -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={
                      2 * Math.PI * 54 * (1 - report?.overallScore / 100)
                    }
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-teal-600">
                  {report?.overallScore}
                </span>
              </div>
              <p className="text-xs text-gray-400">Based on AI analysis</p>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                title="Clarity Score"
                score={report?.clarityScore}
                icon={CheckCircle}
              />
              <StatCard
                title="Pacing Score"
                score={report?.pacingScore}
                icon={Clock}
              />
              <Link
                href={`/interview/report/${interview_id}/breakdown`}
                className="sm:col-span-2 flex items-center justify-between p-6 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                <div>
                  <p className="font-bold text-lg">Detailed Breakdown</p>
                  <p className="text-sm text-gray-300">
                    Get a question-by-question analysis.
                  </p>
                </div>
                <BarChartHorizontal />
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Overall Summary
            </h2>
            <p className="text-gray-600 leading-relaxed">{report?.summary}</p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  AI Response Likelihood
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Analysis of response authenticity
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                    report?.aiLikelihood?.assessment === "Low"
                      ? "bg-green-100 text-green-700"
                      : report?.aiLikelihood?.level === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {report?.aiLikelihood?.assessment}
                </span>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-gray-900">
                    {report?.aiLikelihood?.score}%
                  </div>
                  <div className="text-xs text-gray-400">AI Score</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-600 leading-relaxed">
                {report?.aiLikelihood?.description}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Strengths
                </h2>
                <div className="space-y-4">
                  {report?.strengths?.map((item, index) => (
                    <FeedbackItem key={index} text={item} type="strength" />
                  ))}
                </div>
              </section>
              <div className="border-t border-gray-100"></div>
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Areas for Improvement
                </h2>
                <div className="space-y-4">
                  {report?.areasForImprovement?.map((item, index) => (
                    <FeedbackItem key={index} text={item} type="improvement" />
                  ))}
                </div>
              </section>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Suggested Resources
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {report?.suggestedResources?.map((res, index) => (
                  <a
                    key={index}
                    href={res?.url}
                    target="_blank"
                    className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {res?.title}
                    </span>
                  </a>
                ))}
              </div>
              <div className="border-t border-gray-100 my-6"></div>
              <button
                onClick={(e) => {
                  downloadFullReport(e);
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <Download size={16} />{" "}
                {loading ? "Generating PDF..." : "Download Full Report"}
              </button>
            </div>
          </section>

          <footer className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/interview/setup"
              className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw size={18} />
              Try Another Interview
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
