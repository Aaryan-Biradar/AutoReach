"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const gridRef = useRef<{
    cols: number;
    rows: number;
    squares: Float32Array;
    dpr: number;
  } | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const rgbaPrefix = useMemo(() => {
    if (typeof window === "undefined") {
      return "rgba(0, 0, 0,";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");

    if (!context) {
      return "rgba(0, 0, 0,";
    }

    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = Array.from(
      context.getImageData(0, 0, 1, 1).data,
    );

    return `rgba(${red}, ${green}, ${blue},`;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    function setupCanvas(nextWidth: number, nextHeight: number) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = nextWidth * dpr;
      canvas.height = nextHeight * dpr;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;

      const cols = Math.floor(nextWidth / (squareSize + gridGap));
      const rows = Math.floor(nextHeight / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);

      for (let index = 0; index < squares.length; index += 1) {
        squares[index] = Math.random() * maxOpacity;
      }

      gridRef.current = { cols, rows, squares, dpr };
      setCanvasSize({ width: nextWidth, height: nextHeight });
    }

    function updateCanvasSize() {
      const nextWidth = width || container.clientWidth;
      const nextHeight = height || container.clientHeight;
      setupCanvas(nextWidth, nextHeight);
    }

    function draw() {
      const grid = gridRef.current;

      if (!grid) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let column = 0; column < grid.cols; column += 1) {
        for (let row = 0; row < grid.rows; row += 1) {
          const opacity = grid.squares[column * grid.rows + row];
          context.fillStyle = `${rgbaPrefix}${opacity})`;
          context.fillRect(
            column * (squareSize + gridGap) * grid.dpr,
            row * (squareSize + gridGap) * grid.dpr,
            squareSize * grid.dpr,
            squareSize * grid.dpr,
          );
        }
      }
    }

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
      draw();
    });

    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    intersectionObserver.observe(container);

    draw();

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [
    flickerChance,
    gridGap,
    height,
    isInView,
    maxOpacity,
    rgbaPrefix,
    squareSize,
    width,
  ]);

  useEffect(() => {
    if (!isInView) {
      window.cancelAnimationFrame(frameRef.current);
      return;
    }

    frameRef.current = window.requestAnimationFrame(function tick() {
      const canvas = canvasRef.current;
      const grid = gridRef.current;

      if (!canvas || !grid || !isInView) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      for (let index = 0; index < grid.squares.length; index += 1) {
        if (Math.random() < flickerChance) {
          grid.squares[index] = Math.random() * maxOpacity;
        }
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let column = 0; column < grid.cols; column += 1) {
        for (let row = 0; row < grid.rows; row += 1) {
          const opacity = grid.squares[column * grid.rows + row];
          context.fillStyle = `${rgbaPrefix}${opacity})`;
          context.fillRect(
            column * (squareSize + gridGap) * grid.dpr,
            row * (squareSize + gridGap) * grid.dpr,
            squareSize * grid.dpr,
            squareSize * grid.dpr,
          );
        }
      }

      frameRef.current = window.requestAnimationFrame(tick);
    });

    return () => {
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [flickerChance, gridGap, isInView, maxOpacity, rgbaPrefix, squareSize]);

  return (
    <div ref={containerRef} className={`h-full w-full ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
}
