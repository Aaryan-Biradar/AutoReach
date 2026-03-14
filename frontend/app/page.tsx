"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import StatCards from "./components/StatCards";
import CallLog from "./components/CallLog";
import { fetchCalls, fetchStats } from "./lib/api";
import type { Call, Stats } from "./lib/api";

const OttawaMap = dynamic(() => import("./components/OttawaMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[520px] flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading map...</p>
    </div>
  ),
});

const defaultStats: Stats = { total: 0, agreed: 0, rejected: 0, callback: 0, no_answer: 0 };

export default function Home() {
  const { data: calls = [] } = useSWR<Call[]>("calls", fetchCalls, {
    refreshInterval: 2000,
  });
  const { data: stats = defaultStats } = useSWR<Stats>("stats", fetchStats, {
    refreshInterval: 2000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              FoodFlow
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              AI-powered outreach for Food for the Capital
            </p>
          </div>
          <Link
            href="/call"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            Start Outreach Call
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <StatCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Live Call Log
            </h2>
            <CallLog calls={calls} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Ottawa Store Map
            </h2>
            <OttawaMap calls={calls} />
          </div>
        </div>
      </main>
    </div>
  );
}
