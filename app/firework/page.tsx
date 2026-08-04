'use client';

import { useRef, useEffect, useCallback } from 'react';

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;       // 1 → 0
  maxLife: number;
  color: string;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;    // y where it explodes
  color: string;
  alive: boolean;
}

/* ──────────────────────────────────────────
   Constants
   ────────────────────────────────────────── */

const COLORS = [
  '#C4622D',
  '#B8962E',
  '#4A7C7E',
  '#E8B04B',
  '#F5F0E8',
  '#ff5e7e',
  '#7ec8ff',
  '#9d7bff',
] as const;

const GRAVITY = 0.12;
const ROCKET_SPEED = 9;
const PARTICLE_COUNT_MIN = 90;
const PARTICLE_COUNT_MAX = 130;
const AUTO_LAUNCH_INTERVAL = 800; // ms
const TRAIL_ALPHA = 0.12;         // per-frame translucent overlay

/* ──────────────────────────────────────────
   Helpers
   ────────────────────────────────────────── */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ──────────────────────────────────────────
   Component
   ────────────────────────────────────────── */

export default function FireworkPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rocketsRef = useRef<Rocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimsRef = useRef({ w: 0, h: 0 });

  /* ----- spawn rocket ----- */
  const launchRocket = useCallback(
    (cx?: number) => {
      const w = dimsRef.current.w;
      const h = dimsRef.current.h;
      if (w === 0 || h === 0) return;

      const x = cx ?? randRange(w * 0.1, w * 0.9);
      const targetY = randRange(h * 0.08, h * 0.45);

      const vy = -ROCKET_SPEED - Math.random() * 3;
      // slight horizontal drift so rockets aren't perfectly vertical
      const vx = randRange(-1.2, 1.2);

      rocketsRef.current.push({
        x,
        y: h,
        vx,
        vy,
        targetY,
        color: pick(COLORS),
        alive: true,
      });
    },
    [],
  );

  /* ----- explode rocket into particles ----- */
  const explode = useCallback((rocket: Rocket) => {
    const count = Math.floor(randRange(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX));
    const particles = particlesRef.current;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + randRange(-0.15, 0.15);
      const speed = randRange(1.5, 6.5);
      const life = randRange(0.6, 1.4);

      particles.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: pick(COLORS),
        size: randRange(1.8, 4.2),
      });
    }
  }, []);

  /* ----- animation loop ----- */
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimsRef.current.w;
    const h = dimsRef.current.h;

    /* trail effect – translucent black over entire canvas */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(15,13,11,${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, w, h);

    /* draw particles & rockets with additive blending */
    ctx.globalCompositeOperation = 'lighter';

    /* -- particles -- */
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY;
      p.life -= 0.008;

      if (p.life <= 0 || p.y > h + 20 || p.x < -20 || p.x > w + 20) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.fill();
    }

    /* -- rockets -- */
    const rockets = rocketsRef.current;
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += GRAVITY * 0.6;

      // draw rocket as a small glowing dot
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#F5F0E8';
      ctx.fill();

      // check if reached target or passed
      if (r.y <= r.targetY) {
        explode(r);
        rockets.splice(i, 1);
        continue;
      }
      // safety cleanup
      if (r.y > h + 10 || r.x < -20 || r.x > w + 20) {
        rockets.splice(i, 1);
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    rafRef.current = requestAnimationFrame(loop);
  }, [explode]);

  /* ----- resize ----- */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    dimsRef.current.w = w;
    dimsRef.current.h = h;
  }, []);

  /* ----- click → launch at cursor x ----- */
  const handleClick = useCallback(
    (e: MouseEvent) => {
      launchRocket(e.clientX);
    },
    [launchRocket],
  );

  /* ----- spacebar → 12 rockets at once ----- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const w = dimsRef.current.w;
      if (w === 0) return;
      for (let i = 0; i < 12; i++) {
        const x = (w / 13) * (i + 0.5); // evenly spaced
        launchRocket(x);
      }
    },
    [launchRocket],
  );

  /* ── mount / unmount ── */
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    rafRef.current = requestAnimationFrame(loop);

    autoTimerRef.current = setInterval(() => {
      launchRocket();
    }, AUTO_LAUNCH_INTERVAL);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleResize, handleClick, handleKeyDown, loop, launchRocket]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'fixed',
          inset: 0,
          background: '#0f0d0b',
          cursor: 'crosshair',
          zIndex: 0,
        }}
      />
      <p
        style={{
          position: 'fixed',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(180,170,150,0.55)',
          fontSize: 13,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          zIndex: 10,
          margin: 0,
          userSelect: 'none',
        }}
      >
        click anywhere to launch · press space for a finale · gadgil.us
      </p>
    </>
  );
}