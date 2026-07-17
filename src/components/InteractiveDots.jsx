import React, { useEffect, useRef } from 'react';

// ============================================================================
// CONFIGURABLE PARAMETERS
// Adjust these to customize the look, feel, and performance of the dot grid:
// ============================================================================
const SPACING = 40;          // Space between grid points (in pixels)
const OFFSET = 32;           // Starting offset of the grid (in pixels)
const BASE_RADIUS = 1.2;      // Base radius of the dot circle
const BASE_SCALE = 1.0;       // Scale multiplier for the base size of the dots

const HOVER_RADIUS = 220;     // Interaction radius for the mouse hover (in pixels)
const HOVER_SCALE_AMP = 1.8;  // Scale multiplier applied to dots on hover (adds up to +1.8x scale)
const HOVER_PUSH_AMP = 6.0;   // Maximum displacement (push away) applied on hover

const RIPPLE_WIDTH = 100;      // Thickness of the click ripple wavefront (in pixels)
const RIPPLE_SPEED = 7;       // Expansion speed of the click ripples
const RIPPLE_AMPLITUDE = 22;  // Displacement (push away) applied by click ripples
const RIPPLE_SCALE_AMP = 2.0; // Scale multiplier applied by click ripples (adds up to +2.0x scale)
const RIPPLE_DECAY = 0.0001;   // Opacity/life decay rate per frame for click ripples
// ============================================================================

export function InteractiveDots() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const ripplesRef = useRef([]);
  const colorsRef = useRef({
    dotColor: 'rgba(60, 60, 60, 0.18)',
    accentColor: 'rgba(40, 40, 40, 0.65)'
  });
  const lastInteractionRef = useRef(Date.now());
  const idleFrameCountRef = useRef(0);
  const nextIdleSpawnRef = useRef(60);

  // Observe theme changes to adapt colors dynamically
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      // Dark grey for light mode, light grey for dark mode
      const dot = isDark ? 'rgba(240, 240, 240, 0.18)' : 'rgba(60, 60, 60, 0.18)';
      const accent = isDark ? 'rgba(240, 240, 240, 0.65)' : 'rgba(40, 40, 40, 0.65)';

      colorsRef.current = {
        dotColor: dot,
        accentColor: accent
      };
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style']
    });

    return () => observer.disconnect();
  }, []);

  // Set up event listeners on the parent container (to avoid blocking UI interactions)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
      lastInteractionRef.current = Date.now();
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      lastInteractionRef.current = Date.now();
    };

    const handleClick = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastInteractionRef.current = Date.now();

      // Add a ripple event
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(rect.width, rect.height) * 0.8,
        speed: RIPPLE_SPEED,
        amplitude: RIPPLE_AMPLITUDE, // displacement amount
        life: 1.0,
        decay: RIPPLE_DECAY
      });
    };

    parent.addEventListener('mousemove', handleMouseMove, { passive: true });
    parent.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    parent.addEventListener('click', handleClick, { passive: true });

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      parent.removeEventListener('click', handleClick);
    };
  }, []);

  // Resize observer to scale the canvas correctly (using clientWidth/clientHeight to include padding)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.target.clientWidth;
        const height = entry.target.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform matrix
        ctx.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;



    const draw = () => {
      if (!canvas.width || !canvas.height) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Read current canvas dimensions in CSS pixel space
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Check idle state (cursor not on top OR inactive for 3 seconds)
      const now = Date.now();
      const isIdle = !mouseRef.current.active || (now - lastInteractionRef.current > 3000);

      if (isIdle) {
        idleFrameCountRef.current++;
        if (idleFrameCountRef.current > nextIdleSpawnRef.current) {
          // Spawn a random ripple at a random coordinate
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          
          ripplesRef.current.push({
            x: rx,
            y: ry,
            radius: 0,
            maxRadius: Math.max(width, height) * 0.5,
            speed: 3 + Math.random() * 2.5,
            amplitude: 8 + Math.random() * 8, // displacement amount (subtle)
            life: 1.0,
            decay: 0.015 + Math.random() * 0.01 // gentle decay for background
          });

          idleFrameCountRef.current = 0;
          nextIdleSpawnRef.current = 80 + Math.random() * 120; // random frames between spawns
        }
      } else {
        idleFrameCountRef.current = 0;
      }

      // Update ripples
      ripplesRef.current = ripplesRef.current
        .map(r => ({
          ...r,
          radius: r.radius + r.speed,
          life: r.life - r.decay
        }))
        .filter(r => r.life > 0 && r.radius < r.maxRadius);

      const mouse = mouseRef.current;
      const ripples = ripplesRef.current;
      const colors = colorsRef.current;

      // Calculate grid columns and rows
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const ox = i * SPACING + OFFSET;
          const oy = j * SPACING + OFFSET;

          let x = ox;
          let y = oy;
          let scale = BASE_SCALE;
          let hoverWeight = 0;
          let rippleWeightTotal = 0;

          // 1. Hover Magnification
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < HOVER_RADIUS) {
              const ratio = (HOVER_RADIUS - dist) / HOVER_RADIUS;
              const easeRatio = ratio * ratio * (3 - 2 * ratio); // smoothstep

              hoverWeight = easeRatio;
              scale += easeRatio * HOVER_SCALE_AMP;

              // Lens displacement (push away slightly)
              if (dist > 0.1) {
                const angle = Math.atan2(dy, dx);
                const pushDist = easeRatio * HOVER_PUSH_AMP;
                x += Math.cos(angle) * pushDist;
                y += Math.sin(angle) * pushDist;
              }
            }
          }

          // 2. Click Ripples
          for (let r of ripples) {
            const rx = x - r.x;
            const ry = y - r.y;
            const rDist = Math.hypot(rx, ry);

            const diff = Math.abs(rDist - r.radius);
            if (diff < RIPPLE_WIDTH) {
              const rippleRatio = (1.0 - diff / RIPPLE_WIDTH) * r.life;
              const easeRipple = rippleRatio * rippleRatio * (3 - 2 * rippleRatio); // smoothstep

              rippleWeightTotal += easeRipple * r.life;
              scale += easeRipple * RIPPLE_SCALE_AMP;

              // Push dots away from ripple center
              if (rDist > 0.1) {
                const rAngle = Math.atan2(ry, rx);
                const rPush = easeRipple * r.amplitude;
                x += Math.cos(rAngle) * rPush;
                y += Math.sin(rAngle) * rPush;
              }
            }
          }

          // Render dot
          const radius = BASE_RADIUS * scale;

          // Draw the base dot
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = colors.dotColor;
          ctx.fill();

          // Draw accent overlay for interactive highlights
          const interactionIntensity = Math.min(1.0, hoverWeight * 0.65 + rippleWeightTotal * 0.85);
          if (interactionIntensity > 0.01) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = colors.accentColor;
            ctx.globalAlpha = interactionIntensity;
            ctx.fill();
            ctx.restore();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
