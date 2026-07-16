import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';
import { Sun, Moon } from 'lucide-react';
import defaultLogo from '../assets/ibootlogo-cb.png';
import iconLogo from '../assets/favicon.png';

export function AppShell({ title, subtitle, actions, menu, statusBar, statusBarRight, statusLabel = 'Clear', children, showBackButton = false, onBack, hideAuthButton = false, hideAppearance = false }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const theme = useStore((store) => store.theme);
  const setTheme = useStore((store) => store.setTheme);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to homepage"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: 0,
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              minHeight: 'auto',
              color: 'inherit',
            }}
          >
            <img src={iconLogo} alt="iBooth Icon" style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'contain' }} />
            {(!title || title === 'iBooth') ? (
              <img src={defaultLogo} alt="iBooth Branding" style={{ width: 'auto', height: '24px', objectFit: 'contain' }} />
            ) : (
              <span>{title}</span>
            )}
          </button>
          {showBackButton && (
            <button className="back-button" onClick={onBack} aria-label="Back to home">
              Back
            </button>
          )}
        </div>
        <div className="menu-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {subtitle && <span style={{ fontSize: '15px', fontWeight: 800 }}>{subtitle}</span>}
          {menu}
        </div>
        <div className="toolbar-group" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions}
          {!hideAuthButton && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button 
                onClick={() => {
                  if (user) {
                    setShowProfileMenu(!showProfileMenu);
                  } else {
                    navigate('/auth');
                  }
                }} 
                className="auth-button"
              >
                {user ? user.name || 'Account' : 'Login'}
              </button>
              {user && showProfileMenu && (
                <div className="menu-dropdown-content" style={{ position: 'absolute', top: '100%', right: 0, left: 'auto', marginTop: '8px' }}>
                  <button 
                    className="menu-dropdown-item"
                    onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                  >
                    Profile
                  </button>
                  <button 
                    className="menu-dropdown-item"
                    style={{ color: '#ff4d4f' }}
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
          {!hideAppearance && (
            <button 
              className="menu-dropdown-button icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ 
                minHeight: '32px', 
                width: '34px', 
                padding: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                boxShadow: 'none'
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </header>
      {children}
      {statusBar && (
        <footer className="statusbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {statusBar}
          </div>
          {statusBarRight}
        </footer>
      )}
    </div>
  );
}
