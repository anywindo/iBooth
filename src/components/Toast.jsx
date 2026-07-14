import React from 'react';
import { useStore } from '../core/useStore.js';

const TOAST_COLORS = {
  light: {
    info: { bg: '#fbfbf7', color: '#1c2524', border: '#d4d9d6' },
    success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    warning: { bg: '#fff7ed', color: '#7c2d12', border: '#f1c27d' },
    error: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
  },
  dark: {
    info: { bg: '#161b22', color: '#e6edf3', border: '#30363d' },
    success: { bg: '#0f2416', color: '#8ddb9c', border: '#1f3a28' },
    warning: { bg: '#26170b', color: '#f4c28b', border: '#4d3414' },
    error: { bg: '#2a1111', color: '#ffb4b4', border: '#5a2323' }
  }
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
      right: '24px',
      backgroundColor: styleColors.bg,
      color: styleColors.color,
      border: `1px solid ${styleColors.border}`,
      padding: '12px 24px',
      borderRadius: '8px',
      boxShadow: '0 16px 35px #0f172a21',
      zIndex: 9999,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      lineHeight: '1.5',
      whiteSpace: 'pre-line',
      textAlign: 'center',
      animation: 'toastSlideDown 5s ease-in-out forwards'
    }}>
      {message}
      <style>{`
        @keyframes toastSlideDown {
          0% { opacity: 0; transform: translateY(-20px); }
          5% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
