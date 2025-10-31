"use client";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChevronRight,
  Cpu,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

const RedesignedIntroducingIntervIQPage = () => {
  const isAuthenticated = useSelector((state) => state?.user?.isAuthenticated);
  const features = [
    {
      icon: <Bot className="w-8 h-8 text-teal-600" />,
      title: "AI-Powered Conversations",
      description:
        "Engage in realistic, dynamic interviews with an AI that adapts to your responses, providing a true-to-life practice experience.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
      title: "Instant, Actionable Feedback",
      description:
        "Receive detailed performance reports after every session, with scores on clarity, confidence, technical knowledge, and more.",
    },
    {
      icon: <Cpu className="w-8 h-8 text-teal-600" />,
      title: "Role-Specific Scenarios",
      description:
        "Prepare for the exact role you want. From frontend development to product management, our scenarios are tailored to your career path.",
    },
    {
      icon: <Zap className="w-8 h-8 text-teal-600" />,
      title: "Build Confidence",
      description:
        "Practice in a stress-free environment, so you can walk into your real interview feeling prepared, polished, and confident.",
    },
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800">
      <div className="absolute top-0 left-0 -z-10 h-96 w-full bg-gradient-to-br from-teal-50 to-blue-50" />

      <div className="max-w-5xl mx-auto py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white px-4 py-1.5 mb-6 text-sm font-semibold text-teal-700 rounded-full ring-1 ring-inset ring-teal-200/90 hover:bg-teal-50/80 transition-all shadow-md"
          >
            Now in Public Beta
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Link>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Meet <span className="text-teal-600">Interv<span className="text-slate-800">IQ</span></span>.
            <br />
            Your Personal AI Interview Coach.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
            Stop dreading interviews. Start mastering them. We're thrilled to
            announce that Interv-IQ is now available to help you land your dream
            job.
          </p>
        </header>

        <div className="relative aspect-[16/9] rounded-2xl shadow-2xl shadow-teal-200/50 mb-20">
          <div className="w-full h-full bg-white p-4 sm:p-6 rounded-2xl flex items-center justify-center">
            <img
              src="/dashboard.png"
              alt="Interv-IQ Dashboard"
              className="w-full h-full object-contain rounded-lg shadow-md"
            />
          </div>
        </div>

        <article className="prose prose-lg lg:prose-xl max-w-none text-gray-700 mb-20">
          <p>
            For too long, interview preparation has been a frustrating,
            isolating experience. We rehearse answers in front of a mirror but
            never get real, unbiased feedback—<strong>until now</strong>.
          </p>
          <p>
            <strong>Interv-IQ</strong> is an intelligent practice platform
            designed to transform how you prepare for job interviews. By
            harnessing the power of conversational AI, we provide a simulated
            interview environment that is as close to the real thing as it gets.
          </p>
        </article>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-gray-50/80 rounded-xl border border-gray-100 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-white rounded-full mb-4 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-10 sm:p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="mt-3 text-teal-100 max-w-xl mx-auto text-lg">
            Join the beta today and gain the confidence to stand out. Your first
            interview is on us.
          </p>
          <Link href={isAuthenticated ? "/dashboard" : "/auth"} passHref>
            <button className="mt-8 px-8 py-3.5 bg-white text-teal-700 font-semibold text-base rounded-lg shadow-lg hover:scale-105 transition-transform">
              Start Practicing for Free
              <ArrowRight className="inline w-5 h-5 ml-2" />
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default RedesignedIntroducingIntervIQPage;
