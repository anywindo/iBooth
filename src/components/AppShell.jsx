import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../core/useStore';
import { Sun, Moon, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import defaultLogo from '../assets/ibootlogo-cb.png';
import whiteLogo from '../assets/ibootlogo-cw.png';
import iconLogo from '../assets/favicon.png';
import { isElectron } from '../core/platform.js';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';

export function AppShell({ title, subtitle, actions, menu, statusBar, statusBarRight, statusLabel = 'Clear', children, showBackButton = false, onBack, hideAuthButton = false, hideAppearance = false }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
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
      <header className="topbar" style={{ paddingLeft: isElectron() ? '72px' : undefined, WebkitAppRegion: isElectron() ? 'drag' : 'auto' }}>
        <div className="brand" style={{ WebkitAppRegion: 'no-drag', borderRight: isElectron() ? 'none' : undefined, width: isElectron() ? 'auto' : undefined, paddingRight: isElectron() ? '16px' : undefined }}>
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
            <img src={theme === 'dark' ? whiteLogo : defaultLogo} alt="iBooth Branding" style={{ width: 'auto', height: '24px', objectFit: 'contain' }} />
          </button>
          {isElectron() && (
            <div style={{ display: 'flex', gap: '4px', marginLeft: '12px', WebkitAppRegion: 'no-drag' }}>
              <button 
                onClick={() => { if (location.pathname !== '/') navigate(-1); }} 
                style={{ background: 'transparent', border: 'none', padding: '4px', cursor: location.pathname === '/' ? 'default' : 'pointer', color: 'var(--text)', opacity: location.pathname === '/' ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => navigate(1)} 
                style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          {isElectron() && menu && (
            <div style={{ display: 'flex', marginLeft: '16px', WebkitAppRegion: 'no-drag' }}>
              {menu}
            </div>
          )}
        </div>
        <div className="menu-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {subtitle && <span style={{ fontSize: '15px', fontWeight: 800 }}>{subtitle}</span>}
          {!isElectron() && (
            <div style={{ WebkitAppRegion: 'no-drag' }}>
              {menu}
            </div>
          )}
        </div>
        <div className="toolbar-group" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' }}>
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
                  {user.id !== 'local' ? (
                    <>
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
                    </>
                  ) : (
                    <button 
                      className="menu-dropdown-item"
                      onClick={() => { setShowProfileMenu(false); navigate('/auth'); }}
                    >
                      Login to Cloud
                    </button>
                  )}
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
