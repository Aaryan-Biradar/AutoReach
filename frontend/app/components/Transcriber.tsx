"use client";

import { useRef, useEffect } from "react";

export interface TranscriberMessage {
  role: string;
  text: string;
  timestamp?: string;
  isFinal?: boolean;
}

interface TranscriberProps {
  conversation: TranscriberMessage[];
}

function Transcriber({ conversation }: TranscriberProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-sm font-semibold text-gray-700">Live Transcript</span>
      </div>

      <div className="overflow-y-auto max-h-80 px-5 py-4 space-y-4">
        {conversation.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Transcript will appear once the call connects...
          </p>
        ) : (
          conversation.map((msg, i) => {
            const isAgent =
              msg.role === "assistant" || msg.role === "bot" || msg.role === "ai";
            const isUser = !isAgent;
            const isPartial = msg.isFinal === false;

            return (
              <div
                key={i}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} ${isPartial ? "opacity-70" : ""}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isAgent
                      ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isAgent ? "AI" : "You"}
                </div>
                <div
                  className={`flex flex-col min-w-0 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}
                >
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-400 mb-0.5">
                      {msg.timestamp}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isAgent
                        ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                        : "bg-amber-50 text-amber-900 rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                    {isPartial && (
                      <span className="inline-block w-[2px] h-3.5 bg-current ml-0.5 align-middle animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default Transcriber;
