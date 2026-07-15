import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore, storeFinalSession } from '../core/useStore.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import TemplateCanvas, { drawTemplateToCanvas } from '../components/TemplateCanvas.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import rioImage from '../assets/rio.jpg';
import shutterBeepSound from '../assets/SHUTTER BEEP.mp3';
import shutterSound from '../assets/SHUTTER.mp3';



const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function createSession(template) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    templateId: template.id,
    slotIds: template.slots.map((slot) => slot.id),
    currentIndex: 0,
    captures: template.slots.map(() => null)
  };
}

function sessionMatchesTemplate(session, template) {
  return Boolean(
    session
    && session.templateId === template.id
    && Array.isArray(session.captures)
    && session.captures.length === template.slots.length
    && Array.isArray(session.slotIds)
    && session.slotIds.length === template.slots.length
    && session.slotIds.every((id, index) => id === template.slots[index]?.id)
  );
}

function hasAllRequiredCaptures(session, template) {
  return template.slots.length > 0
    && template.slots.every((_, index) => Boolean(session.captures[index]));
}

const EFFECTS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Jakarta', filter: 'contrast(110%) brightness(110%) saturate(130%) sepia(20%)' },
  { name: 'Rio de Janeiro', filter: 'contrast(130%) saturate(150%) brightness(110%)', overlay: rioImage, blendMode: 'screen', overlaySize: '100% 100%' },
  { name: 'Paris', filter: 'contrast(90%) brightness(110%) sepia(30%) grayscale(20%)' },
  { name: 'Tokyo', filter: 'contrast(120%) saturate(85%) hue-rotate(15deg) brightness(105%)' },
  { name: 'Oslo', filter: 'contrast(110%) brightness(120%) saturate(90%) hue-rotate(10deg)' },
  { name: 'Melbourne', filter: 'contrast(120%) sepia(15%) saturate(110%)' },
  { name: 'New York', filter: 'contrast(110%) saturate(80%) brightness(95%)' },
  { name: 'Cairo', filter: 'sepia(40%) contrast(110%) saturate(120%) brightness(110%)' },
  { name: 'Jaipur', filter: 'sepia(20%) saturate(140%) hue-rotate(-10deg) contrast(110%)' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'B&W Contrast', filter: 'grayscale(100%) contrast(150%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(120%) brightness(90%) saturate(120%)' },
  { name: 'Warm', filter: 'sepia(30%) saturate(150%) contrast(110%)' },
  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(150%)' },
  { name: 'Dreamy', filter: 'blur(1px) contrast(120%) brightness(110%)' },
  { name: 'Faded', filter: 'contrast(80%) brightness(120%) saturate(80%)' },
  { name: 'Invert', filter: 'invert(100%)' },
  { name: 'Contrast', filter: 'contrast(150%)' },
  { name: 'Hue Rotate', filter: 'hue-rotate(90deg)' },
  { name: 'Saturate', filter: 'saturate(300%)' },
  { name: 'Brightness', filter: 'brightness(150%)' },
];

