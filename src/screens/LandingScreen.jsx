import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Camera, Sparkles, X } from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import AuthModal from '../components/AuthModal.jsx';
import exampleImage from '../assets/example.jpg';
import aboutImage from '../assets/about.png';
import shutterSound from '../assets/SHUTTER.mp3';
import { useStore } from '../core/useStore.js';
import { useAuthStore } from '../store/authStore.js';
import packageJson from '../../package.json';
import changelogText from '../../CHANGELOG.md?raw';

function parseChangelog(text) {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentSub = null;

  for (let line of lines) {
    const versionMatch = line.match(/^##\s+\[?([0-9a-zA-Z.-]+)\]?\s*-\s*(.+)/);
    if (versionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        version: versionMatch[1],
        date: versionMatch[2],
        items: []
      };
      currentSub = null;
      continue;
    }

    if (currentSection) {
      const typeMatch = line.match(/^###\s+(Added|Changed|Fixed|Removed|Deprecated|Security|Verified)/i);
      if (typeMatch) {
        currentSub = typeMatch[1];
        continue;
      }

      const itemMatch = line.match(/^-\s+(.+)/);
      if (itemMatch && currentSub) {
        currentSection.items.push({
          type: currentSub,
          text: itemMatch[1]
        });
      }
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  return sections;
}

function CollapsibleSection({ title, note, noteClassName = "section-note", headingClassName = "section-heading", children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className="panel-section">
      <div
        className={headingClassName}
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{
          marginRight: '8px',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          display: 'inline-block',
          fontSize: '10px'
        }}>▼</span>
        <h2 className="panel-title" style={{ flex: 1, margin: 0 }}>{title}</h2>
        {note && <span className={noteClassName}>{note}</span>}
      </div>
      <div style={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
        {children}
      </div>
    </section>
  );
}

const workflowItems = [
  { value: '01', label: 'Design', detail: 'Build polished strip layouts fast.' },
  { value: '02', label: 'Capture', detail: 'Run a guided booth session.' },
  { value: '03', label: 'Share', detail: 'Save templates and exports.' }
];

export default function LandingScreen({ navigate }) {
  const containerRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveSlide(index);
  };

  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [headlineSequence, setHeadlineSequence] = useState(0);
  const shutterAudioRef = useRef(null);
  const showToast = useStore((store) => store.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleEditorClick = () => {
    if (!isAuthenticated) {
      showToast('You will need to login to access the editor', 'warning');
      return;
    }
    navigate('/editor');
  };

  useEffect(() => {
    const audio = new Audio(shutterSound);
    audio.preload = 'auto';
    shutterAudioRef.current = audio;

    return () => {
      audio.pause();
      shutterAudioRef.current = null;
    };
  }, []);

  const playShutterHover = () => {
    if (!shutterAudioRef.current) {
      return;
    }

    shutterAudioRef.current.currentTime = 0;
    shutterAudioRef.current.play().catch(() => { });
  };

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={handleEditorClick}>Editor</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
      <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About iBooth
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const actions = (
    <>
      {/* <Button variant="warning" onClick={() => navigate('/editor')}>Start</Button> */}
    </>
  );

  const changelog = parseChangelog(changelogText);

  return (
    <AppShell
      title="iBooth"
      menu={menu}
      actions={actions}
      statusLabel="Clear"
      statusBar={<div>iBooth v{packageJson.version}</div>}
      statusBarRight={<div>Part of <a href="https://arwndoprtma.space" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>arwndoprtma.space</a></div>}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <main 
          ref={containerRef}
          onScroll={handleScroll}
          className="landing-page" 
          style={{
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        width: '100%',
        height: '100%',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        scrollBehavior: 'smooth'
      }}>
        <motion.section
          className="workspace landing-workspace"
          style={{ 
            flex: '0 0 100%', 
            scrollSnapAlign: 'start', 
            height: '100%',
            boxSizing: 'border-box'
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="landing-copy"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >

            <h1
              key={headlineSequence}
              className={`hero-title${headlineSequence ? ' sequence-active' : ''}`}
              onClick={() => setHeadlineSequence((sequence) => sequence + 1)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setHeadlineSequence((sequence) => sequence + 1);
                }
              }}
              role="button"
              tabIndex={0}
            // title="Click to play the headline"
            >
              <span className="hero-word hero-word-make" aria-label="Make">
                {'Make'.split('').map((letter, index) => (
                  <span key={letter + index} aria-hidden="true" style={{ '--letter-index': index }}>{letter}</span>
                ))}
              </span>{' '}
              <span className="hero-word hero-word-the">the</span><br />
              <span className="hero-word hero-word-moment">moment.</span><br />
              <span className="landing-title-accent hero-word hero-word-proof hover-capture" onMouseEnter={playShutterHover}>Keep the proof.</span>
            </h1>
            <p>
              A playful photo booth studio for people who want their memories to look as good as they felt.
            </p>
            <div className="landing-actions">
              <Button variant="primary" onClick={() => navigate('/catalog')}>Start a booth <ArrowUpRight size={18} /></Button>
              <button className="landing-text-action" onClick={handleEditorClick}>Design a template</button>
            </div>

          </motion.div>

          <motion.div
            className="landing-showcase"
            initial={{ opacity: 0, x: 34 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.015, cursor: 'grabbing' }}
          >
            <div className="landing-booth-window">
              <div className="landing-window-titlebar">
                <div className="landing-window-controls" aria-hidden="true"><i /><i /><i /></div>
                <span><Camera size={14} /> iBooth Camera</span>
                <div />
              </div>
              <div className="landing-camera-view">
                <img src={exampleImage} alt="Friends enjoying an iBooth session" draggable="false" />
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Panel 2: How it works & Updates & Promotion */}
        <section className="landing-details" style={{
          flex: '0 0 100%',
          scrollSnapAlign: 'start',
          height: '100%',
          padding: '2.5rem 3rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          textAlign: 'left',
          overflowY: 'auto'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>How it works</h2>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '1.5rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem',
              scrollbarWidth: 'thin',
              msOverflowStyle: 'none'
            }}>
              {workflowItems.map((item) => (
                <div key={item.value} style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'baseline',
                  flex: '0 0 260px',
                  background: 'var(--code-bg)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{item.value}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>{item.label}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.4' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Latest Updates</h2>
            {changelog.slice(0, 3).map((release, i) => (
              <CollapsibleSection
                key={release.version}
                title={`v${release.version}`}
                note={release.date}
                defaultCollapsed={i !== 0}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingLeft: '1.5rem' }}>
                  {release.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: 'var(--accent-bg)', 
                        color: 'var(--accent)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.type}
                      </span>
                      <span style={{ color: 'var(--text)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </section>
      </main>

      {/* Slide Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 10,
        pointerEvents: 'auto'
      }}>
        {[0, 1].map((index) => (
          <button
            key={index}
            onClick={() => {
              containerRef.current?.scrollTo({
                left: index * containerRef.current.clientWidth,
                behavior: 'smooth'
              });
            }}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: activeSlide === index ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeSlide === index ? 'scale(1.2)' : 'scale(1)',
              boxShadow: 'none',
              minHeight: 'auto',
              minWidth: 'auto'
            }}
            title={`Go to panel ${index + 1}`}
            aria-label={`Go to panel ${index + 1}`}
          />
        ))}
      </div>
    </div>

      {showAboutModal && (
        <div
          onClick={() => setShowAboutModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '800px',
              maxWidth: '90vw',
            }}
          >
            <img
              src={aboutImage}
              alt="About iBooth"
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '22%',
                left: '43%',
                width: '44%',
                minHeight: '38%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.8rem',
                padding: '1.2rem 1.4rem',
                color: '#f7f7f7',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)', fontWeight: 800, letterSpacing: '0.02em' }}
                >
                  About iBooth
                </motion.div>
                <motion.div
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <Button
                    type="button"
                    onClick={() => setShowAboutModal(false)}
                    aria-label="Close about dialog"
                    style={{
                      minWidth: '38px',
                      width: '38px',
                      height: '38px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginRight: '-8px',
                      transition: 'filter 0.2s ease',
                    }}
                  >
                    <X size={20} />
                  </Button>
                </motion.div>
              </div>
              <div style={{ fontSize: 'clamp(0.78rem, 1.3vw, 0.96rem)', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
                iBooth is a completely free photobooth app built for creating,
                capturing, and printing photo strip experiences.
              </div>
              <div style={{ fontSize: 'clamp(0.72rem, 1.15vw, 0.88rem)', lineHeight: 1.55, color: 'rgba(255,255,255,0.68)' }}>
                This app may still feel buggy or slow in some places.
              </div>
              <div
                style={{
                  fontSize: 'clamp(0.72rem, 1.15vw, 0.88rem)',
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.68)',
                }}
              >
                Part of{' '}
                <motion.a
                  href="https://arwndoprtma.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  style={{
                    display: 'inline-block',
                    color: 'rgba(174, 214, 255, 0.92)',
                    textDecoration: 'underline',
                  }}
                >
                  arwndoprtma.space
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
