import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, CloudUpload, Play } from 'lucide-react';
import { getLocalMediaUrl } from '../core/platform';
import { Button } from './Button.jsx';

export const formatTemplateDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const InteractivePreview = ({ template, style }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    setRotation(prev => ({
      x: Math.max(-80, Math.min(80, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setScale(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.005)));
  };

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));
  const handleReset = () => {
    setRotation({ x: 0, y: 0 });
    setScale(1);
  };

  const tWidth = template.width || 1200;
  const tHeight = template.height || 1800;
  const aspectRatio = tWidth / tHeight;

  return (
    <div 
      style={{ perspective: 1000, backgroundColor: 'var(--panel)', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: isDragging.current ? 'grabbing' : 'grab', position: 'relative', overflow: 'hidden', minHeight: '400px', touchAction: 'none', ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <motion.div
        animate={{ rotateX: rotation.x, rotateY: rotation.y, scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          transformStyle: "preserve-3d",
          position: "relative",
          width: '100%',
          maxHeight: '75vh',
          maxWidth: `min(85%, calc(75vh * ${aspectRatio}))`,
          aspectRatio: aspectRatio,
        }}
      >
        {/* Front Face */}
        <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(1px)', background: '#fff', backfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: '2px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          {template.slots?.map(slot => (
            <div key={slot.id} style={{ 
              position: 'absolute', 
              left: `${(slot.x / tWidth) * 100}%`, 
              top: `${(slot.y / tHeight) * 100}%`, 
              width: `${(slot.width / tWidth) * 100}%`, 
              height: `${(slot.height / tHeight) * 100}%`, 
              borderRadius: slot.radius ? `${(slot.radius / tWidth) * 100}%` : 0, 
              overflow: 'hidden',
              transform: `rotate(${slot.rotation || 0}deg)`
            }}>
               <img src="/photo-placeholder.webp" alt="placeholder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable="false" />
            </div>
          ))}
          {(template.frameImage || template.frame_image_url) && (
            <img src={getLocalMediaUrl(template.frameImage || template.frame_image_url)} alt="frame" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} draggable="false" />
          )}

          {/* Specular Shine */}
          <motion.div
            style={{
              position: 'absolute',
              inset: '-100%',
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 42%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.4) 58%, transparent 65%)',
              mixBlendMode: 'soft-light',
              pointerEvents: 'none',
              zIndex: 10
            }}
            animate={{
              x: `${-(rotation.y / 80) * 50}%`,
              y: `${(rotation.x / 80) * 50}%`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {/* Static Grain Texture Overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
            zIndex: 15
          }} />
        </div>
        
        {/* Back Face */}
        <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg) translateZ(1px)', background: '#f8fafc', borderRadius: '2px', overflow: 'hidden' }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="ibooth-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
                <image href="/favicon.webp" x="35" y="20" width="30" height="30" opacity="0.2" />
                <text x="50" y="65" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#94a3b8" textAnchor="middle" opacity="0.3">iBooth</text>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#ibooth-pattern)" />
          </svg>
        </div>
        
        {/* Edge Left */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', transform: 'rotateY(-90deg) translateZ(1px) translateX(-1px)', background: '#cbd5e1' }}></div>
        
        {/* Edge Right */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '2px', transform: 'rotateY(90deg) translateZ(1px) translateX(1px)', background: '#94a3b8' }}></div>
        
        {/* Edge Top */}
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: '2px', transform: 'rotateX(90deg) translateZ(1px) translateY(-1px)', background: '#e2e8f0' }}></div>
        
        {/* Edge Bottom */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, right: 0, height: '2px', transform: 'rotateX(-90deg) translateZ(1px) translateY(1px)', background: '#64748b' }}></div>
      </motion.div>

      {/* Toolbar Overlay */}
      <div 
        onPointerDown={(e) => e.stopPropagation()} 
        onWheel={(e) => e.stopPropagation()} 
        style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px', background: 'var(--bg)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}
      >
        <button onClick={handleZoomIn} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
        <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reset View">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};

export const TemplateDrawer = ({ template, user, isAuthenticated, onClose, onStart, onEdit, onUpload }) => {
  return (
    <AnimatePresence>
      {template && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'relative', width: '1000px', maxWidth: '100vw', background: 'var(--bg)', 
              borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'row', padding: '24px', gap: '24px'
            }}
          >
            {/* Left Column: 3D Viewer */}
            <div style={{ flex: 2, border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--code-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <InteractivePreview template={template} style={{ flex: 1, border: 'none', borderRadius: 0 }} />
            </div>

            {/* Right Column: Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '320px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>Template Details</h2>
                <Button variant="ghost" onClick={onClose} style={{ padding: '8px' }}><X size={20} /></Button>
              </div>
              
              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: 'var(--text-h)' }}>{template.name}</h3>
                  
                  {template.description && (
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>
                      {template.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <span className="catalog-badge" style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', fontWeight: 700 }}>
                      {template.details?.format || 'Unknown'}
                    </span>
                    <span className="catalog-badge" style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700 }}>
                      {template.photoCount || template.details?.slotsCount || 0} slots
                    </span>
                    {template.theme && (
                      <span className="catalog-badge" style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700 }}>
                        {template.theme}
                      </span>
                    )}
                    {template.colorStyle && (
                      <span className="catalog-badge" style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700 }}>
                        {template.colorStyle}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Creator</span>
                      <span>
                        {template.creator_name || 
                         (template.owner_id === user?.id || template.owner_id === 'local-user' 
                           ? (user?.name || localStorage.getItem('lastKnownName') || 'Guest') 
                           : (template.profiles?.display_name || 'Community'))}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Created</span>
                      <span>{formatTemplateDate(template.created_at)}</span>
                    </div>
                  </div>
                </div>

                {template.tags && template.tags.length > 0 && (
                  <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-h)' }}>Tags</h4>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {template.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--panel)', color: 'var(--text)', borderRadius: '100px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', background: 'linear-gradient(180deg, var(--bg) 0%, var(--panel) 100%)' }}>
                <Button variant="primary" style={{ flex: 2 }} onClick={onStart}>Start Session</Button>
                {(isAuthenticated && (user?.role === 'super_admin' || user?.id === template.owner_id || template.owner_id === 'local')) && (
                  <Button style={{ flex: 1 }} onClick={onEdit}>Edit</Button>
                )}
                {onUpload && (
                  <Button style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }} onClick={onUpload}>
                    <CloudUpload size={16} /> Upload
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
