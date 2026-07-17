import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Download } from 'lucide-react';

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

  return (
    <AppShell title="Download" showBackButton={true} onBack={() => navigate(-1)}>
      <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-h)' }}>Download iBooth</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: '3rem' }}>Get the desktop app for the best experience.</p>

        {osInfo.os !== 'unknown' && (
          <div style={{ marginBottom: '3rem', padding: '2rem', background: 'var(--code-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-h)' }}>Recommended for your system</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
              Detected: {osInfo.os === 'mac' ? 'macOS' : osInfo.os === 'windows' ? 'Windows' : osInfo.os} ({osInfo.arch})
            </p>
            {recommendedLink ? (
              <Button variant="primary" onClick={() => window.location.href = recommendedLink} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                <Download size={20} style={{ marginRight: '8px' }} />
                Download for {osInfo.os === 'mac' ? 'macOS' : 'Windows'}
              </Button>
            ) : (
              <p style={{ color: 'var(--text-h)', fontWeight: '500' }}>
                No build available yet for your operating system.
              </p>
            )}
          </div>
        )}

        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'left', color: 'var(--text-h)' }}>All Downloads</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>macOS (Apple Silicon / ARM64)</span>
            <Button variant="ghost" onClick={() => window.location.href = downloadLinks.mac.arm64}>Download</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>macOS (Intel / x64)</span>
            <Button variant="ghost" onClick={() => window.location.href = downloadLinks.mac.x64}>Download</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>Windows (ARM64)</span>
            <Button variant="ghost" onClick={() => window.location.href = downloadLinks.windows.arm64}>Download</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>Windows (x64)</span>
            <Button variant="ghost" onClick={() => window.location.href = downloadLinks.windows.x64}>Download</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
