import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Camera, Sparkles, X } from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import AuthModal from '../components/AuthModal.jsx';
import exampleImage from '../assets/example.jpg';
import aboutImage from '../assets/about.png';
import shutterSound from '../assets/SHUTTER.mp3';
import { useStore } from '../core/useStore.js';
import { useAuthStore } from '../store/authStore.js';
import packageJson from '../../package.json';
import changelogText from '../../CHANGELOG.md?raw';
import { InfiniteSlider } from '../../components/motion-primitives/infinite-slider';

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
    setActiveSlide(index);
  };

  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [headlineSequence, setHeadlineSequence] = useState(0);
  const [stats, setStats] = useState({ users: 0, templates: 0 });
  const shutterAudioRef = useRef(null);
  const showToast = useStore((store) => store.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
    try {
      const templates = JSON.parse(localStorage.getItem('templates') || '[]');
      const uniqueUsers = new Set(templates.map((t) => t.owner_id || 'local-user')).size;
      setStats({
        users: uniqueUsers,
        templates: templates.length
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }, []);

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

  useEffect(() => {
    if (isInterrupted) return;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      const nextIndex = (activeSlide + 1) % 3;
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
      <button className="menu-dropdown-button" onClick={handleEditorClick}>Editor</button>
      <button className="menu-dropdown-button" onClick={() => navigate('/catalog')}>Catalog</button>
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

  return (
    <AppShell
      title="iBooth"
      menu={menu}
      actions={actions}
      statusLabel="Clear"
      statusBar={<div>iBooth v{packageJson.version}</div>}
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
            <motion.div style={{ x: copyParallax, zIndex: 1 }}>
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
            </motion.div>

            <motion.div style={{ x: showcaseParallax, zIndex: 2 }}>
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

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600 }}>Community Stats</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Button variant="primary" onClick={handleEditorClick} style={{ flexShrink: 0 }}>Become a Creator <Sparkles size={16} style={{ marginLeft: '6px' }} /></Button>
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
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            textAlign: 'left',
            overflow: 'hidden'
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'var(--code-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              height: '100%',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', color: 'var(--text)' }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}>✨</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-h)' }}>More coming soon</h3>
                <p style={{ opacity: 0.7, maxWidth: '250px', margin: '0 auto' }}>We're always working on new features. Stay tuned!</p>
              </motion.div>
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
