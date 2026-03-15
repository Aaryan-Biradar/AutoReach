"use client";

import { useRef, useEffect } from "react";

const W = 480;
const H = 480;
const cx = W / 2;
const cy = H / 2;
const RADIUS = 165;

export function LandingScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    function draw(time: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const t = time / 1000;

      canvas.width = W;
      canvas.height = H;
      ctx.clearRect(0, 0, W, H);

      const orbPath = new Path2D();
      orbPath.arc(cx, cy, RADIUS, 0, Math.PI * 2);

      ctx.save();
      ctx.clip(orbPath);

      // Base fill: slightly darker cream inside orb
      ctx.fillStyle = "#e2dcc8";
      ctx.fillRect(0, 0, W, H);

      // Moving orbs: four blobs with sin/cos motion (cream-matching colours)
      const blobs = [
        { color: [165, 148, 118], rx: 0.7, ry: 0.9, spX: 0.4, spY: 0.3, phX: 0, phY: 2, r: 118 },
        { color: [152, 135, 108], rx: 0.8, ry: 0.6, spX: 0.3, spY: 0.5, phX: 1.5, phY: 0.8, r: 110 },
        { color: [142, 125, 98], rx: 0.5, ry: 0.7, spX: 0.5, spY: 0.25, phX: 3, phY: 4, r: 95 },
        { color: [158, 142, 112], rx: 0.6, ry: 0.5, spX: 0.35, spY: 0.45, phX: 5, phY: 1, r: 88 },
      ];
      for (const b of blobs) {
        const bx = cx + Math.sin(t * b.spX + b.phX) * RADIUS * b.rx * 0.5;
        const by = cy + Math.cos(t * b.spY + b.phY) * RADIUS * b.ry * 0.5;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.95)`);
        grad.addColorStop(0.35, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.6)`);
        grad.addColorStop(0.65, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.2)`);
        grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Sweeping arcs (orb style), cream tint
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 5; i++) {
        const aOff = (i / 5) * Math.PI * 2;
        const sweep = 0.8 + Math.sin(t * 0.6 + i) * 0.4;
        const startA = t * (0.3 + i * 0.08) + aOff;
        const pr = RADIUS * (0.45 + i * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, pr, startA, startA + sweep);
        ctx.strokeStyle = `rgba(210,200,180,${0.25 + Math.sin(t + i) * 0.12})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Sparkles (cream/off-white)
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

      // Wave bars (voice ring)
      const waveBars = 80;
      const waveInner = RADIUS - 27;
      const waveMax = 22;
      const envelope = 0.55 + Math.sin(t * 1.6) * 0.2 + Math.sin(t * 2.9) * 0.15 + Math.abs(Math.sin(t * 0.7)) * 0.1;

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
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.restore();

      ctx.strokeStyle = "rgba(200,190,170,0.5)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#c4b89a";
      ctx.shadowBlur = 27;
      ctx.stroke(orbPath);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      const hlGrad = ctx.createRadialGradient(cx - 42, cy - 48, 3, cx - 27, cy - 33, 63);
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
    <div className="flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="max-h-full max-w-full"
        aria-hidden
      />
    </div>
  );
}
