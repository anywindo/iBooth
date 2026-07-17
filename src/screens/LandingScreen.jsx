import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Camera, Sparkles, X } from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import AuthModal from '../components/AuthModal.jsx';
import exampleImage from '../assets/example.jpg';
import { AboutModal } from '../components/AboutModal.jsx';
import shutterSound from '../assets/SHUTTER.mp3';
import { useStore } from '../core/useStore.js';
import { useAuthStore } from '../store/authStore.js';
import packageJson from '../../package.json';
import changelogText from '../../CHANGELOG.md?raw';
import { InfiniteSlider } from '../../components/motion-primitives/infinite-slider';
import { CreditsSandbox } from '../components/CreditsSandbox.jsx';

export function InfiniteSliderVertical() {
  const imgStyle = {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '4px',
    flexShrink: 0
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      <InfiniteSlider direction='vertical' speedOnHover={20} gap={24}>
        <img
          src='https://picsum.photos/seed/picsum1/300/300'
          alt='Random photo 1'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum2/300/300'
          alt='Random photo 2'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum3/300/300'
          alt='Random photo 3'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum4/300/300'
          alt='Random photo 4'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum5/300/300'
          alt='Random photo 5'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum6/300/300'
          alt='Random photo 6'
          style={imgStyle}
        />
      </InfiniteSlider>
      <InfiniteSlider direction='vertical' reverse speedOnHover={20} gap={24}>
        <img
          src='https://picsum.photos/seed/picsum7/300/300'
          alt='Random photo 7'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum8/300/300'
          alt='Random photo 8'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum9/300/300'
          alt='Random photo 9'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum10/300/300'
          alt='Random photo 10'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum11/300/300'
          alt='Random photo 11'
          style={imgStyle}
        />
        <img
          src='https://picsum.photos/seed/picsum12/300/300'
          alt='Random photo 12'
          style={imgStyle}
        />
      </InfiniteSlider>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  return (
    <div style={{ marginBottom: '1rem', background: 'var(--code-bg)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)' }}
      >
        <span style={{
          marginRight: '12px',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          display: 'inline-block',
          fontSize: '0.8rem',
          color: 'var(--text)'
        }}>
          ▼
        </span>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-h)' }}>{title}</h3>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: collapsed ? '0fr' : '1fr',
        transition: 'grid-template-rows 0.3s ease-in-out',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}



const workflowItems = [
  { value: '01', label: 'Design', detail: 'Create or import your own strip template.' },
  { value: '02', label: 'Capture', detail: 'Run a guided booth session to check.' },
  { value: '03', label: 'Share', detail: 'Save to the cloud and share with everyone.' }
];

const extendedWorkflowItems = [
  { value: '1', label: 'Choose a template', detail: 'Select your favorite template from the catalog and customize it in seconds.' },
  { value: '2', label: 'Start the session', detail: 'Grab your friends, strike a pose, and enjoy the fun with interactive features.' },
  { value: '3', label: 'Share the fun', detail: 'Download your photos instantly or share them directly with others.' },
  { value: '4', label: 'Save your memories', detail: 'All your fun moments are securely saved in your digital gallery.' }
];

export default function LandingScreen() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const releases = changelogText
    .split(/(?=^##\s)/m)
    .map(t => t.trim())
    .filter(t => t.startsWith('##'));

  const { scrollX } = useScroll({ container: containerRef });
  const copyParallax = useTransform(scrollX, [0, 2000], [0, -250]);
  const showcaseParallax = useTransform(scrollX, [0, 2000], [0, 400]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);

    // Infinite loop: instantly snap from clone (index 3) to real first slide (index 0)
    if (Math.abs(scrollLeft - 3 * clientWidth) < 2) {
      containerRef.current.scrollTo({ left: 0, behavior: 'auto' });
      setActiveSlide(0);
      return;
    }

    setActiveSlide(index);
  };

  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [headlineSequence, setHeadlineSequence] = useState(0);
  const [stats, setStats] = useState({ users: 0, templates: 0 });
  const [templatesList, setTemplatesList] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const shutterAudioRef = useRef(null);
  const showToast = useStore((store) => store.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchTemplates = useStore((store) => store.fetchTemplates);
  const fetchCloudTemplates = useStore((store) => store.fetchCloudTemplates);

  const [isInterrupted, setIsInterrupted] = useState(false);
  const interruptTimeoutRef = useRef(null);

  const handleInteraction = () => {
    setIsInterrupted(true);
    if (interruptTimeoutRef.current) {
      clearTimeout(interruptTimeoutRef.current);
    }
    interruptTimeoutRef.current = setTimeout(() => {
      setIsInterrupted(false);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (interruptTimeoutRef.current) {
        clearTimeout(interruptTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const res = isOnline ? await fetchCloudTemplates() : await fetchTemplates();
        if (!active) return;
        if (res.success && res.data && res.data.length > 0) {
          const templates = res.data;
          setTemplatesList(templates);
          const uniqueUsers = new Set(templates.map((t) => t.owner_id || 'local-user')).size;
          setStats({
            users: uniqueUsers,
            templates: templates.length
          });
        } else {
          // Fallback to local storage if empty
          const localTemplates = JSON.parse(localStorage.getItem('templates') || '[]');
          setTemplatesList(localTemplates);
          const uniqueUsers = new Set(localTemplates.map((t) => t.owner_id || 'local-user')).size;
          setStats({
            users: uniqueUsers,
            templates: localTemplates.length
          });
        }
      } catch (e) {
        console.error('Failed to load stats', e);
        if (!active) return;
        // Fallback
        const localTemplates = JSON.parse(localStorage.getItem('templates') || '[]');
        setTemplatesList(localTemplates);
        const uniqueUsers = new Set(localTemplates.map((t) => t.owner_id || 'local-user')).size;
        setStats({
          users: uniqueUsers,
          templates: localTemplates.length
        });
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [fetchTemplates]);

  const handleEditorClick = () => {
    if (!isAuthenticated) {
      showToast('You will need to login to access the editor', 'warning');
      return;
    }
    navigate('/editor');
  };

  const handleBecomeCreatorClick = () => {
    if (!isAuthenticated) {
      navigate('/auth?view=register');
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

  useEffect(() => {
    if (isInterrupted) return;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      const nextIndex = (activeSlide + 1) % 4; // Use 4 to reach the clone
      containerRef.current.scrollTo({
        left: nextIndex * clientWidth,
        behavior: 'smooth'
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeSlide, isInterrupted]);

  /*
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isScrolling = false;
    let wheelTimeout;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();

        if (isScrolling) return;

        const direction = Math.sign(e.deltaY);
        if (direction === 0) return;

        isScrolling = true;
        const currentIndex = Math.round(el.scrollLeft / el.clientWidth);
        const nextIndex = Math.max(0, Math.min(2, currentIndex + direction));

        el.scrollTo({
          left: nextIndex * el.clientWidth,
          behavior: 'smooth'
        });

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          isScrolling = false;
        }, 800);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(wheelTimeout);
    };
  }, []);
  */

  const playShutterHover = () => {
    if (!shutterAudioRef.current) {
      return;
    }

    shutterAudioRef.current.currentTime = 0;
    shutterAudioRef.current.play().catch(() => { });
  };

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="menu-dropdown-button" onClick={() => navigate('/')}>Home</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
      <button className="menu-dropdown-button" onClick={handleEditorClick} disabled={!isAuthenticated}>Editor</button>
      {/* <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About iBooth
            </button>
          </div>
        )}
      </div> */}
    </div>
  );

  const actions = (
    <>
      {/* <Button variant="warning" onClick={() => navigate('/editor')}>Start</Button> */}
    </>
  );

  const renderHeroPanel = (isClone = false) => (
    <motion.section
      key={isClone ? "hero-clone" : "hero-main"}
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
      <motion.div style={{ x: isClone ? 0 : copyParallax, zIndex: 1 }}>
        <motion.div
          className="landing-copy"
          initial={isClone ? { opacity: 1, x: 0 } : { opacity: 0, x: -28 }}
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
            <button className="primary" onClick={handleEditorClick} disabled={!isAuthenticated}>Design a template</button>
          </div>

        </motion.div>
      </motion.div>

      <motion.div style={{ x: isClone ? 0 : showcaseParallax, zIndex: 2 }}>
        <motion.div
          className="landing-showcase"
          initial={isClone ? { opacity: 1, x: 0 } : { opacity: 0, x: 34 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
          drag={!isClone}
          dragMomentum={false}
          whileDrag={!isClone ? { scale: 1.015, cursor: 'grabbing' } : undefined}
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
      </motion.div>
    </motion.section>
  );

  return (
    <AppShell
      title="iBooth"
      menu={menu}
      actions={actions}
      statusLabel="Clear"
      statusBar={
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => setShowAboutModal(true)} style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', boxShadow: 'none', minHeight: 'auto', minWidth: 'auto', fontFamily: 'inherit', fontSize: 'inherit' }}>iBooth v{packageJson.version}</button>
          <button onClick={() => navigate('/privacy')} style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, textDecoration: 'underline', cursor: 'pointer', boxShadow: 'none', minHeight: 'auto', minWidth: 'auto' }}>Privacy Policy</button>
          <button onClick={() => navigate('/terms')} style={{ background: 'transparent', border: 'none', color: 'inherit', padding: 0, textDecoration: 'underline', cursor: 'pointer', boxShadow: 'none', minHeight: 'auto', minWidth: 'auto' }}>Terms of Service</button>
        </div>
      }
      statusBarRight={<div>Part of <a href="https://arwndoprtma.space" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>arwndoprtma.space</a></div>}
    >
      <div
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
        onPointerDown={handleInteraction}
        onWheel={handleInteraction}
        onKeyDown={handleInteraction}
      >
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
            msOverflowStyle: 'none'
          }}>
          {renderHeroPanel(false)}

          {/* Panel 2: How it works & Updates & Promotion */}
          <section className="landing-details" style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'start',
            height: '100%',
            padding: '2.5rem 3rem',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            gap: '2.5rem',
            textAlign: 'left',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: 0, padding: '2.5rem 0 2.5rem 3rem' }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>How it works for Creator</h2>
                <p style={{ marginBottom: '2rem' }}>We support transparency, simplicity, and flexibility. We provide the tools, you create the magic. Keep the memories!</p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1.5rem',
                  overflowX: 'auto',
                  paddingBottom: '1rem',
                  scrollbarWidth: 'thin',
                  msOverflowStyle: 'none'
                }}>
                  {workflowItems.map((item, index) => (
                    <motion.div
                      key={item.value}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
                      style={{
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Jepreto-inspired Content (Stats and Steps) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Step-by-step Experience</h2>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1.5rem',
                  overflowX: 'auto',
                  paddingBottom: '1rem',
                  scrollbarWidth: 'thin',
                  msOverflowStyle: 'none'
                }}>
                  {extendedWorkflowItems.map((item, index) => (
                    <motion.div
                      key={item.value}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.4, ease: 'easeOut' }}
                      style={{
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {isOnline && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600 }}>Community Stats</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <Button variant="primary" onClick={handleBecomeCreatorClick} style={{ flexShrink: 0 }}>Become a Creator <Sparkles size={16} style={{ marginLeft: '6px' }} /></Button>
                      <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.95rem', maxWidth: '500px', lineHeight: '1.5' }}>
                        Join a growing community of creative minds! Start designing your first template today!
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollbarWidth: 'thin',
                    msOverflowStyle: 'none'
                  }}>
                    {[
                      { value: stats.users, label: 'Total creators' },
                      { value: stats.templates, label: 'Templates created' }
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 + 0.5, ease: 'easeOut' }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          flex: '0 0 200px',
                          background: 'var(--code-bg)',
                          padding: '1.25rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '2rem' }}>{stat.value}</span>
                        <span style={{ color: 'var(--text-h)', fontSize: '1rem', fontWeight: 500 }}>{stat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div style={{ flex: '0 0 auto', display: 'flex', margin: '-2.5rem 0' }}>
              <div style={{ height: 'calc(100% + 5rem)' }}>
                <InfiniteSliderVertical />
              </div>
            </div>
          </section>

          {/* Panel 3: Latest Updates */}
          <section className="landing-details" style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'start',
            height: '100%',
            padding: '2.5rem 3rem',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: isOnline ? '1fr 1fr' : '1fr',
            gap: '4rem',
            textAlign: 'left',
            overflow: 'hidden',
            backgroundColor: 'var(--bg)',
            backgroundImage: 'radial-gradient(circle, rgba(150, 150, 150, 0.25) 2px, transparent 2px)',
            backgroundSize: '32px 32px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600, flexShrink: 0 }}>Latest Updates</h2>
              <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Contribute to this project on <a href="https://github.com/anywindo/iBooth" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>GitHub</a></p>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem', paddingBottom: '2rem' }} className="custom-scrollbar">
                {releases.map((release, i) => {
                  const lines = release.split('\n');
                  const title = lines[0].replace(/^##\s+/, '').trim();
                  const content = lines.slice(1).join('\n');
                  return (
                    <CollapsibleSection key={title} title={title} defaultCollapsed={i !== 0}>
                      <div style={{
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                      }}>
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.8rem', marginTop: 0, marginBottom: '1rem', color: 'var(--text-h)' }} {...props} />,
                            h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.4rem', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-h)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }} {...props} />,
                            h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-h)', fontWeight: 600 }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
                            strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-h)', fontWeight: 600 }} {...props} />,
                            code: ({ node, ...props }) => <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'var(--mono)', fontSize: '0.9em', color: 'var(--accent)' }} {...props} />
                          }}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>
                    </CollapsibleSection>
                  );
                })}
              </div>
            </div>
            {isOnline && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600, flexShrink: 0 }}>Contributors</h2>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                  <CreditsSandbox templates={templatesList} />
                </div>
              </div>
            )}
            {/* <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600, flexShrink: 0 }}>Latest Updates</h2> */}
          </section>

          {/* Invisible clone of the first panel for seamless looping */}
          {renderHeroPanel(true)}
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
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => {
                containerRef.current?.scrollTo({
                  left: index * containerRef.current.clientWidth,
                  behavior: 'smooth'
                });
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: activeSlide === index ? 'var(--accent)' : 'rgba(150, 150, 150, 0.5)',
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

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
    </AppShell>
  );
}
