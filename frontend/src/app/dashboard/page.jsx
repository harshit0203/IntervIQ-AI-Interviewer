"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Mic,
  MessageSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useSelector } from "react-redux";
import { Box, Tooltip } from "@mui/material";
import Link from "next/link";
import { apiService } from "../api_service";
import ReactECharts from "echarts-for-react";

export default function Page() {
  const user = useSelector((state) => state?.user?.user);
  const [data, setData] = useState(null);
  const [interviewCount, setInterviewCount] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [checkIfHasData, setCheckIfHasData] = useState(false);

  const RATING_CONFIG = {
    excellent: {
      title: "Excellent",
      Icon: TrendingUp,
      containerClass: "bg-teal-50/50 border-teal-200",
      textClass: "text-teal-700",
    },
    good: {
      title: "Good",
      Icon: Zap,
      containerClass: "bg-green-50/50 border-green-200",
      textClass: "text-green-700",
    },
    improvement: {
      title: "Needs Improvement",
      Icon: TrendingDown,
      containerClass: "bg-amber-50/50 border-amber-200",
      textClass: "text-amber-700",
    },
    poor: {
      title: "Poor",
      Icon: AlertTriangle,
      containerClass: "bg-red-50/50 border-red-200",
      textClass: "text-red-700",
    },
  };
  const sessionLabels = overallScore?.map((_, i) => `Session ${i + 1}`);
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const { name, value } = params[0];
        return `${name}<br/><b>${value}</b>`;
      },
      backgroundColor: "#111827",
      textStyle: { color: "#fff" },
    },
    grid: {
      top: 30,
      left: 20,
      right: 20,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sessionLabels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#9CA3AF", fontSize: 11 },
    },
    yAxis: {
      show: false,
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
      axisLabel: { color: "#9CA3AF", fontSize: 11 },
    },
    series: [
      {
        data: overallScore,
        type: "bar",
        barWidth: "50%",
        itemStyle: {
          color: "#14B8A6",
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: "#0D9488",
          },
        },
      },
    ],
  };

  const getRating = (score) => {
    if (score >= 85) return RATING_CONFIG.excellent;
    if (score >= 70) return RATING_CONFIG.good;
    if (score >= 50) return RATING_CONFIG.improvement;
    return RATING_CONFIG.poor;
  };

  const { title, Icon, containerClass, textClass } = getRating(
    snapshotData?.["highest_clarity_score"]
  );

  useEffect(() => {
    getData();
    getPerformanceSnapshot();
    getOverallScore();
  }, []);

  async function getOverallScore() {
    try {
      const response = await apiService.get(
        `/dashboard/overall-scores/${user?.id}`
      );
      if (response?.status) {
        setOverallScore(response?.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  async function getData() {
    try {
      const response = await apiService.get(`/dashboard/stats/${user?.id}`);
      if (response?.status) {
        setData(response?.interviews);
        setInterviewCount(response?.total_interviews);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  async function getPerformanceSnapshot() {
    try {
      const response = await apiService.get(
        `/dashboard/performance-snapshot/${user?.id}`
      );
      if (response?.status) {
        setSnapshotData(response);

        if (
          response?.average_overall_score !== undefined &&
          response?.highest_clarity_score !== undefined &&
          response?.highest_overall_score !== undefined &&
          response?.interview_type
        ) {
          setCheckIfHasData(true);
        } else {
          setCheckIfHasData(false);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDuration = (durationInSeconds) => {
    if (!durationInSeconds || isNaN(durationInSeconds)) return "0 min 0 sec";

    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;

    return `${minutes} min ${seconds} sec`;
  };

  const aPerformanceData = {
    topSkill: { name: "Technical Knowledge", score: 92 },
    improvementArea: { name: "Clarity of Communication", score: 68 },
    averageScore: 81,
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar active="dashboard" />

      <main className="flex-1 p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="mt-1 text-gray-500">
                Practice makes progress. Pick up where you left off or start a
                new session.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/interview/setup"
                className="h-12 px-6 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Start New Interview
              </Link>
              <Tooltip title={user?.name || "User"} placement="bottom">
                <Box
                  component="span"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {user?.avatar ? (
                    <img
                      src={user?.avatar}
                      alt="User"
                      className="w-11 h-11 rounded-full border border-gray-200 shadow-sm transition-transform group-hover:scale-105 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-base border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                      {user?.name
                        ?.split(" ")
                        ?.map((n) => n[0])
                        ?.join("")
                        ?.toUpperCase()
                        ?.slice(0, 2) || "U"}
                    </div>
                  )}
                </Box>
              </Tooltip>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_4px_16px_rgba(16,24,40,0.03)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Recent Sessions
                    </h2>
                    <p className="text-sm text-gray-400">
                      Your latest mock interviews at a glance
                    </p>
                  </div>
                </div>
                {console.log("Data==", data)}
                {data && data.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.map((s) => {
                      let overallScore = 0;
                      try {
                        const report = JSON.parse(s?.interview_reports?.report);
                        overallScore = report?.overallScore ?? 0;
                      } catch (e) {
                        console.error("Failed to parse interview report:", e);
                      }

                      return (
                        <div
                          key={s?._id}
                          className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow"
                        >
                          <div>
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                              {s?.domain || "General"}
                            </span>
                            <p className="text-xs text-gray-400">
                              {getDuration(s?.interview_timer)} <b>&middot;</b>{" "}
                              {formatDate(s?.created_at)}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">
                            {overallScore}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-700">
                      No Sessions Available
                    </h3>
                    <p className="text-gray-500 mt-2">
                      You have not completed any interview sessions yet.
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-3xl bg-white border border-gray-100 shadow-[0_4px_16px_rgba(16,24,40,0.03)] p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Performance Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-teal-50/50">
                    <div className="flex items-center text-teal-700 mb-2">
                      <TrendingUp size={18} className="mr-2" />
                      <p className="text-sm font-semibold">Top Skill</p>
                    </div>
                    <p className="text-base font-bold text-gray-800">
                      {checkIfHasData
                        ? snapshotData?.["interview_type"] + "Knowledge"
                        : "-"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {checkIfHasData
                        ? `${snapshotData?.["highest_overall_score"]}% Accuracy`
                        : "-"}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${containerClass}`}>
                    <div className={`flex items-center mb-2 ${textClass}`}>
                      <Icon size={18} className="mr-2" />
                      <p className="text-sm font-semibold">{title}</p>
                    </div>
                    <p className="text-base font-bold text-gray-800">
                      Clarity of Communication
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {checkIfHasData
                        ? `${snapshotData?.["highest_clarity_score"]}% Accuracy`
                        : "-"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center text-gray-600 mb-2">
                      <Star size={18} className="mr-2" />
                      <p className="text-sm font-semibold">Average Score</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">
                      {checkIfHasData
                        ? snapshotData?.["average_overall_score"] +"%"
                        : "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Across all interviews
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_16px_rgba(16,24,40,0.03)] p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Progress
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Scores over recent sessions
                </p>

                <ReactECharts
                  option={option}
                  style={{ height: "200px", width: "100%" }}
                />

                <p className="text-center text-xs text-gray-400 mt-2">
                  Last {overallScore?.length} sessions
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/interview/setup"
                    className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-teal-500 shadow-[0_4px_16px_rgba(16,24,40,0.03)] transition-all"
                  >
                    <Mic className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Start voice interview
                      </p>
                      <p className="text-xs text-gray-500">
                        Simulated phone/video style
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/interview/setup"
                    className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-teal-500 shadow-[0_4px_16px_rgba(16,24,40,0.03)] transition-all"
                  >
                    <MessageSquare className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Start text interview
                      </p>
                      <p className="text-xs text-gray-500">
                        Chat-based practice
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/interview/history-reports"
                    className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-teal-500 shadow-[0_4px_16px_rgba(16,24,40,0.03)] transition-all"
                  >
                    <FileText className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        View reports
                      </p>
                      <p className="text-xs text-gray-500">
                        Detailed feedback history
                      </p>
                    </div>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
