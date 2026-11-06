"use client";

import { useEffect, useRef, useState } from "react";
import { canvasFontFamily, chime, fontsReady, pop } from "@/lib/audio";
import { useSettings } from "@/store";
import { recordExposure } from "@/lib/progress";
import type { Skill } from "@shishu/core";

const PALETTE = ["#6B9080", "#C9A9A6", "#D4A373", "#9BB0C1", "#B9A0B8", "#8FA98F"];
const SIZE = 320;
const BRUSH = 20;
const GRID = 26; // coverage cells

type Props = {
  lang: string;
  skill: Skill;
  itemId: string;
  glyph: string;
  script?: "bengali" | "latin";
  mode: "paint" | "trace";
  stage: string;
  onDone?: (covered: number) => void;
};

/**
 * Finger-paint / freehand-trace canvas.
 * Low-stimulation by design: one canvas, soft palette, gentle audio,
 * completion detected from ink coverage over the glyph box.
 */
export default function ColorCanvas({ lang, skill, itemId, glyph, script, mode, stage, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array(GRID * GRID));
  const coveredRef = useRef(0);
  const bboxCellsRef = useRef(1);
  const doneRef = useRef(false);
  const lastPopRef = useRef(0);
  const [done, setDone] = useState(false);
  const [color, setColor] = useState(PALETTE[0]);
  const sound = useSettings((s) => s.sound);
  const capMin = useSettings((s) => s.capMin);

  // paint targets: color-in can be a fuller fill; tracing counts lighter
  const target = mode === "paint" ? 0.5 : 0.32;

  const drawGuide = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = SIZE * dpr;
    cvs.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const fam = script === "bengali" ? canvasFontFamily() : getComputedStyle(document.body).fontFamily;
    ctx.font = `700 ${SIZE * 0.6}px ${fam}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const m = ctx.measureText(glyph);
    const bw = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0);
    const bh = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0);
    // boxes within glyph bbox as coverage denominator
    const cellsW = Math.max(1, Math.ceil((bw / SIZE) * GRID));
    const cellsH = Math.max(1, Math.ceil((bh / SIZE) * GRID));
    bboxCellsRef.current = cellsW * cellsH;

    if (mode === "paint") {
      ctx.fillStyle = "rgba(43,43,43,0.10)";
      ctx.fillText(glyph, SIZE / 2, SIZE / 2);
    } else {
      ctx.fillStyle = "rgba(43,43,43,0.05)";
      ctx.fillText(glyph, SIZE / 2, SIZE / 2);
      ctx.setLineDash([9, 15]);
      ctx.strokeStyle = "rgba(43,43,43,0.35)";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.strokeText(glyph, SIZE / 2, SIZE / 2);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    gridRef.current.fill(0);
    coveredRef.current = 0;
    doneRef.current = false;
    setDone(false);
    let alive = true;
    (async () => {
      await fontsReady();
      if (alive) drawGuide();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glyph, mode]);

  const markCell = (gx: number, gy: number) => {
    if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
    const i = gy * GRID + gx;
    if (!gridRef.current[i]) {
      gridRef.current[i] = 1;
      coveredRef.current += 1;
    }
  };

  const stamp = (x: number, y: number) => {
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx || doneRef.current) return;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();

    const cell = SIZE / GRID;
    const r = BRUSH / cell;
    const cx = x / cell - 0.5, cy = y / cell - 0.5;
    const rCells = Math.ceil(r / 1.42); // mark roughly a diamond+ square footprint
    for (let dx = -rCells; dx <= rCells; dx++) {
      for (let dy = -rCells; dy <= rCells; dy++) {
        if (dx * dx + dy * dy <= rCells * rCells) markCell(Math.round(cx + dx), Math.round(cy + dy));
      }
    }

    if (sound) {
      const now = Date.now();
      if (now - lastPopRef.current > 450) {
        lastPopRef.current = now;
        pop();
      }
    }

    const ratio = coveredRef.current / Math.max(1, bboxCellsRef.current);
    if (ratio >= target && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
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

  const lastXRef = useRef(-1);
  const lastYRef = useRef(-1);

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
    gridRef.current.fill(0);
    coveredRef.current = 0;
    doneRef.current = false;
    setDone(false);
    drawGuide();
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
        {mode === "paint" ? "Paint inside the shape with your finger." : "Draw over the dotted shape."} {stage && ""}
        When at least {Math.round(target * 100)} percent is covered it finishes on its own. {capMin > 0 && "Sessions gently end after the time your grown-up set."}
      </p>
    </div>
  );
}
