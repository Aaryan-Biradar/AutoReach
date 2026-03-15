"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Transcriber from "../components/Transcriber";

// ── Config ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────

interface TranscriptMessage {
  role: string;
  text: string;
}

type CallStatus = "idle" | "starting" | "queued" | "ringing" | "in-progress" | "ended";

// ── AI Orb (landing-style cream orb) ─────────────────────────────────────

const ORB_SIZE = 280;
const RADIUS = 110;

function AIOrb({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    function draw(time: number) {
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

      const orbPath = new Path2D();
      orbPath.arc(cx, cy, RADIUS, 0, Math.PI * 2);

      ctx.save();
      ctx.clip(orbPath);

      // Base fill: slightly darker cream inside orb (landing style)
      ctx.fillStyle = "#e2dcc8";
      ctx.fillRect(0, 0, size, size);

      // Moving orbs: cream-matching colours (landing style)
      const speedMul = isActive ? 1.2 : 1;
      const blobs = [
        { color: [165, 148, 118], rx: 0.7, ry: 0.9, spX: 0.4, spY: 0.3, phX: 0, phY: 2, r: 78 },
        { color: [152, 135, 108], rx: 0.8, ry: 0.6, spX: 0.3, spY: 0.5, phX: 1.5, phY: 0.8, r: 72 },
        { color: [142, 125, 98], rx: 0.5, ry: 0.7, spX: 0.5, spY: 0.25, phX: 3, phY: 4, r: 62 },
        { color: [158, 142, 112], rx: 0.6, ry: 0.5, spX: 0.35, spY: 0.45, phX: 5, phY: 1, r: 58 },
      ];
      for (const b of blobs) {
        const bx = cx + Math.sin(t * b.spX * speedMul + b.phX) * RADIUS * b.rx * 0.5;
        const by = cy + Math.cos(t * b.spY * speedMul + b.phY) * RADIUS * b.ry * 0.5;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.95)`);
        grad.addColorStop(0.35, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.6)`);
        grad.addColorStop(0.65, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.2)`);
        grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      }

      // Sweeping arcs (cream tint, landing style)
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 5; i++) {
        const aOff = (i / 5) * Math.PI * 2;
        const sweep = 0.8 + Math.sin(t * 0.6 + i) * 0.4;
        const startA = t * (0.3 + i * 0.08) * speedMul + aOff;
        const pr = RADIUS * (0.45 + i * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, pr, startA, startA + sweep);
        ctx.strokeStyle = `rgba(210,200,180,${0.25 + Math.sin(t + i) * 0.12})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Sparkles (cream/off-white, landing style)
      for (let i = 0; i < 20; i++) {
        const a = t * (0.15 + i * 0.03) + i * 1.25;
        const dr = RADIUS * (0.25 + (i % 7) * 0.09);
        const sx = cx + Math.cos(a) * dr;
        const sy = cy + Math.sin(a) * dr;
        const sparkleAlpha = 0.25 + Math.sin(t * 2 + i * 0.8) * 0.25;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,238,220,${sparkleAlpha})`;
        ctx.fill();
      }

      // Wave bars (voice ring, landing teal/slate gradient)
      const waveBars = 80;
      const waveInner = RADIUS - 18;
      const waveMax = isActive ? 18 : 15;
      const envelope =
        0.55 +
        Math.sin(t * 1.6) * 0.2 +
        Math.sin(t * 2.9) * 0.15 +
        Math.abs(Math.sin(t * 0.7)) * 0.1 +
        (isActive ? 0.08 : 0);

      for (let i = 0; i < waveBars; i++) {
        const angle = (i / waveBars) * Math.PI * 2 - Math.PI / 2;
        const noise =
          Math.sin(t * 8 + i * 0.9) * 0.3 +
          Math.sin(t * 12.5 + i * 1.7) * 0.3 +
          Math.sin(t * 5.3 + i * 2.4) * 0.4;
        const barH = Math.max(3, ((noise + 1) / 2) * waveMax * envelope);
        const x1 = cx + Math.cos(angle) * waveInner;
        const y1 = cy + Math.sin(angle) * waveInner;
        const x2 = cx + Math.cos(angle) * (waveInner - barH);
        const y2 = cy + Math.sin(angle) * (waveInner - barH);
        const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const tc = (Math.sin(normAngle - Math.PI * 0.15) + 1) / 2;
        const tc2 = Math.pow(tc, 1.5);
        const r = Math.round(185 * tc2 + 155 * (1 - tc2));
        const g = Math.round(168 * tc2 + 138 * (1 - tc2));
        const bl = Math.round(142 * tc2 + 115 * (1 - tc2));
        const barAlpha = 0.75 + envelope * 0.22;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${r},${g},${bl},${barAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.restore();

      // Orb outline and highlight (landing style)
      ctx.strokeStyle = "rgba(200,190,170,0.5)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#c4b89a";
      ctx.shadowBlur = 20;
      ctx.stroke(orbPath);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      const hlGrad = ctx.createRadialGradient(cx - 22, cy - 25, 2, cx - 15, cy - 18, 38);
      hlGrad.addColorStop(0, "rgba(248,242,228,0.14)");
      hlGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hlGrad;
      ctx.fill(orbPath);

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} style={{ width: ORB_SIZE, height: ORB_SIZE }} />
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
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [partial, setPartial] = useState<TranscriptMessage | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const streamErrorCountRef = useRef(0);
  const hasAppliedCallIdRef = useRef(false);
  const statusRef = useRef<CallStatus>(status);
  statusRef.current = status;

  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const openStream = useCallback(
    (id: string) => {
      closeStream();
      streamErrorCountRef.current = 0;
      const es = new EventSource(`${API_URL}/api/calls/${id}/stream`);
      esRef.current = es;

      es.onmessage = (event) => {
        streamErrorCountRef.current = 0; // reset on successful message
        try {
          const msg = JSON.parse(event.data);
          const msgType = (msg.type as string) ?? "";

          if (msgType === "transcript" || (typeof msgType === "string" && msgType.startsWith("transcript"))) {
            const inner = msg.message ?? msg;
            const role = (msg.role ?? inner.role ?? "user") as string;
            let rawTranscript: unknown =
              msg.transcript ?? inner.transcript ?? msg.content ?? inner.content;
            if ((rawTranscript === undefined || rawTranscript === null || rawTranscript === "") && msg.artifact?.messages?.length) {
              const messages = msg.artifact.messages as Array<{ message?: string; content?: string }>;
              const last = messages[messages.length - 1];
              rawTranscript = last?.message ?? last?.content ?? "";
            }
            const text = typeof rawTranscript === "string" ? rawTranscript.trim() : "";
            const transcriptType = (msg.transcriptType ?? inner.transcriptType ?? "partial") as string;

            if (!text) return;

            if (transcriptType === "final") {
              setPartial(null);
              setMessages((prev) => [...prev, { role, text }]);
            } else {
              setPartial({ role, text });
            }
          } else if (msgType === "status-update") {
            const raw =
              msg.status ??
              (typeof msg.call === "object" && msg.call !== null ? msg.call.status : null) ??
              (typeof msg.message === "object" && msg.message !== null ? msg.message.status : null);
            const vapiStatus = typeof raw === "string" ? raw.toLowerCase().replace(/_/g, "-") : "";
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
        streamErrorCountRef.current += 1;
        const current = statusRef.current;
        const isLive =
          current === "queued" ||
          current === "ringing" ||
          current === "in-progress" ||
          current === "starting";
        if (isLive && streamErrorCountRef.current >= 1) {
          setStatus("ended");
          setPartial(null);
          closeStream();
        } else if (!isLive && streamErrorCountRef.current >= 2) {
          closeStream();
        }
      };
    },
    [closeStream],
  );

  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  // When navigated from dashboard with ?call_id=..., attach to that call
  useEffect(() => {
    const id = searchParams.get("call_id");
    if (!id || hasAppliedCallIdRef.current) return;
    hasAppliedCallIdRef.current = true;
    setCallId(id);
    setStatus("queued");
    openStream(id);
  }, [searchParams, openStream]);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 pb-10 gap-10 bg-[#fffdf9]">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#e8dcc8] bg-white/90 px-4 py-2 text-sm font-medium text-[#5d534b] shadow-sm transition hover:border-[#d4c4a8] hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
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
        <Transcriber
          conversation={[
            ...messages.map((m) => ({ role: m.role, text: m.text, isFinal: true })),
            ...(partial ? [{ role: partial.role, text: partial.text, isFinal: false }] : []),
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        {(status === "idle" || status === "ended") && (
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-full bg-[#f5a623] hover:bg-[#eb9712] text-[#1f1c19] font-semibold text-sm transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 cursor-pointer"
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
