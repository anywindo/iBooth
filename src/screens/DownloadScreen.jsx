import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Download, Monitor, Laptop } from 'lucide-react';
import { InteractiveDots } from '../components/InteractiveDots.jsx';
import { motion } from 'framer-motion';
export default function DownloadScreen() {
  const navigate = useNavigate();
  const [osInfo, setOsInfo] = useState({ os: 'unknown', arch: 'unknown' });

  useEffect(() => {
    const checkOS = async () => {
      let os = 'unknown';
      let arch = 'unknown';

      if (navigator.userAgent.indexOf("Win") !== -1) os = 'windows';
      if (navigator.userAgent.indexOf("Mac") !== -1) os = 'mac';
      if (navigator.userAgent.indexOf("Linux") !== -1) os = 'linux';

      // Advanced detection using userAgentData if available
      if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
          const ua = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
          if (ua.architecture === 'arm') arch = 'arm64';
          else if (ua.architecture === 'x86') arch = 'x64';
        } catch (e) {
          console.error("Error getting high entropy values", e);
        }
      } 
      
      // Fallback heuristics
      if (arch === 'unknown') {
        if (os === 'mac') {
          const w = document.createElement("canvas").getContext("webgl");
          if (w) {
            const d = w.getExtension('WEBGL_debug_renderer_info');
            const g = d && w.getParameter(d.UNMASKED_RENDERER_WEBGL);
            if (g && g.match(/Apple/)) {
              arch = 'arm64';
            } else {
              arch = 'x64';
            }
          }
        } else if (os === 'windows') {
          arch = navigator.userAgent.indexOf("WOW64") !== -1 || navigator.userAgent.indexOf("Win64") !== -1 ? 'x64' : 'x86';
          if (navigator.userAgent.indexOf("ARM") !== -1) arch = 'arm64';
        }
      }
      setOsInfo({ os, arch });
    };
    
    checkOS();
  }, []);

  const downloadLinks = {
    mac: {
      arm64: 'https://github.com/anywindo/iBooth/releases/download/v0.0.1-beta/iBooth-0.0.1-beta-mac-arm64.dmg',
      x64: 'https://github.com/anywindo/iBooth/releases/download/v0.0.1-beta/iBooth-0.0.1-beta-mac-x64.dmg'
    },
    windows: {
      arm64: 'https://github.com/anywindo/iBooth/releases/download/v0.0.1-beta/iBooth-0.0.1-beta-win-arm64.exe',
      x64: 'https://github.com/anywindo/iBooth/releases/download/v0.0.1-beta/iBooth-0.0.1-beta-win-x64.exe'
    }
  };

  const recommendedLink = downloadLinks[osInfo.os]?.[osInfo.arch];

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={() => navigate('/')}>Home</button>
    </div>
  );

  return (
    <AppShell title="Download" menu={menu}>
      <div style={{ position: 'relative', minHeight: '100%', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
        <InteractiveDots />
        <div style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-h)', fontWeight: 800, letterSpacing: '-0.02em' }}>Download iBooth</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '3.5rem', maxWidth: '500px', margin: '0 auto 3.5rem' }}>
              Elevate your photobooth business. Download the robust, offline-ready software built for professional events.
            </p>
          </motion.div>

          {osInfo.os !== 'unknown' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              style={{ 
                marginBottom: '4rem', 
                padding: '3rem 2rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle top glow */}
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }} />

              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', color: 'var(--text-h)', fontWeight: 600 }}>Recommended for you</h2>
              <p style={{ marginBottom: '2rem', color: 'var(--text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {osInfo.os === 'mac' ? <Laptop size={18} /> : <Monitor size={18} />} 
                Detected: {osInfo.os === 'mac' ? 'macOS' : osInfo.os === 'windows' ? 'Windows' : osInfo.os} ({osInfo.arch})
              </p>

              {recommendedLink ? (
                <Button variant="primary" onClick={() => window.location.href = recommendedLink} style={{ padding: '1.2rem 2.5rem', fontSize: '1.15rem', borderRadius: '12px' }}>
                  <Download size={22} style={{ marginRight: '10px' }} />
                  Download for {osInfo.os === 'mac' ? 'macOS' : 'Windows'}
                </Button>
              ) : (
                <p style={{ color: 'var(--text-h)', fontWeight: '500', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                  No build available yet for your operating system.
                </p>
              )}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'left', color: 'var(--text-h)', fontWeight: 600 }}>All Downloads</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'background 0.2s', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ color: 'var(--text-h)', fontSize: '1.05rem' }}>macOS</strong>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Apple Silicon (ARM64)</span>
                </div>
                <Button variant="ghost" onClick={() => window.location.href = downloadLinks.mac.arm64}><Download size={18} /></Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'background 0.2s', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ color: 'var(--text-h)', fontSize: '1.05rem' }}>macOS</strong>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Intel (x64)</span>
                </div>
                <Button variant="ghost" onClick={() => window.location.href = downloadLinks.mac.x64}><Download size={18} /></Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'background 0.2s', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ color: 'var(--text-h)', fontSize: '1.05rem' }}>Windows</strong>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>ARM64</span>
                </div>
                <Button variant="ghost" onClick={() => window.location.href = downloadLinks.windows.arm64}><Download size={18} /></Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'background 0.2s', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ color: 'var(--text-h)', fontSize: '1.05rem' }}>Windows</strong>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>x64</span>
                </div>
                <Button variant="ghost" onClick={() => window.location.href = downloadLinks.windows.x64}><Download size={18} /></Button>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
