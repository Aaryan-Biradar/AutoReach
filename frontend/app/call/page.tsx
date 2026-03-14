"use client";

import { useRef, useEffect, useCallback, useState } from "react";

// ── Config ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────

interface TranscriptMessage {
  role: string;
  text: string;
}

type CallStatus = "idle" | "starting" | "queued" | "ringing" | "in-progress" | "ended";

// ── AI Orb (canvas) ─────────────────────────────────────────────────────

const ORB_SIZE = 280;
const RADIUS = 110;

function AIOrb({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const activeRef = useRef(false);
  activeRef.current = active;

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = ORB_SIZE;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
    }

    const cx = size / 2;
    const cy = size / 2;
    const t = time / 1000;
    const isActive = activeRef.current;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = "#0e0b1a";
    ctx.fillRect(0, 0, size, size);

    const speedMul = isActive ? 1.6 : 1;
    const blobs = [
      { color: [147, 51, 234], rx: 0.7, ry: 0.9, spX: 0.4, spY: 0.3, phX: 0, phY: 2, r: 70 },
      { color: [59, 130, 246], rx: 0.8, ry: 0.6, spX: 0.3, spY: 0.5, phX: 1.5, phY: 0.8, r: 65 },
      { color: [192, 132, 252], rx: 0.5, ry: 0.7, spX: 0.5, spY: 0.25, phX: 3, phY: 4, r: 55 },
      { color: [99, 102, 241], rx: 0.6, ry: 0.5, spX: 0.35, spY: 0.45, phX: 5, phY: 1, r: 50 },
    ];

    for (const b of blobs) {
      const bx = cx + Math.sin(t * b.spX * speedMul + b.phX) * RADIUS * b.rx * 0.5;
      const by = cy + Math.cos(t * b.spY * speedMul + b.phY) * RADIUS * b.ry * 0.5;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.8)`);
      grad.addColorStop(0.6, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.2)`);
      grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const aOff = (i / 5) * Math.PI * 2;
      const sweep = 0.8 + Math.sin(t * 0.6 + i) * 0.4;
      const startA = t * (0.3 + i * 0.08) * speedMul + aOff;
      const pr = RADIUS * (0.45 + i * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy, pr, startA, startA + sweep);
      ctx.strokeStyle = `rgba(200,180,255,${0.25 + Math.sin(t + i) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < 20; i++) {
      const a = t * (0.15 + i * 0.03) + i * 1.25;
      const dr = RADIUS * (0.25 + (i % 7) * 0.09);
      const sx = cx + Math.cos(a) * dr;
      const sy = cy + Math.sin(a) * dr;
      const sparkleAlpha = 0.3 + Math.sin(t * 2 + i * 0.8) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha})`;
      ctx.fill();
    }

    // Voice waveform ring
    const WAVE_BARS = 80;
    const WAVE_INNER = RADIUS - 18;
    const WAVE_MAX = isActive ? 18 : 14;
    const envelope = isActive
      ? 0.6 + Math.sin(t * 1.6) * 0.2 + Math.sin(t * 2.9) * 0.15 + Math.abs(Math.sin(t * 0.7)) * 0.1
      : 0.55 + Math.sin(t * 1.6) * 0.2 + Math.sin(t * 2.9) * 0.15 + Math.abs(Math.sin(t * 0.7)) * 0.1;

    for (let i = 0; i < WAVE_BARS; i++) {
      const angle = (i / WAVE_BARS) * Math.PI * 2 - Math.PI / 2;
      const noise =
        Math.sin(t * 8 + i * 0.9) * 0.3 +
        Math.sin(t * 12.5 + i * 1.7) * 0.3 +
        Math.sin(t * 5.3 + i * 2.4) * 0.4;
      const barH = Math.max(2, ((noise + 1) / 2) * WAVE_MAX * envelope);
      const x1 = cx + Math.cos(angle) * WAVE_INNER;
      const y1 = cy + Math.sin(angle) * WAVE_INNER;
      const x2 = cx + Math.cos(angle) * (WAVE_INNER - barH);
      const y2 = cy + Math.sin(angle) * (WAVE_INNER - barH);
      const barAlpha = 0.4 + envelope * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(192,132,252,${barAlpha})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(147,51,234,0.3)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#9333ea";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const hlGrad = ctx.createRadialGradient(cx - 30, cy - 35, 2, cx - 20, cy - 25, 45);
    hlGrad.addColorStop(0, "rgba(255,255,255,0.12)");
    hlGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.fill();

    frameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas ref={canvasRef} style={{ width: ORB_SIZE, height: ORB_SIZE }} />
  );
}

