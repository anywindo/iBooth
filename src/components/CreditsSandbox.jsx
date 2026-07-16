import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, X, Sparkles, Code, User, Award } from 'lucide-react';
import { supabase } from '../utils/supabase.js';

function Github({ size = 24, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export function CreditsSandbox({ templates = [] }) {
  const containerRef = useRef(null);
  const bubblesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const [bubbles, setBubbles] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch contributors from github with Supabase caching
  useEffect(() => {
    async function fetchContributors() {
      setLoading(true);
      const oneDayMs = 24 * 60 * 60 * 1000;
      let cachedRow = null;

      try {
        const { data, error } = await supabase
          .from('github_cache')
          .select('data, updated_at')
          .eq('key', 'contributors')
          .maybeSingle();

        if (data) {
          cachedRow = data;
          const now = new Date();
          const lastUpdated = new Date(data.updated_at);

          if (now - lastUpdated < oneDayMs && Array.isArray(data.data)) {
            setContributors(data.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Error reading from github_cache database table:', err);
      }

      try {
        const res = await fetch('https://api.github.com/repos/anywindo/iBooth/contributors');
        if (!res.ok) throw new Error(`GitHub returned status ${res.status}`);

        const freshData = await res.json();
        if (freshData && Array.isArray(freshData)) {
          setContributors(freshData);

          try {
            await supabase
              .from('github_cache')
              .upsert({
                key: 'contributors',
                data: freshData,
                updated_at: new Date().toISOString()
              });
          } catch (dbErr) {
            console.error('Failed to write to github_cache table:', dbErr);
          }
          setLoading(false);
          return;
        }
      } catch (githubErr) {
        console.warn('Failed to fetch from GitHub API (rate-limited), falling back to cache:', githubErr);
      }

      if (cachedRow && Array.isArray(cachedRow.data)) {
        setContributors(cachedRow.data);
      } else {
        setContributors([
          { id: 1, login: 'anywindo', contributions: 10, avatar_url: 'https://github.com/anywindo.png', html_url: 'https://github.com/anywindo' }
        ]);
      }
      setLoading(false);
    }

    fetchContributors();
  }, []);

  // 2. Extract unique creators from templates
  const uniqueCreators = useMemo(() => {
    if (!Array.isArray(templates)) return [];
    const map = new Map();
    templates.forEach(t => {
      const ownerId = t.owner_id || t.ownerId;
      const name = t.creator_name || t.creatorName || 'Anonymous';
      if (ownerId && name !== 'Unknown User') {
        map.set(ownerId, {
          id: ownerId,
          name: name,
          count: (map.get(ownerId)?.count || 0) + 1
        });
      }
    });
    return Array.from(map.values());
  }, [templates]);

  // 3. Monitor container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 400, height: height || 400 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 4. Combine items into bubbles schema
  const combinedItems = useMemo(() => {
    const list = [];

    contributors.forEach(c => {
      list.push({
        id: `contributor-${c.id || c.login}`,
        name: c.login,
        type: 'contributor',
        avatarUrl: c.avatar_url,
        htmlUrl: c.html_url,
        count: c.contributions || 1,
        initials: c.login.substring(0, 2).toUpperCase()
      });
    });

    uniqueCreators.forEach(c => {
      list.push({
        id: `creator-${c.id}`,
        name: c.name,
        type: 'creator',
        avatarUrl: null,
        htmlUrl: null,
        count: c.count || 1,
        initials: c.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'CR'
      });
    });

    return list;
  }, [contributors, uniqueCreators]);

  // 5. Initialize bubbles and background ambient orbs
  useEffect(() => {
    if (combinedItems.length === 0) return;

    const currentMap = new Map(bubblesRef.current.map(b => [b.id, b]));
    const maxCount = Math.max(...combinedItems.map(item => item.count), 1);

    const initialized = combinedItems.map(item => {
      const existing = currentMap.get(item.id);
      const weight = Math.sqrt(item.count) / Math.sqrt(maxCount);
      const baseRadius = 26 + weight * 26; // Radius ranges from 26px to 52px

      if (existing) {
        return {
          ...existing,
          ...item,
          baseRadius,
          color: existing.color || `hsla(${Math.floor(Math.random() * 360)}, 85%, 40%, 0.85)`
        };
      }

      const minX = baseRadius + 20;
      const maxX = Math.max(dimensions.width - baseRadius - 20, minX);
      const minY = baseRadius + 20;
      const maxY = Math.max(dimensions.height - baseRadius - 20, minY);

      const hue = Math.floor(Math.random() * 360);
      const color = `hsla(${hue}, 85%, 40%, 0.85)`;

      return {
        ...item,
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        baseRadius,
        targetRadius: baseRadius,
        displayRadius: baseRadius,
        isClicked: false,
        color
      };
    });

    bubblesRef.current = initialized;
    setBubbles(initialized);
  }, [combinedItems, dimensions.width, dimensions.height]);

  // 6. Viscous fluid physics simulation
  useEffect(() => {
    let animationFrameId;

    const tick = () => {
      const bubbles = bubblesRef.current;
      const { width, height } = dimensions;
      const mouse = mouseRef.current;
      const time = Date.now() * 0.0012;

      // Update Credits bubbles
      const nodes = bubbles.map(b => document.getElementById(`bubble-${b.id}`));
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        // Apply velocity coordinates
        b.x += b.vx;
        b.y += b.vy;

        // Heavy Viscosity: dampens velocity rapidly (water/glycerin feel, no bounce)
        b.vx *= 0.8;
        b.vy *= 0.8;

        // Overdamped Spring Centering: gravity decays to zero at target center
        const centerX = width / 2;
        const centerY = height / 2;
        const toCenterX = centerX - b.x;
        const toCenterY = centerY - b.y;

        b.vx += toCenterX * 0.0003;
        b.vy += toCenterY * 0.0003;

        // Ambient orbital sine-drift (keeps them breathing/moving gently when clustered)
        b.vx += Math.sin(time + i * 2) * 0.008;
        b.vy += Math.cos(time + i * 2) * 0.008;

        // Hover Magnification Check
        let isHoveredByMouse = false;
        if (mouse.active) {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);

          if (distToMouse < b.baseRadius + 60 && distToMouse > 0) {
            isHoveredByMouse = true;
          }
        }

        // Target radius interpolation
        let targetRadius = b.baseRadius;
        if (b.isClicked) {
          targetRadius = b.baseRadius * 1.6;
        } else if (isHoveredByMouse) {
          targetRadius = b.baseRadius * 1.35;
        }
        b.targetRadius = targetRadius;

        b.displayRadius += (b.targetRadius - b.displayRadius) * 0.12;

        // Boundary Constraint: strict bounds clamping
        if (b.x - b.displayRadius < 10) {
          b.x = b.displayRadius + 10;
          b.vx = 0;
        } else if (b.x + b.displayRadius > width - 10) {
          b.x = width - b.displayRadius - 10;
          b.vx = 0;
        }

        if (b.y - b.displayRadius < 10) {
          b.y = b.displayRadius + 10;
          b.vy = 0;
        } else if (b.y + b.displayRadius > height - 10) {
          b.y = height - b.displayRadius - 10;
          b.vy = 0;
        }

        // Collision: Bubble-to-Bubble (sliding inelastic resolution)
        for (let j = i + 1; j < bubbles.length; j++) {
          const other = bubbles[j];
          const dx = other.x - b.x;
          const dy = other.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b.displayRadius + other.displayRadius + 4; // 4px padding gap

          if (dist < minDist && dist > 0) {
            // Overlap resolution
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.15;
            const pushY = (dy / dist) * overlap * 0.15;

            b.x -= pushX;
            b.y -= pushY;
            other.x += pushX;
            other.y += pushY;

            // Inelastic collision velocity calculation (zero bounce)
            const nx = dx / dist;
            const ny = dy / dist;
            const rvx = other.vx - b.vx;
            const rvy = other.vy - b.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const impulse = velAlongNormal * 0.5;
              b.vx += impulse * nx;
              b.vy += impulse * ny;
              other.vx -= impulse * nx;
              other.vy -= impulse * ny;
            }

            b.vx *= 0.5;
            b.vy *= 0.5;
            other.vx *= 0.5;
            other.vy *= 0.5;
          }
        }

        // Apply visual transform to node
        const node = nodes[i];
        if (node) {
          const size = b.displayRadius * 2;
          node.style.transform = `translate3d(${b.x - b.displayRadius}px, ${b.y - b.displayRadius}px, 0)`;
          node.style.width = `${size}px`;
          node.style.height = `${size}px`;

          node.style.setProperty('box-shadow', 'none', 'important');

          const img = node.querySelector('img');
          if (img) {
            img.style.setProperty('box-shadow', 'none', 'important');
            img.style.setProperty('filter', 'none', 'important');
          }
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  // 7. Mouse triggers
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
  };

  const handleBubbleClick = (clickedItem) => {
    const bubbles = bubblesRef.current;
    const bubble = bubbles.find(b => b.id === clickedItem.id);

    if (bubble) {
      if (bubble.isClicked) {
        bubble.targetRadius = bubble.baseRadius;
        bubble.isClicked = false;
        setSelectedBubble(null);
      } else {
        bubbles.forEach(b => {
          b.targetRadius = b.baseRadius;
          b.isClicked = false;
        });

        bubble.targetRadius = bubble.baseRadius * 1.5;
        bubble.isClicked = true;
        setSelectedBubble(bubble);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'transparent',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxSizing: 'border-box'
      }}
    >
      {/* Decorative Radial Grid / Nebula Backdrop */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
        color: 'var(--text)',
        backgroundSize: '24px 24px',
        opacity: 0.15,
        pointerEvents: 'none'
      }} />

      {/* Ambient glow removed */}

      {/* Ambient orbs removed */}



      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text)',
          gap: '12px',
          zIndex: 5,
          position: 'relative'
        }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '13px', letterSpacing: '0.05em', opacity: 0.8 }}>Syncing Sandbox...</span>
        </div>
      ) : (
        /* Credits Glassmorphism Spheres */
        bubbles.map((b) => {
          const isContributor = b.type === 'contributor';
          const size = b.displayRadius * 2;

          return (
            <div
              key={b.id}
              id={`bubble-${b.id}`}
              onClick={() => handleBubbleClick(b)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                overflow: 'hidden',
                zIndex: b.isClicked ? 10 : 2,
                border: b.isClicked
                  ? '2px solid var(--accent)'
                  : isContributor
                    ? '1.5px solid var(--border)'
                    : '1px solid var(--border)',

                // Frosted Glass for contributors, Randomized Color for creators
                background: isContributor
                  ? 'var(--code-bg)'
                  : b.color,

                backdropFilter: 'blur(12px)',
                transition: 'border 0.3s, background 0.3s',
                willChange: 'transform, width, height',
                boxShadow: 'none',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >


              {isContributor && b.avatarUrl ? (
                <img
                  src={b.avatarUrl}
                  alt={b.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    filter: 'none',
                    boxShadow: 'none'
                  }}
                  draggable="false"
                />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  color: 'var(--text-h)',
                  fontFamily: 'var(--mono)',
                  fontSize: b.isClicked ? '13px' : '10px',
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  pointerEvents: 'none',
                  textShadow: 'none',
                  zIndex: 1,
                  textAlign: 'center',
                  padding: '8px',
                  boxSizing: 'border-box',
                  wordBreak: 'break-word',
                  lineHeight: '1.25'
                }}>
                  {b.name}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Info Card Drawer (Redesigned Minimal UI) */}
      <AnimatePresence>
        {selectedBubble && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '24px',
              zIndex: 30,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-h)',
              boxShadow: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {selectedBubble.avatarUrl ? (
                <img
                  src={selectedBubble.avatarUrl}
                  alt={selectedBubble.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', boxShadow: 'none' }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: selectedBubble.color,
                  border: '1px solid var(--border)',
                  color: 'var(--text-h)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  padding: '4px',
                  boxShadow: 'none',
                  wordBreak: 'break-word',
                  textShadow: 'none'
                }}>
                  {selectedBubble.name}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', textShadow: 'none' }}>
                    {selectedBubble.name}
                  </h4>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--code-bg)',
                    color: 'var(--text-h)',
                    border: '1px solid var(--border)',
                    boxShadow: 'none'
                  }}>
                    {selectedBubble.type === 'contributor' ? 'Contributor' : 'Creator'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', textShadow: 'none' }}>
                  {selectedBubble.type === 'contributor'
                    ? `${selectedBubble.count} commit${selectedBubble.count > 1 ? 's' : ''}`
                    : `${selectedBubble.count} template${selectedBubble.count > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedBubble.htmlUrl && (
                <a
                  href={selectedBubble.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--code-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-h)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'background 0.2s',
                    boxShadow: 'none',
                    textShadow: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--code-bg)'}
                >
                  View Profile <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBubbleClick(selectedBubble);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-h)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
