"use client";

import { useEffect, useRef, useState } from "react";
import { canvasFontFamily, chime, fontsReady, pop } from "@/lib/audio";
import { useSettings } from "@/store";
import { recordExposure } from "@/lib/progress";
import type { Skill } from "@shishu/core";

const PALETTE = ["#6B9080", "#C9A9A6", "#D4A373", "#9BB0C1", "#B9A0B8", "#8FA98F"];
const SIZE = 320;
const BRUSH = 20;
const G = 80; // fine grid (cell = 4px) shared by glyph mask + child strokes

// Forgiveness: how far a stroke may pass from the true shape and still count (px)
const TOLERANCE = 28;
// Forgiveness: fraction of the letter's real ink the child must come near to finish
const TARGET = { paint: 0.72, trace: 0.68 } as const;

type Props = {
  lang: string;
  skill: Skill;
  itemId: string;
  glyph: string;
  script?: "bengali" | "latin";
  mode: "paint" | "trace";
  stage: string;
  onDone?: (similarity: number) => void;
};

/**
 * Finger-paint / freehand-trace canvas.
 * Completion = "followed the shape well enough", not "filled a box":
 * we rasterize the true glyph into a fine mask and count how much of the
 * letter's real ink the child's strokes touch within a forgiving radius.
 * Starting anywhere, wobbling, or being imperfect is fine — that's the point.
 */
