import { Mic, MicOff, PhoneOff, Video } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { apiService } from "../api_service";

export default function VoiceModeInterview(props) {
  const userVideoRef = useRef(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [interviewTimer, setInterviewTimer] = useState(0);

  const [running, setRunning] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const [aiQuestionAudio, setAIQuestionAudio] = useState(null);
  const [aiQuestionText, setAIQuestionText] = useState(null);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(0);
  const audioChunksRef = useRef([]);
  const userStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    if (props.audio) {
      const audio = new Audio(props.audio);
      audioRef.current = audio;

      const handleAudioStart = () => setIsAISpeaking(true);
      const handleAudioEnd = () => {
        setIsAISpeaking(false);
        if (!interviewFinished) {
          startUserRecording();
        } else {
          console.log("Interview finished — skipping recording start.");
        }
      };

      audio.addEventListener("play", handleAudioStart);
      audio.addEventListener("ended", handleAudioEnd);

      return () => {
        audio.removeEventListener("play", handleAudioStart);
        audio.removeEventListener("ended", handleAudioEnd);
      };
    }
  }, [props.audio]);

  useEffect(() => {
    if (!aiQuestionAudio) return;

    const audio = new Audio(aiQuestionAudio);
    audioRef.current = audio;

    const handleAudioStart = () => setIsAISpeaking(true);
    const handleAudioEnd = () => {
      setIsAISpeaking(false);
      if (!interviewFinished) {
        startUserRecording();
      } else {
        console.log("Interview finished — skipping recording start.");
      }
    };

    audio.addEventListener("play", handleAudioStart);
    audio.addEventListener("ended", handleAudioEnd);

    audio.currentTime = 0;
    audio
      .play()
      .then(() => console.log("Audio started"))
      .catch((err) => console.error("Audio play error:", err));

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("play", handleAudioStart);
      audio.removeEventListener("ended", handleAudioEnd);
    };
  }, [aiQuestionAudio]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  async function startUserRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    userStreamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    // 🎚️ Real-time mic level tracking
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(avg / 128); // normalize roughly 0–2
      if (mediaRecorder.state === "recording") {
        requestAnimationFrame(updateAudioLevel);
      }
    };
    updateAudioLevel();

    // 🎙️ Collect audio chunks
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    // ⏹️ When recording stops
    mediaRecorder.onstop = () => {
      if (interviewFinished) return;

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      sendAudioToBackend(audioBlob);

      // Cleanup
      audioContext.close();
      setAudioLevel(0);
    };

    // 🔴 Start recording
    mediaRecorder.start();

    // 👇 Start silence detection (integrated)
    detectSilence(analyser, dataArray, audioContext, mediaRecorder);

  } catch (err) {
    console.error("Microphone access error:", err);
  }
}


  function detectSilence(analyser, dataArray, audioContext, mediaRecorder) {
  let silenceDuration = 0;
  const silenceThreshold = 0.02;
  const checkInterval = 200;
  const maxRecordingTime = 60000;
  const startTime = Date.now();

  const checkSilence = () => {
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const isSilent = rms < silenceThreshold;

    if (isSilent) silenceDuration += checkInterval;
    else silenceDuration = 0;

    // Stop after 3s of silence or 60s max duration
    if (silenceDuration >= 3000 || Date.now() - startTime > maxRecordingTime) {
      try {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
      audioContext.close();
      return;
    }

    setTimeout(checkSilence, checkInterval);
  };

  setTimeout(checkSilence, checkInterval);
}


  async function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "user_response.webm");
    formData.append("sender", "user");
    try {
      const response = await apiService.post(
        `/interview/answer-audio-interview-question/${props?.interview_id}`,
        formData,
        false
      );
      if (response?.status) {
        await getAIResponse();
      }
    } catch (err) {
      console.error("Error sending audio to backend:", err);
    }
  }

  const getAIResponse = async () => {
    try {
      const response = await apiService.post(
        `/interview/get-ai-response/${props?.interview_id}`,
        { question_count: questionCount },
        false
      );
      if (response?.status) {
        const wavUrl = props.pcmToWav(response?.text_audio?.audio);
        setAIQuestionAudio(wavUrl);
        setAIQuestionText(response?.question);
        if (questionCount !== 10) {
          setQuestionCount((q) => q + 1);
        }
        setInterviewFinished(response?.interview_finished);
        if (response?.interview_finished) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          const currentTimer = timerRef.current;
          apiService
            .post("/interview/log-interview-timer", {
              interview_id: props?.interview_id,
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
      setIsAISpeaking(false);
    }
  };

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  const startInterview = (e) => {
    e.preventDefault();
    setRunning(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => console.log("Audio started"))
        .catch((err) => console.error("Audio play error:", err));
    }
  };

  const endInterview = (e) => {
    e.preventDefault();
    setRunning(false);
    setInterviewFinished(false);
    const currentTimer = timerRef.current;
    apiService
      .post("/interview/log-interview-timer", {
        interview_id: props?.interview_id,
        timer: currentTimer,
        completion: "incomplete",
      })
      .then(() => setInterviewTimer(currentTimer))
      .catch((err) => console.error("Failed to log timer:", err));
    setTimer(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <main className="flex-1 relative">
      <div className="h-screen w-full relative overflow-hidden">
        <div className="h-full w-full grid grid-cols-2 gap-0">
          <div className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-40 h-40 rounded-full bg-teal-600 flex items-center justify-center text-white text-6xl font-bold shadow-2xl transition-all duration-300 ${
                  isAISpeaking
                    ? "scale-110 ring-8 ring-teal-400 ring-opacity-50"
                    : ""
                }`}
              >
                AI
              </div>
            </div>

            {isAISpeaking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-56 h-56 rounded-full border-4 border-teal-400 animate-ping opacity-20" />
                <div
                  className="absolute w-48 h-48 rounded-full border-4 border-teal-400 animate-ping opacity-30"
                  style={{ animationDelay: "150ms" }}
                />
              </div>
            )}

            {isAISpeaking && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-end justify-center gap-2 h-20">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-teal-400 rounded-full animate-pulse shadow-lg"
                    style={{
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-8 left-8 bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-teal-500/30">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isAISpeaking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <div>
                  <p className="text-white font-bold text-base">
                    AI Interviewer
                  </p>
                  <p className="text-teal-300 text-xs">
                    {isAISpeaking ? "Speaking..." : "Listening"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* User Circle */}
              <div
                className={`w-40 h-40 rounded-full bg-gray-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl transition-all duration-300 ${
                  !isMuted && audioLevel > 0
                    ? "scale-110 ring-8 ring-green-500 ring-opacity-50"
                    : ""
                }`}
              >
                You
              </div>
            </div>

            {/* Animated rings when speaking */}
            {!isMuted && audioLevel > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-56 h-56 rounded-full border-4 border-green-400 animate-ping opacity-20" />
                <div
                  className="absolute w-48 h-48 rounded-full border-4 border-green-400 animate-ping opacity-30"
                  style={{ animationDelay: "150ms" }}
                />
              </div>
            )}

            {/* Bottom Left status */}
            <div className="absolute bottom-8 left-8 bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    !isMuted && audioLevel > 0
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <div>
                  <p className="text-white font-bold text-base">You</p>
                  <p className="text-gray-300 text-xs">
                    {isMuted
                      ? "Muted"
                      : audioLevel > 0
                      ? "Speaking..."
                      : "Listening"}
                  </p>
                </div>
              </div>
            </div>

            {/* Red banner when muted */}
            {isMuted && (
              <div className="absolute top-24 left-8 bg-red-600/95 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl z-50 border-2 border-red-400">
                <MicOff size={22} className="text-white" />
                <span className="text-white font-bold text-base">
                  Microphone Muted
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="bg-gradient-to-b from-black/80 via-black/50 to-transparent p-6">
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-6 bg-black/70 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center shadow-md">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Time</p>
                    <p className="text-lg font-bold text-white">
                      {formatTime(timer)}
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-gray-600" />

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">Q</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      Question
                    </p>
                    <p className="text-lg font-bold text-white">
                      {questionCount > 10 ? 10 : questionCount} / 10
                    </p>
                  </div>
                </div>
              </div>

              {running && (
                <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-full border border-red-400/30 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold">
                    Recording
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-green-500 rounded-full" />
                  <div className="w-1 h-4 bg-green-500 rounded-full" />
                  <div className="w-1 h-5 bg-green-500 rounded-full" />
                </div>
                <span className="text-white text-xs font-semibold">
                  Excellent
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8">
            <div className="max-w-5xl mx-auto pointer-events-auto">
              {running && !interviewFinished && questionCount == 0 ? (
                <div className="mb-6 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">
                        Welcome Message
                      </p>
                      <p className="text-white text-base font-medium leading-relaxed">
                        {props?.firstAIData?.text ||
                          "Welcome to your interview session. When you're ready, click 'Start Interview' to begin."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : running && !interviewFinished && questionCount > 0 ? (
                <div className="mb-6 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-base font-bold shadow-lg">
                      Q{questionCount}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">
                        Current Question
                      </p>
                      <p className="text-white text-base font-medium leading-relaxed">
                        {aiQuestionText}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 ${
                    isMuted
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-700/90 hover:bg-gray-600 backdrop-blur-sm"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff size={24} className="text-white" />
                  ) : (
                    <Mic size={24} className="text-white" />
                  )}
                </button>

                {!running && !interviewFinished ? (
                  <button
                    onClick={(e) => {
                      startInterview(e);
                    }}
                    className="h-16 px-8 rounded-full bg-teal-600 text-white font-bold text-base hover:bg-teal-700 transition-all shadow-2xl hover:shadow-3xl flex items-center gap-3 scale-110"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Interview
                  </button>
                ) : interviewFinished ? (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
                    <div className="bg-teal-600/95 backdrop-blur-md border-2 border-teal-500 rounded-2xl px-6 py-5 flex items-start gap-4 shadow-2xl">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white mb-1">
                          Interview Completed
                        </h3>
                        <p className="text-sm text-white/90 leading-relaxed mb-4">
                          Congratulations! Your detailed analysis is ready. View
                          the report now, or find it later in your history.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <Link
                            href={`/interview/report/${props?.interview_id}`}
                            className="w-full sm:w-auto bg-white text-teal-700 font-bold text-sm py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow"
                          >
                            View Interview Report
                          </Link>
                          <span className="text-sm text-white/80">
                            or check it in{" "}
                            <Link href="/interview/history-reports">
                              <p className="font-semibold text-white hover:underline">
                                History & Reports
                              </p>
                            </Link>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setInterviewFinished(false)}
                        className="flex-shrink-0 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
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
                ) : (
                  <button
                    onClick={(e) => endInterview(e)}
                    className="h-16 px-8 rounded-full bg-red-600 text-white font-bold text-base hover:bg-red-700 transition-all shadow-2xl hover:shadow-3xl flex items-center gap-3 scale-110"
                  >
                    <PhoneOff size={24} />
                    End Interview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showWarning && !running && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
            <div className="bg-amber-500/95 backdrop-blur-md border-2 border-amber-400 rounded-2xl px-6 py-4 flex items-start gap-4 shadow-2xl">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-6 h-6 text-white"
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
                <p className="text-sm font-bold text-white mb-1">
                  Integrity Notice
                </p>
                <p className="text-xs text-white/90 leading-relaxed">
                  Provide authentic responses. AI detection systems verify
                  originality.
                </p>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="flex-shrink-0 text-white hover:text-amber-900 hover:bg-white/20 rounded-lg p-1 transition-colors"
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
          </div>
        )}
      </div>
    </main>
  );
}
