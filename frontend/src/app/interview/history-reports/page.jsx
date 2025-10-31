"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  TrendingUp,
  Filter,
  Search,
  FileText,
  BarChartHorizontal,
  Download,
  ChevronRight,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import { useRouter } from "next/navigation";
import { apiService } from "@/app/api_service";
import { useSelector } from "react-redux";

export default function HistoryReports() {
  const user = useSelector((state) => state.user.user);
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [data, setData] = useState([]);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    fetchInterviews();
    calledRef.current = true;
  }, []);

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "score", label: "Highest Score" },
    { value: "duration", label: "Longest Duration" },
  ];

  const filteredInterviews = useMemo(() => {
    if (!data?.interviews) return [];

    return data.interviews
      .filter((interview) => {
        const domain = interview?.domain ?? "";
        const type = interview?.interview_type ?? "";

        const matchesSearch =
          domain.toLowerCase().includes(searchTerm?.toLowerCase() ?? "") ||
          type.toLowerCase().includes(searchTerm?.toLowerCase() ?? "");

        const matchesStatus =
          filterStatus === "all" || interview?.completion === filterStatus;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          const dateA = new Date(a?.created_at ?? 0);
          const dateB = new Date(b?.created_at ?? 0);
          return dateB - dateA; 
        } else if (sortBy === "score") {
          const scoreA = a?.interview_report?.report?.overallScore ?? 0;
          const scoreB = b?.interview_report?.report?.overallScore ?? 0;
          return scoreB - scoreA; 
        } else if (sortBy === "duration") {
          const durationA = a?.duration ?? 0;
          const durationB = b?.duration ?? 0;
          return durationB - durationA; 
        }
        return 0;
      });
  }, [data, searchTerm, filterStatus, sortBy]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(
        `/history-report/${user?.id}/interview-history`
      );
      if (response?.status) {
        setInterviews(response?.data);
        setData(response?.data);
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedInterviews = () => {
    const completed = data?.interviews?.filter(
      (i) => i.completion === "completed"
    );
    return completed?.length || 0;
  };

  const getAverageScore = () => {
    const scores = data?.interviews
      ?.map((item) => item?.interview_report?.report?.overallScore)
      ?.filter((score) => typeof score === "number");

    if (!scores?.length) return 0;

    const total = scores.reduce((sum, score) => sum + score, 0);
    const avgScore = total / scores.length;

    return Number(avgScore.toFixed(2));
  };

  const getTotalInterviewTime = () => {
    const totalSeconds =
      data?.interviews
        ?.map((item) => item?.duration)
        ?.filter((d) => typeof d === "number" && !isNaN(d))
        ?.reduce((sum, d) => sum + d, 0) || 0;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes} min ${seconds} sec`;
  };

  const getDuration = (durationInSeconds) => {
    if (!durationInSeconds || isNaN(durationInSeconds)) return "0 min 0 sec";

    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;

    return `${minutes} min ${seconds} sec`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Work";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar />

      <main className="flex-1 p-8 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-extrabold text-gray-900">
              History & Reports
            </h1>
            <p className="mt-2 text-gray-500">
              View and analyze your past interview sessions
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Total Interviews
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {data?.interviews?.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Completed
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {getCompletedInterviews()}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Avg Score
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {getAverageScore()}%
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Total Time
                </h3>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {getTotalInterviewTime()}
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by domain or interview type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 rounded-lg border border-gray-300 
                   text-gray-900 placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                   bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 h-11 rounded-lg font-semibold text-sm transition-colors ${
                    filterStatus === "all"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("completed")}
                  className={`px-4 h-11 rounded-lg font-semibold text-sm transition-colors ${
                    filterStatus === "completed"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilterStatus("incomplete")}
                  className={`px-4 h-11 rounded-lg font-semibold text-sm transition-colors ${
                    filterStatus === "incomplete"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Incomplete
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 h-11 rounded-lg border border-gray-300 bg-white 
             text-gray-900 font-semibold text-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
             appearance-auto"
              >
                {sortOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-gray-900 bg-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4">
            {filteredInterviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No interviews found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your filters or search term"
                      : "Start your first interview to see it here"}
                  </p>
                  <Link
                    href="/interview/setup"
                    className="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                  >
                    Start New Interview
                  </Link>
                </div>
              </div>
            ) : (
              filteredInterviews?.map((interview) => (
                <div
                  key={interview?.interview_id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {interview?.domain}
                          </h3>
                          <small className="text-gray-600">
                            {interview?.interview_type} Interview
                          </small>
                        </div>
                        {interview?.completion === "completed" && (
                          <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${getScoreColor(
                              interview?.interview_report?.report?.overallScore
                            )}`}
                          >
                            <TrendingUp className="w-5 h-5" />
                            <div className="text-right">
                              <p className="text-2xl font-extrabold leading-none">
                                {
                                  interview?.interview_report?.report
                                    ?.overallScore
                                }
                              </p>
                              <p className="text-xs font-semibold">
                                {getScoreBadge(
                                  interview?.interview_report?.report
                                    ?.overallScore
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        {(interview?.completion === "pending" ||
                          interview?.completion === "incomplete") && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-gray-50 text-gray-600 border-gray-200">
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm font-bold">
                              Incomplete
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">
                            {formatDate(interview?.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">
                            {getDuration(interview?.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span className="font-semibold">
                            {
                              interview?.detailed_breakdown?.detailed_breakdown ? interview?.detailed_breakdown?.detailed_breakdown
                                ?.length + " Questions" : "Pending"
                            }{" "}
                          </span>
                        </div>
                      </div>

                      {interview?.completion === "completed" && (
                        <div className="flex gap-4 pt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-gray-600">
                              Clarity:{" "}
                              <span className="font-bold text-gray-900">
                                {
                                  interview?.interview_report?.report
                                    ?.clarityScore
                                }
                                %
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-600">
                              Pacing:{" "}
                              <span className="font-bold text-gray-900">
                                {
                                  interview?.interview_report?.report
                                    ?.pacingScore || "-"
                                }
                                %
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex lg:flex-col gap-3 lg:min-w-[200px]">
                      {interview?.completion === "completed" ? (
                        <>
                          <Link
                            href={`/interview/report/${interview?.interview_id}`}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                          >
                            <FileText size={16} />
                            View Report
                          </Link>
                          <Link
                            href={`/interview/report/${interview?.interview_id}/breakdown`}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                          >
                            <BarChartHorizontal size={16} />
                            Breakdown
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/interview/live/session/${interview?.interview_id}`}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                        >
                          Resume Interview
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {filteredInterviews.length > 0 && (
            <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/interview/setup"
                className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                Start New Interview
                <ChevronRight size={18} />
              </Link>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