export default function ColorCanvas({ lang, skill, itemId, glyph, script, mode, stage, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<Uint8Array>(new Uint8Array(G * G));   // where the letter's ink is
  const inkRef = useRef<Uint8Array>(new Uint8Array(G * G));    // where the child has painted
  const seenRef = useRef<Uint8Array>(new Uint8Array(G * G));   // glyph ink cells already counted as traced
  const reachedRef = useRef(0);
  const inkCellsRef = useRef(0);
  const totalInkRef = useRef(1);
  const doneRef = useRef(false);
  const lastPopRef = useRef(0);
  const lastXRef = useRef(-1);
  const lastYRef = useRef(-1);
  const shownRatioRef = useRef(0);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState(PALETTE[0]);
  const sound = useSettings((s) => s.sound);
  const capMin = useSettings((s) => s.capMin);

  const target = TARGET[mode];
  const tolCells = Math.max(1, Math.round(TOLERANCE / (SIZE / G)));

  /** Draws the guide + learns where the letter's true shape is (mask). */
  const drawGuide = (learn: boolean) => {
    const cvs = canvasRef.current;
    if (!cvs) return () => {};
    const ctx = cvs.getContext("2d");
    if (!ctx) return () => {};
    const dpr = window.devicePixelRatio || 1;
    cvs.width = SIZE * dpr;
    cvs.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const fam = script === "bengali" ? canvasFontFamily() : getComputedStyle(document.body).fontFamily;
    const fontSpec = `700 ${SIZE * 0.6}px ${fam}`;
    ctx.font = fontSpec;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = SIZE / 2, cy = SIZE / 2;

    if (learn) {
      // learn the true shape: rasterize solid glyph into the fine grid
      const off = document.createElement("canvas");
      off.width = G; off.height = G;
      const octx = off.getContext("2d")!;
      const scale = G / SIZE;
      octx.font = `700 ${SIZE * 0.6 * scale}px ${fam}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#000";
      octx.fillText(glyph, cx * scale, cy * scale + 0.5 * scale);
      const data = octx.getImageData(0, 0, G, G).data;
      const mask = maskRef.current;
      let total = 0;
      for (let i = 0; i < G * G; i++) {
        const filled = data[i * 4 + 3] > 100;
        mask[i] = filled ? 1 : 0;
        if (filled) total++;
      }
      totalInkRef.current = Math.max(1, total);
      inkRef.current.fill(0);
      seenRef.current.fill(0);
      reachedRef.current = 0;
      inkCellsRef.current = 0;
    }

    if (mode === "paint") {
      ctx.fillStyle = "rgba(43,43,43,0.10)";
      ctx.fillText(glyph, cx, cy);
    } else {
      ctx.fillStyle = "rgba(43,43,43,0.05)";
      ctx.fillText(glyph, cx, cy);
      ctx.setLineDash([9, 15]);
      ctx.strokeStyle = "rgba(43,43,43,0.35)";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.strokeText(glyph, cx, cy);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    doneRef.current = false;
    shownRatioRef.current = 0;
    setDone(false);
    setProgress(0);
    let alive = true;
    (async () => {
      await fontsReady();
      if (alive) drawGuide(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glyph, mode]);

  /** Marks child ink; grows "reached" = true-ink cells now covered by the dilated stroke. */
  const stamp = (x: number, y: number) => {
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx || doneRef.current) return;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();

    const cell = SIZE / G;
    const rCells = Math.ceil(BRUSH / cell);
    const sx = Math.round(x / cell - 0.5);
    const sy = Math.round(y / cell - 0.5);
    const ink = inkRef.current;
    const mask = maskRef.current;
    const seen = seenRef.current;

    for (let dy = -rCells; dy <= rCells; dy++) {
      for (let dx = -rCells; dx <= rCells; dx++) {
        if (dx * dx + dy * dy > rCells * rCells) continue;
        const gx = sx + dx, gy = sy + dy;
        if (gx < 0 || gy < 0 || gx >= G || gy >= G) continue;
        const cellIdx = gy * G + gx;
        if (!ink[cellIdx]) {
          ink[cellIdx] = 1;
          inkCellsRef.current += 1;
          // dilated neighborhood: any true glyph ink near this stroke counts as traced
          for (let wy = -tolCells; wy <= tolCells; wy++) {
            const ty = gy + wy;
            if (ty < 0 || ty >= G) continue;
            for (let wx = -tolCells; wx <= tolCells; wx++) {
              const tx = gx + wx;
              if (tx < 0 || tx >= G) continue;
              if (wx * wx + wy * wy > tolCells * tolCells) continue;
              const mi = ty * G + tx;
              if (mask[mi] && !seen[mi]) {
                seen[mi] = 1; // count each true-ink cell once, even if painted directly
                reachedRef.current += 1;
              }
            }
          }
        }
      }
    }

    if (sound) {
      const now = Date.now();
      if (now - lastPopRef.current > 450) {
        lastPopRef.current = now;
        pop();
      }
    }

    const ratio = reachedRef.current / totalInkRef.current;
    if (ratio - shownRatioRef.current >= 0.03) {
      shownRatioRef.current = ratio;
      setProgress(Math.min(1, ratio / target));
    }
    if (ratio >= target && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
      setProgress(1);
      if (sound) chime(true);
      const childId = useSettings.getState().childId;
      void recordExposure(childId || "anon", lang, skill, itemId);
      onDone?.(ratio);
    }
  };

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE;
    return [x, y] as const;
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (doneRef.current || e.buttons === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    const lastX = lastXRef.current;
    const lastY = lastYRef.current;
    // interpolate stamps between events to avoid gaps on fast swipes
    const dist = lastX < 0 ? BRUSH : Math.hypot(x - lastX, y - lastY);
    const steps = Math.max(1, Math.ceil(dist / (BRUSH * 0.6)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      stamp(lastX < 0 ? x : lastX + (x - lastX) * t, lastY < 0 ? y : lastY + (y - lastY) * t);
    }
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const clear = () => {
    doneRef.current = false;
    shownRatioRef.current = 0;
    setDone(false);
    setProgress(0);
    drawGuide(true);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[360px]">
      <div className="relative bg-surface rounded-3xl p-2 shadow-sm w-full">
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl touch-none select-none"
          style={{ aspectRatio: "1 / 1", display: "block" }}
          onPointerDown={(e) => { lastXRef.current = -1; lastYRef.current = -1; onMove(e); }}
          onPointerMove={onMove}
        />
        {done && (
          <div
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-3xl font-bold text-success bg-surface/90 rounded-3xl px-5 py-3 transition-all duration-gentle">
              Wonderful ✓
            </span>
          </div>
        )}
      </div>

      {/* calm, tiny progress so the child sees the shape filling up as they trace near it */}
      <div className="w-40 h-1 rounded-full bg-text/10 overflow-hidden" aria-hidden>
        <div
          className="h-full bg-primary rounded-full transition-all duration-gentle"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {!done && mode === "paint" && (
        <div className="flex gap-2 flex-wrap justify-center">
          {PALETTE.map((c) => (
            <button
              key={c}
              aria-label={`choose color ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={`w-12 h-12 rounded-2xl transition duration-gentle active:scale-95 ${
                color === c ? "ring-4 ring-text/30 outline-none" : "ring-1 ring-text/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <button
        onClick={clear}
        className="text-sm text-muted underline underline-offset-4 px-4 py-2 min-h-[48px]"
      >
        {done ? "Do it again" : "Start over"}
      </button>

      <p className="sr-only">
        {mode === "paint"
          ? "Paint along the letter with your finger. Finish anywhere you like — imperfect is okay."
          : "Draw over the dotted letter with your finger. It does not need to be perfect, just near the shape."}
        {capMin > 0 && " Sessions gently end after the time your grown-up set."}
      </p>
      <span className="sr-only" aria-hidden>{stage}</span>
    </div>
  );
}