// ── Transcript Panel ────────────────────────────────────────────────────

function TranscriptPanel({
  messages,
  partial,
}: {
  messages: TranscriptMessage[];
  partial: TranscriptMessage | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partial]);

  const allMessages = partial ? [...messages, partial] : messages;
  const hasPartial = partial !== null;

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
        {allMessages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Transcript will appear once the call connects...
          </p>
        ) : (
          allMessages.map((msg, i) => {
            const isAgent = msg.role === "assistant" || msg.role === "bot";
            const isLast = i === allMessages.length - 1;
            const isPartialMsg = isLast && hasPartial;
            return (
              <div key={i} className={isPartialMsg ? "opacity-60" : undefined}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${isAgent ? "text-purple-700" : "text-amber-600"}`}>
                    {isAgent ? "Alex" : "Store Manager"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {msg.text}
                  {isLast && (
                    <span className="inline-block w-[2px] h-3.5 bg-purple-700 ml-0.5 align-middle animate-blink" />
                  )}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CallStatus }) {
  const config: Record<CallStatus, { label: string; color: string }> = {
    idle: { label: "Ready", color: "bg-gray-100 text-gray-500" },
    starting: { label: "Starting...", color: "bg-yellow-100 text-yellow-700" },
    queued: { label: "Queued", color: "bg-yellow-100 text-yellow-700" },
    ringing: { label: "Ringing...", color: "bg-blue-100 text-blue-700" },
    "in-progress": { label: "In Progress", color: "bg-green-100 text-green-700" },
    ended: { label: "Call Ended", color: "bg-gray-100 text-gray-600" },
  };

  const { label, color } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {(status === "ringing" || status === "in-progress") && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CallPage() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [partial, setPartial] = useState<TranscriptMessage | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const openStream = useCallback(
    (id: string) => {
      closeStream();
      const es = new EventSource(`${API_URL}/api/calls/${id}/stream`);
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const msgType = msg.type as string;

          if (msgType === "transcript") {
            const role = msg.role as string;
            const text = msg.transcript as string;
            const transcriptType = msg.transcriptType as string;

            if (transcriptType === "final") {
              setPartial(null);
              setMessages((prev) => [...prev, { role, text }]);
            } else {
              setPartial({ role, text });
            }
          } else if (msgType === "status-update") {
            const vapiStatus = msg.status as string;
            if (vapiStatus === "in-progress") setStatus("in-progress");
            else if (vapiStatus === "ringing") setStatus("ringing");
            else if (vapiStatus === "queued") setStatus("queued");
            else if (["ended", "completed", "failed", "canceled"].includes(vapiStatus)) {
              setStatus("ended");
              setPartial(null);
              closeStream();
            }
          } else if (msgType === "end-of-call-report") {
            setStatus("ended");
            setPartial(null);
            closeStream();
          }
        } catch {
          // malformed SSE payload, ignore
        }
      };

      es.onerror = () => {
        closeStream();
      };
    },
    [closeStream],
  );

  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  const handleStart = async () => {
    setStatus("starting");
    setMessages([]);
    setPartial(null);
    setCallId(null);
    try {
      const res = await fetch(`${API_URL}/api/calls/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[start call]", err);
        setStatus("idle");
        return;
      }
      const data = await res.json();
      setCallId(data.call_id);
      setStatus(data.status === "queued" ? "queued" : "ringing");
      openStream(data.call_id);
    } catch (err) {
      console.error("[start call]", err);
      setStatus("idle");
    }
  };

  const isLive = status === "ringing" || status === "in-progress" || status === "queued" || status === "starting";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-10">
      <StatusBadge status={status} />

      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex flex-col items-center gap-3">
          <AIOrb active={status === "in-progress"} />
          {status === "in-progress" && (
            <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">
              Call in progress
            </span>
          )}
        </div>
        <TranscriptPanel messages={messages} partial={partial} />
      </div>

      <div className="flex flex-col items-center gap-2">
        {(status === "idle" || status === "ended") && (
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 cursor-pointer"
          >
            {status === "ended" ? "Call Again" : "Start Call"}
          </button>
        )}
        {isLive && (
          <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-gray-100 text-gray-500 font-medium text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {status === "starting" ? "Triggering call..." : status === "queued" ? "Queued..." : status === "ringing" ? "Ringing..." : "Listening..."}
          </div>
        )}
        {callId && (
          <span className="text-[10px] text-gray-300 font-mono mt-1">
            {callId}
          </span>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
