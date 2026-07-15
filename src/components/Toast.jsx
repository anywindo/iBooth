import React from 'react';
import { useStore } from '../core/useStore.js';

const TOAST_COLORS = {
  light: {
    info: { bg1: '#fcfdff', bg2: '#e6ebf1', color: '#334155', border: '#cbd5e1', textShadow: '0 1px 0 rgba(255,255,255,0.9)' },
    success: { bg1: '#f0fdf4', bg2: '#dcfce7', color: '#166534', border: '#bbf7d0', textShadow: '0 1px 0 rgba(255,255,255,0.8)' },
    warning: { bg1: '#fffbeb', bg2: '#fef3c7', color: '#92400e', border: '#fde68a', textShadow: '0 1px 0 rgba(255,255,255,0.9)' },
    error: { bg1: '#fef2f2', bg2: '#fee2e2', color: '#991b1b', border: '#fecaca', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }
  },
  dark: {
    info: { bg1: '#334155', bg2: '#1e293b', color: '#f8fafc', border: '#475569', textShadow: '0 -1px 1px rgba(0,0,0,0.6)' },
    success: { bg1: '#166534', bg2: '#14532d', color: '#f0fdf4', border: '#22c55e', textShadow: '0 -1px 1px rgba(0,0,0,0.6)' },
    warning: { bg1: '#92400e', bg2: '#78350f', color: '#fffbeb', border: '#f59e0b', textShadow: '0 -1px 1px rgba(0,0,0,0.6)' },
    error: { bg1: '#991b1b', bg2: '#7f1d1d', color: '#fef2f2', border: '#ef4444', textShadow: '0 -1px 1px rgba(0,0,0,0.6)' }
  }
};

const ICONS = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  )
};

export default function Toast() {
  const { message, type, visible, id } = useStore((state) => state.toast);
  const theme = useStore((state) => state.theme);

  if (!visible) return null;

  const styleColors = (TOAST_COLORS[theme] && TOAST_COLORS[theme][type]) || TOAST_COLORS.light.info;

  return (
    <div key={id} style={{
      position: 'fixed',
      top: '74px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: `linear-gradient(180deg, ${styleColors.bg1} 0%, ${styleColors.bg2} 100%)`,
      color: styleColors.color,
      border: `1px solid ${styleColors.border}`,
      borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
      padding: '12px 28px',
      borderRadius: '24px',
      boxShadow: theme === 'dark' 
        ? '0 10px 25px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)' 
        : '0 10px 25px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.8)',
      textShadow: styleColors.textShadow,
      zIndex: 9999,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '1.5',
      whiteSpace: 'pre-line',
      textAlign: 'center',
      animation: 'toastSlideDown 5s ease-in-out forwards'
    }}>
      {ICONS[type] || ICONS.info}
      <span>{message}</span>
      <style>{`
        @keyframes toastSlideDown {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          5% { opacity: 1; transform: translate(-50%, 0); }
          95% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>
    </div>
  );
}