function EffectCell({ effect, stream, onSelect }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <motion.button 
      type="button" 
      className="effect-cell" 
      onClick={() => onSelect(effect)}
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ filter: effect.filter }} />
        {effect.overlay && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${effect.overlay})`,
            backgroundSize: effect.overlaySize || 'cover',
            backgroundPosition: 'center',
            mixBlendMode: effect.blendMode || 'normal',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      <div className="effect-name">{effect.name}</div>
    </motion.button>
  );
}

export default function BoothScreen({ navigate }) {
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const videoRef = useRef(null);
  const previewWrapRef = useRef(null);
  const template = useStore((store) => store.template);
  const cameraStream = useStore((store) => store.cameraStream);
  const setCameraStream = useStore((store) => store.setCameraStream);
  const booth = useStore((store) => store.booth);
  const setBooth = useStore((store) => store.setBooth);
  const stopCameraStream = useStore((store) => store.stopCameraStream);
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [activeEffect, setActiveEffect] = useState(EFFECTS[0]);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isMirrored, setIsMirrored] = useState(true);
  const countdownIntervalRef = useRef(null);
  const autoCaptureTimeoutRef = useRef(null);
  const countdownAudioRef = useRef(new Audio(shutterBeepSound));
  const shutterAudioRef = useRef(new Audio(shutterSound));
  const isCountdownRunningRef = useRef(false);
  const newSessionRef = useRef(null);
  if (!newSessionRef.current || !sessionMatchesTemplate(newSessionRef.current, template)) {
    newSessionRef.current = createSession(template);
  }
  const session = sessionMatchesTemplate(booth, template) ? booth : newSessionRef.current;
  const isComplete = hasAllRequiredCaptures(session, template);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  function clearCountdownInterval() {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    isCountdownRunningRef.current = false;
    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
    }
  }

  function clearAutoCaptureTimeout() {
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (booth !== session) setBooth(session);
  }, [booth, session, setBooth]);

  useEffect(() => {
    async function loadCameras() {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => t.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          const firstCam = videoDevices[0].deviceId;
          setSelectedCameraId(firstCam);
          startCamera(firstCam);
        }
      } catch (e) {
        console.error('Failed to load cameras', e);
      }
    }
    loadCameras();
  }, []);

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startCamera(newId);
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => () => stopCameraStream(), [stopCameraStream]);

  useEffect(() => {
    const node = previewWrapRef.current;
    if (!node) return;
    const resize = () => {
      const availableWidth = Math.max(120, node.clientWidth);
      const availableHeight = Math.max(120, node.clientHeight);
      setPreviewScale(Math.min(availableWidth / template.width, availableHeight / template.height, 1));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [template.width, template.height]);

  useEffect(() => {
    const handler = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsAutoCapturing(true);
      }
      if (event.key.toLowerCase() === 'r') retakeCurrent();
      if (event.key === 'ArrowLeft') moveSlot(-1);
      if (event.key === 'ArrowRight') moveSlot(1);
      if (event.key === 'Enter') {
        if (hasAllRequiredCaptures(sessionRef.current, template)) finishSession();
        else if (sessionRef.current.captures[sessionRef.current.currentIndex]) moveSlot(1);
      }
      if (event.key === 'Escape') {
        setCountdown(null);
        setIsAutoCapturing(false);
        clearCountdownInterval();
        clearAutoCaptureTimeout();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function startCamera(deviceIdParam) {
    const deviceId = typeof deviceIdParam === 'string' ? deviceIdParam : selectedCameraId;
    if (cameraStream && !deviceId) return;
    if (cameraStream) stopCameraStream();
    
    try {
      const constraints = { video: { width: 1280, height: 720 }, audio: false };
      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCountdown('Camera blocked');
      setTimeout(() => setCountdown(null), 1400);
    }
  }

  function updateSession(updates) {
    const nextSession = { ...sessionRef.current, ...updates };
    sessionRef.current = nextSession;
    setBooth(nextSession);
  }

  function moveSlot(direction) {
    updateSession({ currentIndex: clamp(session.currentIndex + direction, 0, template.slots.length - 1) });
  }

  function selectSlot(index) {
    updateSession({ currentIndex: clamp(index, 0, template.slots.length - 1) });
  }

  function retakeCurrent() {
    const captures = [...session.captures];
    captures[session.currentIndex] = null;
    updateSession({ captures });
  }

  function resetAllCaptures() {
    updateSession({
      captures: template.slots.map(() => null),
      currentIndex: 0
    });
  }

  function captureWithCountdown() {
    if (isCountdownRunningRef.current) return;
    if (!videoRef.current?.srcObject) {
      startCamera();
      return;
    }
    clearAutoCaptureTimeout();
    clearCountdownInterval();

    if (timerDuration === 0) {
      captureFrame();
      return;
    }

    let value = timerDuration;
    isCountdownRunningRef.current = true;
    setCountdown(value);

    if (countdownAudioRef.current) {
      countdownAudioRef.current.currentTime = 0;
      countdownAudioRef.current.play().catch(err => console.error('Audio play failed', err));
    }

    countdownIntervalRef.current = setInterval(() => {
      value -= 1;
      if (value > 0) {
        setCountdown(value);
        if (countdownAudioRef.current) {
          countdownAudioRef.current.currentTime = 0;
          countdownAudioRef.current.play().catch(err => console.error('Audio play failed', err));
        }
        return;
      }
      clearCountdownInterval();
      setCountdown(null);
      captureFrame();
    }, 1000);
  }

  async function captureFrame() {
    if (shutterAudioRef.current) {
      shutterAudioRef.current.currentTime = 0;
      shutterAudioRef.current.play().catch(err => console.error('Shutter audio play failed', err));
    }
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    if (activeEffect.filter !== 'none') {
      ctx.filter = activeEffect.filter;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (activeEffect.overlay) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = activeEffect.blendMode || 'source-over';
      await new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.src = activeEffect.overlay;
      });
      ctx.globalCompositeOperation = 'source-over'; // Reset
    }
    
    const currentSession = sessionRef.current;
    const captures = [...currentSession.captures];
    captures[currentSession.currentIndex] = canvas.toDataURL('image/png');
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    updateSession({
      captures,
      currentIndex: currentSession.currentIndex < template.slots.length - 1 ? currentSession.currentIndex + 1 : currentSession.currentIndex
    });
  }

  useEffect(() => {
    if (isAutoCapturing && !countdown) {
      const currentSession = sessionRef.current;
      if (hasAllRequiredCaptures(currentSession, template)) {
        setIsAutoCapturing(false);
        clearAutoCaptureTimeout();
      } else if (!currentSession.captures[currentSession.currentIndex]) {
        clearAutoCaptureTimeout();
        autoCaptureTimeoutRef.current = setTimeout(() => {
          autoCaptureTimeoutRef.current = null;
          captureWithCountdown();
        }, 1200); // 1.2s delay before starting next countdown
      } else {
        clearAutoCaptureTimeout();
        const nextUncaptured = currentSession.captures.findIndex(c => !c);
        if (nextUncaptured !== -1) selectSlot(nextUncaptured);
      }
    } else {
      clearAutoCaptureTimeout();
    }
    return () => clearAutoCaptureTimeout();
  }, [isAutoCapturing, countdown, session.captures, session.currentIndex]);

  useEffect(() => {
    return () => {
      clearCountdownInterval();
      clearAutoCaptureTimeout();
    };
  }, []);

  async function finishSession() {
    const currentSession = sessionRef.current;
    if (!hasAllRequiredCaptures(currentSession, template)) return;
    const canvas = document.createElement('canvas');
    canvas.width = template.width;
    canvas.height = template.height;
    await drawTemplateToCanvas(template, canvas, currentSession.captures, -1);
    
    canvas.toBlob((blob) => {
      const sessionToStore = { ...currentSession };
      delete sessionToStore.captures; // Remove massive base64 arrays to save space
      storeFinalSession({ 
        ...sessionToStore, 
        image: URL.createObjectURL(blob), 
        templateName: template.name 
      });
      navigate(`/preview/${currentSession.id}`, { state: { returnTo } });
    }, 'image/png');
  }

  const actions = (
    <>
      {/* Empty actions since Exit moved to bottom controls */}
    </>
  );

  return (
    <AppShell title="iBooth" subtitle={template.name} actions={actions} hideAppearance={true}>
      <main className="booth-layout">
        <section className="booth-main">
          <div className="camera-pane">
            <aside className="effects-sidebar">
              <div className="effects-sidebar-title">Effects</div>
              <motion.div 
                className="effects-list"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {EFFECTS.map(eff => (
                  <EffectCell 
                    key={eff.name} 
                    effect={eff} 
                    stream={cameraStream} 
                    onSelect={(f) => setActiveEffect(f)} 
                  />
                ))}
              </motion.div>
            </aside>
            <motion.div 
              className="camera-preview-stage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ 
                  filter: activeEffect.filter !== 'none' ? activeEffect.filter : 'none', 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: isMirrored ? 'scaleX(-1)' : 'none'
                }} />
                {activeEffect.overlay && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${activeEffect.overlay})`,
                    backgroundSize: activeEffect.overlaySize || 'cover',
                    backgroundPosition: 'center',
                    mixBlendMode: activeEffect.blendMode || 'normal',
                    pointerEvents: 'none'
                  }} />
                )}
              </div>
              <AnimatePresence>
                {countdown && (
                  <motion.div 
                    className="countdown show"
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {countdown}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {flash && (
                  <motion.div 
                    className="flash show"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </AnimatePresence>
              {availableCameras.length > 0 && (
                <select className="camera-select" value={selectedCameraId} onChange={handleCameraChange}>
                  {availableCameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Camera ${availableCameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          </div>
          <motion.div 
            className="strip-pane booth-preview-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >

            <motion.div 
              ref={previewWrapRef} 
              className="booth-preview-canvas-wrap"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TemplateCanvas
                className="preview-canvas"
                template={template}
                captures={session.captures}
                activeIndex={session.currentIndex}
                onSlotClick={isAutoCapturing || countdown ? undefined : selectSlot}
                style={{ width: template.width * previewScale, height: template.height * previewScale }}
              />
            </motion.div>
            <div className="preview-pane-actions">
              <Button onClick={retakeCurrent} disabled={!session.captures[session.currentIndex]}>Retake</Button>
              <Button variant="danger" onClick={resetAllCaptures} disabled={!session.captures.some(Boolean)}>Reset All</Button>
            </div>
          </motion.div>
        </section>
        <motion.section 
          style={{ display: 'grid', gridTemplateColumns: 'minmax(620px, 1fr) 430px', gap: '18px', width: '100%' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Left Panel Controls */}
          <div className="booth-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button className="danger" style={{ width: '80px', padding: '0 12px' }} onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your current photos will be discarded.')) {
                navigate(returnTo);
              }
            }}>Exit</button>
            
            <div className="button-row" style={{ flex: 1, justifyContent: 'center', display: 'flex', gap: '8px' }}>
              {isAutoCapturing ? (
                <button
                  className="danger"
                  onClick={() => {
                    setIsAutoCapturing(false);
                    setCountdown(null);
                    clearCountdownInterval();
                    clearAutoCaptureTimeout();
                  }}
                >
                  Stop Auto Capture
                </button>
              ) : (
                <>
                  <button
                    className="secondary"
                    onClick={() => setIsMirrored(!isMirrored)}
                    style={{ marginRight: '8px' }}
                  >
                    {isMirrored ? 'Unmirror' : 'Mirror'}
                  </button>
                  <select 
                    style={{ width: 'auto', padding: '0 8px' }} 
                    value={timerDuration} 
                    onChange={(e) => setTimerDuration(Number(e.target.value))}
                  >
                    <option value={0}>Burst (0s)</option>
                    <option value={3}>3s Timer</option>
                    <option value={5}>5s Timer</option>
                    <option value={10}>10s Timer</option>
                  </select>
                  <button
                    className="primary"
                    onClick={captureWithCountdown}
                    disabled={!!countdown || !!session.captures[session.currentIndex]}
                  >
                    Capture
                  </button>
                  <button
                    className="primary"
                    onClick={() => setIsAutoCapturing(true)}
                    disabled={!!countdown || isComplete}
                  >
                    Start Auto Capture
                  </button>
                </>
              )}
            </div>
            
            <div style={{ width: '80px' }}></div> {/* Spacer to perfectly center the main buttons */}
          </div>

          {/* Right Panel Controls */}
          <div className="booth-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="warning" style={{ width: '100%' }} onClick={finishSession} disabled={!isComplete}>Finish</button>
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}
