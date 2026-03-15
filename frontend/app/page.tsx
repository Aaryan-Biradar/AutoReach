"use client";

import Link from "next/link";
import { LandingScene } from "./components/landing-scene";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#e4dacd] p-6 text-[#1a1816] sm:p-8">
      {/* Optikka-style warm sand base + subtle coral tint */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #e8e0d4 0%, #e4dacd 40%, #e0d6c8 70%, #e4dacd 100%)",
          backgroundSize: "200% 200%",
          animation: "landing-bg-shift 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 20%, #e95330 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, #d4a574 0%, transparent 35%)`,
          backgroundSize: "200% 200%",
          animation: "landing-bg-shift 20s ease-in-out infinite reverse",
        }}
      />

      <header className="flex w-full shrink-0 items-center justify-between">
        <span className="text-sm font-medium tracking-wide text-[#5c534a] sm:text-base">
          RailTracks
        </span>
        <a
          href="https://github.com/Aaryan-Biradar/AutoReach"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5c534a] transition hover:text-[#1a1816]"
          aria-label="AutoReach on GitHub"
        >
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </header>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#e8e0d4]/90 shadow-inner">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
          <div className="w-full max-w-[480px]">
            <LandingScene />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-[#1a1816] sm:text-5xl md:text-6xl">
              Meet AutoReach
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#5c534a] sm:text-base">
              AI voice outreach for food banks—so coordinators spend less time
              cold-calling and more time helping.
            </p>
          </div>
        </div>
      </main>

      <footer className="grid w-full shrink-0 grid-cols-3 items-center gap-4 pt-4">
        <p className="text-left text-xs font-medium uppercase tracking-[0.2em] text-[#5c534a] sm:text-sm">
          Voice-powered outreach
        </p>
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[#5c534a] sm:text-sm">
          AutoReach Co.
        </p>
        <div className="flex justify-end">
          <Link
            href="/dashboard"
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e95330] text-white transition hover:scale-105 hover:bg-[#d84a28]"
            aria-label="Go to dashboard"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  );
}
