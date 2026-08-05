'use client';

import { useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  exploded: boolean;
  color: string;
  trail: { x: number; y: number }[];
}

// ── Constants ──────────────────────────────────────────────────────────

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
const TRAIL_LENGTH = 14;

// ── Helpers ────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ── Component ──────────────────────────────────────────────────────────

export default function FireworkPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rocketsRef = useRef<Rocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastAutoRef = useRef<number>(0);

  // ── Resize handler ───────────────────────────────────────────────────

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    dimensionsRef.current = { width: w, height: h };
  }, []);

  // ── Launch a rocket ──────────────────────────────────────────────────

  const launchRocket = useCallback(
    (targetX?: number) => {
      const { width, height } = dimensionsRef.current;
      if (height === 0) return;

      const x = targetX ?? randomBetween(width * 0.1, width * 0.9);
      const targetY = randomBetween(height * 0.07, height * 0.45);
      const totalFrames = (height - targetY) / ROCKET_SPEED;
      const vy = -ROCKET_SPEED;
      // slight horizontal drift
      const vx = (targetX !== undefined ? 0 : randomBetween(-1.6, 1.6));

      rocketsRef.current.push({
        x,
        y: height,
        vx,
        vy,
        targetY,
        exploded: false,
        color: pickColor(),
        trail: [],
      });
    },
    [],
  );

  // ── Explode rocket into particles ─────────────────────────────────────

  const explode = useCallback((rocket: Rocket) => {
    const count = Math.floor(randomBetween(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX));
    const baseSpeed = randomBetween(5, 13);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + randomBetween(-0.15, 0.15);
      const speed = baseSpeed * randomBetween(0.5, 1.3);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      particlesRef.current.push({
        x: rocket.x,
        y: rocket.y,
        vx,
        vy,
        radius: randomBetween(1.2, 3.2),
        color: Math.random() < 0.5 ? rocket.color : pickColor(),
        alpha: 1,
        decay: randomBetween(0.008, 0.025),
        gravity: randomBetween(0.04, 0.1),
        trail: [],
      });
    }
  }, []);

  // ── Click handler ────────────────────────────────────────────────────

  const handleClick = useCallback(
    (e: MouseEvent) => {
      launchRocket(e.clientX);
    },
    [launchRocket],
  );

  // ── Key handler ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const { width } = dimensionsRef.current;
        for (let i = 0; i < 12; i++) {
          const px = (width / 13) * (i + 1);
          launchRocket(px);
        }
      }
    },
    [launchRocket],
  );

  // ── Animation loop ───────────────────────────────────────────────────

  const loop = useCallback(() => {
    const ctx = ctxRef.current;
    const { width, height } = dimensionsRef.current;
    if (!ctx || width === 0) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // Translucent overlay for trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(15, 13, 11, 0.28)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const rockets = rocketsRef.current;
    const particles = particlesRef.current;

    // ── Update & draw rockets ──────────────────────────────────────────

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];

      if (!r.exploded) {
        // store trail point
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > TRAIL_LENGTH) r.trail.shift();

        r.vy += GRAVITY;
        r.x += r.vx;
        r.y += r.vy;

        // check if reached target
        if (r.y <= r.targetY || r.vy >= 0) {
          r.exploded = true;
          explode(r);
        }
      }

      // Draw trail
      if (r.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(r.trail[0].x, r.trail[0].y);
        for (let t = 1; t < r.trail.length; t++) {
          ctx.lineTo(r.trail[t].x, r.trail[t].y);
        }
        ctx.strokeStyle = r.exploded ? 'transparent' : r.color;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw rocket head
      if (!r.exploded) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#F5F0E8';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Remove exploded rockets with no visible trail
      if (r.exploded && r.trail.length === 0) {
        rockets.splice(i, 1);
      } else if (r.exploded) {
        // fade trail out
        r.trail.shift();
      }
    }

    // ── Update & draw particles ────────────────────────────────────────

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // store trail
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
      if (p.trail.length > 8) p.trail.shift();

      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      // Draw trail
      if (p.trail.length > 1) {
        ctx.beginPath();
        const first = p.trail[0];
        ctx.moveTo(first.x, first.y);
        for (let t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.lineWidth = p.radius * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [explode]);

  // ── Effect: setup & teardown ─────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d');
    handleResize();

    // Auto-launch timer
    const autoLaunch = () => {
      const now = Date.now();
      if (now - lastAutoRef.current >= AUTO_LAUNCH_INTERVAL) {
        lastAutoRef.current = now;
        launchRocket();
      }
    };

    autoTimerRef.current = setInterval(autoLaunch, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleResize, handleClick, handleKeyDown, loop, launchRocket]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'block',
          background: '#0f0d0b',
          cursor: 'crosshair',
          zIndex: 0,
        }}
      />
      <p
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(180, 170, 155, 0.55)',
          fontSize: '0.8rem',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.03em',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        click anywhere to launch · press space for a finale · gadgil.us
      </p>
    </>
  );
}