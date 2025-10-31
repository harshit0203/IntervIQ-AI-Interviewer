import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./redux/Providers";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "./components/GlobalLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IntervIQ | Smart Interview Preparation & Simulation",
  description:
    "IntervIQ is an AI-powered platform that helps candidates prepare for technical, HR, and behavioral interviews with realistic simulations, instant feedback, and personalized guidance.",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <GlobalLoader />
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#fff",
              padding: "16px",
              borderRadius: "10px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
