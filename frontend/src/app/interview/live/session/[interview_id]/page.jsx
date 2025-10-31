"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useVisibilityChange } from "@uidotdev/usehooks";
import {
  Send,
  StopCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import { useParams, usePathname, useRouter } from "next/navigation";
import { apiService } from "@/app/api_service";
import { useSelector } from "react-redux";
import Link from "next/link";
import VoiceModeInterview from "@/app/components/VoiceModeInterview";

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5">
    <span className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-pulse" />
    <span className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-pulse delay-150" />
    <span className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-pulse delay-300" />
  </div>
);

const Bubble = ({ sender, text }) => {
  const isAI = sender === "ai";
  return (
    <div className={`flex items-start gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${
          isAI ? "bg-teal-600" : "bg-gray-900"
        }`}
      >
        {isAI ? "AI" : "You"}
      </div>
      <div
        className={
          isAI
            ? "p-4 rounded-xl max-w-xl bg-white border border-gray-200 text-gray-900"
            : "p-4 rounded-xl max-w-xl bg-gray-900 text-white"
        }
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};

export default function Page() {
  let audioInstance = null;
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const tabVisible = useVisibilityChange();
  const interview_id = params.interview_id;
  const user = useSelector((state) => state.user.user);
  const [startInterviewText, setStartInterviewText] =
    useState("Start Interview");
  const [isInterviewResumed, setIsInterviewResumed] = useState(false);
  const [partialCompletionInterview, setPartialCompletionInterview] =
    useState(false);
  const [hidePartialReport, setHidePartialReport] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewData, setInterviewData] = useState(null);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [tabAwayCount, setTabAwayCount] = useState(0);
  const [interviewTimer, setInterviewTimer] = useState(0);
  const [firstAITextAudio, setFirstAITextAudio] = useState(null);
  const [firstAIData, setFirstAIData] = useState(null);

  const [interviewMode, setInterviewMode] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const endRef = useRef(null);
  const timerRef = useRef(0);
  const calledRef = useRef(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (calledRef.current) return;
    receiveInterviewConversation();
    calledRef.current = true;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = (url) => {
      const confirmed = window.confirm(
        "If you leave now, your interview progress will be lost. Do you want to continue?"
      );
      if (!confirmed) {
        throw "Navigation cancelled by user";
      }
    };

    router.events?.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events?.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages, aiTyping]
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  function pcmToWav(
    base64Pcm,
    sampleRate = 24000,
    numChannels = 1,
    bitDepth = 16
  ) {
    const pcmData = atob(base64Pcm);
    const pcmBuffer = new Uint8Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      pcmBuffer[i] = pcmData.charCodeAt(i);
    }

    const wavBuffer = new ArrayBuffer(44 + pcmBuffer.length);
    const view = new DataView(wavBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + pcmBuffer.length, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, pcmBuffer.length, true);

    new Uint8Array(wavBuffer, 44).set(pcmBuffer);

    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  const retrieveFirstAIText = async (data) => {
    try {
      const payload = {
        interview_id,
        domain: data?.domain,
        interview_type: data?.interview_type,
        user_name: user?.name,
      };
      const response = await apiService.post(
        "/interview/receive-first-ai-text",
        payload
      );
      if (response?.status) {
        const conversation = response?.interview_conversation;
        setMessages([
          {
            id: conversation?._id,
            sender: conversation?.sender,
            time: conversation?.updated_at,
            text: conversation?.text,
          },
        ]);
        if (response?.text_audio?.audio) {
          const wavUrl = pcmToWav(response?.text_audio?.audio);
          setFirstAITextAudio(wavUrl);
        }
        setFirstAIData(response);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const retrieveInterview = async () => {
    try {
      const response = await apiService.get(
        `/interview/retrieve-interview/${interview_id}`
      );
      if (response?.status) {
        setInterviewData(response?.interview);
        setInterviewMode(response?.interview?.mode?.toLowerCase());
      }
      return response?.interview;
    } catch (err) {
      console.error(err);
    }
  };

  const receiveInterviewConversation = async () => {
    try {
      const response = await apiService.get(
        `/interview/receive-interview-conversations/${interview_id}`
      );
      if (response?.status) {
        if (response?.interview_conversation?.length <= 0) {
          const interview_data = await retrieveInterview();
          await retrieveFirstAIText(interview_data);
          setPartialCompletionInterview(false);
          localStorage.setItem("interviewTiming", 0);
          setQuestionCount(0);
          setStartInterviewText("Start Interview");
          return;
        }
        timerRef.current = response?.duration ?? 0;
        setTimer(response?.duration ?? 0);
        const questionsCount = response?.interview_conversation?.filter(
          (item) => item?.is_first_message == false && item?.sender === "ai"
        )?.length;
        setInterviewFinished(questionsCount === 10 || questionsCount > 10);
        setIsInterviewResumed(true);
        setStartInterviewText("Resume Interview");
        setPartialCompletionInterview(true);
        localStorage.setItem("interviewTiming", response?.duration);
        setQuestionCount(questionsCount);
        setMessages(response?.interview_conversation);
        setInput("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    try {
      const payload = {
        sender: "user",
        text: input.trim(),
      };

      const response = await apiService.post(
        `/interview/answer-interview-question/${interview_id}`,
        payload , false
      );
      if (response?.status) {
        const conversation = response?.interview_conversation;
        setMessages((prev) => [...prev, conversation]);
        setInput("");
        setHidePartialReport(true);
      }
    } catch (err) {
      console.error("Error: ", err);
    } finally {
      setAiTyping(true);
      setRunning(true);
      getAIResponse(input.trim());
    }
  };

  const getAIResponse = async () => {
    try {
      const response = await apiService.post(
        `/interview/get-ai-response/${interview_id}`,
        { question_count: questionCount },false
      );
      if (response?.status) {
        const conversation = response?.interview_conversation;
        setMessages((prev) => [...prev, conversation]);
        if (questionCount !== 10) {
          setQuestionCount((q) => q + 1);
        }
        setInterviewFinished(response?.interview_finished);
        setStartInterviewText("Resume Interview");
        if (response?.interview_finished) {
          setStartInterviewText("Interview Completed");
          const currentTimer = timerRef.current;
          apiService
            .post("/interview/log-interview-timer", {
              interview_id,
              timer: currentTimer,
            })
            .then(() => setInterviewTimer(currentTimer))
            .catch((err) => console.error("Failed to log timer:", err));
          setTimer(0);
          setRunning(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiTyping(false);
    }
  };


  const endInterview = (e) => {
    e.preventDefault();
    setHidePartialReport(false);
    setInterviewFinished(false);
    setRunning(false);
    setPartialCompletionInterview(true);
    const currentTimer = timerRef.current;
    apiService
      .post("/interview/log-interview-timer", {
        interview_id,
        timer: currentTimer,
        completion: "incomplete",
      })
      .then(() => setInterviewTimer(currentTimer))
      .catch((err) => console.error("Failed to log timer:", err));
    setTimer(0);
  };


  return (
    <div className="min-h-screen bg-[#F6F8FB] flex">
      <Sidebar active="dashboard" />

      {interviewMode === "text" ? (
        <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between bg-white border border-gray-100 rounded-t-2xl px-5 py-4">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-gray-400">Time Elapsed</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatTime(timer)}
                  </p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-400">Question</p>
                  <p className="text-xl font-bold text-gray-800">
                    {questionCount > 10 ? 10 : questionCount} / 10
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!running ? (
                  <button
                    disabled={true}
                    className="h-10 px-5 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
                  >
                    {!interviewFinished && questionCount == 0
                      ? "Start Interview"
                      : "Resume Interview"}
                  </button>
                ) : interviewFinished && !running ? (
                  <button
                    disabled={true}
                    className="h-10 px-5 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Interview Completed
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      endInterview(e);
                    }}
                    className="h-10 px-5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                  >
                    <StopCircle size={18} />
                    End Interview
                  </button>
                )}
              </div>
            </div>

            {showWarning && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 px-5 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Integrity Notice
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Please provide authentic responses based on your own
                    knowledge and experience. All answers are analyzed using
                    advanced AI detection systems to verify originality. Copying
                    from external sources, ChatGPT, or other AI tools will be
                    identified and may result in disqualification. Your honest
                    effort ensures a fair evaluation.
                  </p>
                </div>
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-shrink-0 ml-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-md p-1 transition-colors"
                  aria-label="Dismiss warning"
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
            )}

            <div className="flex-1 bg-white border-x border-b border-gray-100 rounded-b-2xl p-6 space-y-6 overflow-y-auto">
              {messages?.map((m) => (
                <Bubble key={m?.id} sender={m?.sender} text={m?.text} />
              ))}
              {aiTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-200">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="mt-4 space-y-4">
              {!interviewFinished ? (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        !aiTyping && e.key === "Enter" && handleSendMessage();
                      }}
                      placeholder="Type your answer here..."
                      className="w-full h-14 pl-14 pr-32 rounded-full border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 transition"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || aiTyping}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                      aria-label="Send"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  {partialCompletionInterview && !hidePartialReport && (
                    <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-5 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-teal-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-gray-800 font-medium">
                          You can view your partial interview report or continue
                          answering.
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/interview/report/${interview_id}`}
                          className="h-10 px-5 rounded-full bg-white border-2 border-teal-600 text-teal-600 font-semibold hover:bg-teal-600 hover:text-white transition-all"
                        >
                          View Partial Report
                        </Link>
                        <button
                          onClick={() => setHidePartialReport(true)}
                          className="text-gray-500 hover:text-gray-700 transition"
                          aria-label="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <Link
                    href={`/interview/report/${interview_id}`}
                    className="h-14 px-8 rounded-full bg-white border-2 border-teal-600 text-teal-600 font-semibold hover:bg-teal-600 hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Interview Report
                  </Link>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-2xl p-6 h-[calc(100vh-4rem)]">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Interview Mode
              </h3>
              <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                <button
                  disabled={true}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all bg-white text-teal-600 shadow-sm cursor-default`}
                >
                  Text
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 mb-6" />

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Question History
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {messages
                  ?.filter(
                    (m) => m?.sender === "ai" && m?.is_first_message === false
                  )
                  ?.slice(0, 10)
                  ?.map((m, i) => (
                    <div
                      key={m.id}
                      className="text-sm p-3 rounded-md bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                      title={m.text}
                    >
                      <span className="font-semibold text-gray-600 mr-2">
                        {i + 1}.
                      </span>
                      {m.text.length > 70 ? m.text.slice(0, 70) + "…" : m.text}
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </main>
      ) : (
        <VoiceModeInterview
          interview_id={interview_id}
          audio={firstAITextAudio}
          firstAIData={firstAIData}
          pcmToWav={pcmToWav}
        />
      )}
    </div>
  );
}
