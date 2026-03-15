(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/call/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CallPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
// ── Config ───────────────────────────────────────────────────────────────
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") ?? "http://localhost:8000";
// ── AI Orb (canvas) ─────────────────────────────────────────────────────
const ORB_SIZE = 280;
const RADIUS = 110;
function AIOrb({ active }) {
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const frameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const activeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    activeRef.current = active;
    const draw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AIOrb.useCallback[draw]": (time)=>{
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
                {
                    color: [
                        147,
                        51,
                        234
                    ],
                    rx: 0.7,
                    ry: 0.9,
                    spX: 0.4,
                    spY: 0.3,
                    phX: 0,
                    phY: 2,
                    r: 70
                },
                {
                    color: [
                        59,
                        130,
                        246
                    ],
                    rx: 0.8,
                    ry: 0.6,
                    spX: 0.3,
                    spY: 0.5,
                    phX: 1.5,
                    phY: 0.8,
                    r: 65
                },
                {
                    color: [
                        192,
                        132,
                        252
                    ],
                    rx: 0.5,
                    ry: 0.7,
                    spX: 0.5,
                    spY: 0.25,
                    phX: 3,
                    phY: 4,
                    r: 55
                },
                {
                    color: [
                        99,
                        102,
                        241
                    ],
                    rx: 0.6,
                    ry: 0.5,
                    spX: 0.35,
                    spY: 0.45,
                    phX: 5,
                    phY: 1,
                    r: 50
                }
            ];
            for (const b of blobs){
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
            for(let i = 0; i < 5; i++){
                const aOff = i / 5 * Math.PI * 2;
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
            for(let i = 0; i < 20; i++){
                const a = t * (0.15 + i * 0.03) + i * 1.25;
                const dr = RADIUS * (0.25 + i % 7 * 0.09);
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
            const envelope = isActive ? 0.6 + Math.sin(t * 1.6) * 0.2 + Math.sin(t * 2.9) * 0.15 + Math.abs(Math.sin(t * 0.7)) * 0.1 : 0.55 + Math.sin(t * 1.6) * 0.2 + Math.sin(t * 2.9) * 0.15 + Math.abs(Math.sin(t * 0.7)) * 0.1;
            for(let i = 0; i < WAVE_BARS; i++){
                const angle = i / WAVE_BARS * Math.PI * 2 - Math.PI / 2;
                const noise = Math.sin(t * 8 + i * 0.9) * 0.3 + Math.sin(t * 12.5 + i * 1.7) * 0.3 + Math.sin(t * 5.3 + i * 2.4) * 0.4;
                const barH = Math.max(2, (noise + 1) / 2 * WAVE_MAX * envelope);
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
        }
    }["AIOrb.useCallback[draw]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AIOrb.useEffect": ()=>{
            frameRef.current = requestAnimationFrame(draw);
            return ({
                "AIOrb.useEffect": ()=>cancelAnimationFrame(frameRef.current)
            })["AIOrb.useEffect"];
        }
    }["AIOrb.useEffect"], [
        draw
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
        ref: canvasRef,
        style: {
            width: ORB_SIZE,
            height: ORB_SIZE
        }
    }, void 0, false, {
        fileName: "[project]/app/call/page.tsx",
        lineNumber: 162,
        columnNumber: 5
    }, this);
}
_s(AIOrb, "eEHD4uQyTMkeBV8IwkLq4xAHihM=");
_c = AIOrb;
// ── Transcript Panel ────────────────────────────────────────────────────
function TranscriptPanel({ messages, partial }) {
    _s1();
    const bottomRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TranscriptPanel.useEffect": ()=>{
            bottomRef.current?.scrollIntoView({
                behavior: "smooth"
            });
        }
    }["TranscriptPanel.useEffect"], [
        messages,
        partial
    ]);
    const allMessages = partial ? [
        ...messages,
        partial
    ] : messages;
    const hasPartial = partial !== null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-5 py-3 border-b border-gray-100 flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "relative flex h-2 w-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                            }, void 0, false, {
                                fileName: "[project]/app/call/page.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "relative inline-flex rounded-full h-2 w-2 bg-green-500"
                            }, void 0, false, {
                                fileName: "[project]/app/call/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-semibold text-gray-700",
                        children: "Live Transcript"
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 186,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-y-auto max-h-80 px-5 py-4 space-y-4",
                children: [
                    allMessages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-400 text-center py-6",
                        children: "Transcript will appear once the call connects..."
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 196,
                        columnNumber: 11
                    }, this) : allMessages.map((msg, i)=>{
                        const isAgent = msg.role === "assistant" || msg.role === "bot";
                        const isLast = i === allMessages.length - 1;
                        const isPartialMsg = isLast && hasPartial;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: isPartialMsg ? "opacity-60" : undefined,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 mb-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-xs font-semibold ${isAgent ? "text-purple-700" : "text-amber-600"}`,
                                        children: isAgent ? "Alex" : "Store Manager"
                                    }, void 0, false, {
                                        fileName: "[project]/app/call/page.tsx",
                                        lineNumber: 207,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/call/page.tsx",
                                    lineNumber: 206,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-700 leading-relaxed",
                                    children: [
                                        msg.text,
                                        isLast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-[2px] h-3.5 bg-purple-700 ml-0.5 align-middle animate-blink"
                                        }, void 0, false, {
                                            fileName: "[project]/app/call/page.tsx",
                                            lineNumber: 214,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/call/page.tsx",
                                    lineNumber: 211,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/app/call/page.tsx",
                            lineNumber: 205,
                            columnNumber: 15
                        }, this);
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: bottomRef
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 194,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/call/page.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
_s1(TranscriptPanel, "eaUWg0io6wE0buoFSqU1QLjVsUo=");
_c1 = TranscriptPanel;
// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const config = {
        idle: {
            label: "Ready",
            color: "bg-gray-100 text-gray-500"
        },
        starting: {
            label: "Starting...",
            color: "bg-yellow-100 text-yellow-700"
        },
        queued: {
            label: "Queued",
            color: "bg-yellow-100 text-yellow-700"
        },
        ringing: {
            label: "Ringing...",
            color: "bg-blue-100 text-blue-700"
        },
        "in-progress": {
            label: "In Progress",
            color: "bg-green-100 text-green-700"
        },
        ended: {
            label: "Call Ended",
            color: "bg-gray-100 text-gray-600"
        }
    };
    const { label, color } = config[status];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`,
        children: [
            (status === "ringing" || status === "in-progress") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "relative flex h-2 w-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 245,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "relative inline-flex rounded-full h-2 w-2 bg-current"
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 244,
                columnNumber: 9
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "[project]/app/call/page.tsx",
        lineNumber: 242,
        columnNumber: 5
    }, this);
}
_c2 = StatusBadge;
function CallPage() {
    _s2();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [callId, setCallId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [partial, setPartial] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const esRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const closeStream = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CallPage.useCallback[closeStream]": ()=>{
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        }
    }["CallPage.useCallback[closeStream]"], []);
    const openStream = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CallPage.useCallback[openStream]": (id)=>{
            closeStream();
            const es = new EventSource(`${API_URL}/api/calls/${id}/stream`);
            esRef.current = es;
            es.onmessage = ({
                "CallPage.useCallback[openStream]": (event)=>{
                    try {
                        const msg = JSON.parse(event.data);
                        const msgType = msg.type;
                        if (msgType === "transcript") {
                            const role = msg.role;
                            const text = msg.transcript;
                            const transcriptType = msg.transcriptType;
                            if (transcriptType === "final") {
                                setPartial(null);
                                setMessages({
                                    "CallPage.useCallback[openStream]": (prev)=>[
                                            ...prev,
                                            {
                                                role,
                                                text
                                            }
                                        ]
                                }["CallPage.useCallback[openStream]"]);
                            } else {
                                setPartial({
                                    role,
                                    text
                                });
                            }
                        } else if (msgType === "status-update") {
                            const vapiStatus = msg.status;
                            if (vapiStatus === "in-progress") setStatus("in-progress");
                            else if (vapiStatus === "ringing") setStatus("ringing");
                            else if (vapiStatus === "queued") setStatus("queued");
                            else if ([
                                "ended",
                                "completed",
                                "failed",
                                "canceled"
                            ].includes(vapiStatus)) {
                                setStatus("ended");
                                setPartial(null);
                                closeStream();
                            }
                        } else if (msgType === "end-of-call-report") {
                            setStatus("ended");
                            setPartial(null);
                            closeStream();
                        }
                    } catch  {
                    // malformed SSE payload, ignore
                    }
                }
            })["CallPage.useCallback[openStream]"];
            es.onerror = ({
                "CallPage.useCallback[openStream]": ()=>{
                    closeStream();
                }
            })["CallPage.useCallback[openStream]"];
        }
    }["CallPage.useCallback[openStream]"], [
        closeStream
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CallPage.useEffect": ()=>{
            return ({
                "CallPage.useEffect": ()=>closeStream()
            })["CallPage.useEffect"];
        }
    }["CallPage.useEffect"], [
        closeStream
    ]);
    const handleStart = async ()=>{
        setStatus("starting");
        setMessages([]);
        setPartial(null);
        setCallId(null);
        try {
            const res = await fetch(`${API_URL}/api/calls/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                status: status
            }, void 0, false, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 354,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row items-center gap-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AIOrb, {
                                active: status === "in-progress"
                            }, void 0, false, {
                                fileName: "[project]/app/call/page.tsx",
                                lineNumber: 358,
                                columnNumber: 11
                            }, this),
                            status === "in-progress" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400 font-medium tracking-wide uppercase",
                                children: "Call in progress"
                            }, void 0, false, {
                                fileName: "[project]/app/call/page.tsx",
                                lineNumber: 360,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 357,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TranscriptPanel, {
                        messages: messages,
                        partial: partial
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 365,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 356,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-2",
                children: [
                    (status === "idle" || status === "ended") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleStart,
                        className: "px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 cursor-pointer",
                        children: status === "ended" ? "Call Again" : "Start Call"
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 370,
                        columnNumber: 11
                    }, this),
                    isLive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 px-8 py-3 rounded-full bg-gray-100 text-gray-500 font-medium text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "animate-spin h-4 w-4",
                                viewBox: "0 0 24 24",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        className: "opacity-25",
                                        cx: "12",
                                        cy: "12",
                                        r: "10",
                                        stroke: "currentColor",
                                        strokeWidth: "4",
                                        fill: "none"
                                    }, void 0, false, {
                                        fileName: "[project]/app/call/page.tsx",
                                        lineNumber: 380,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        className: "opacity-75",
                                        fill: "currentColor",
                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    }, void 0, false, {
                                        fileName: "[project]/app/call/page.tsx",
                                        lineNumber: 381,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/call/page.tsx",
                                lineNumber: 379,
                                columnNumber: 13
                            }, this),
                            status === "starting" ? "Triggering call..." : status === "queued" ? "Queued..." : status === "ringing" ? "Ringing..." : "Listening..."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 378,
                        columnNumber: 11
                    }, this),
                    callId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] text-gray-300 font-mono mt-1",
                        children: callId
                    }, void 0, false, {
                        fileName: "[project]/app/call/page.tsx",
                        lineNumber: 387,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 368,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `
            }, void 0, false, {
                fileName: "[project]/app/call/page.tsx",
                lineNumber: 393,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/call/page.tsx",
        lineNumber: 353,
        columnNumber: 5
    }, this);
}
_s2(CallPage, "J+vo/I7bZIpbtLtvkxIC9L+9GTQ=");
_c3 = CallPage;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "AIOrb");
__turbopack_context__.k.register(_c1, "TranscriptPanel");
__turbopack_context__.k.register(_c2, "StatusBadge");
__turbopack_context__.k.register(_c3, "CallPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_af1a94d6._.js.map