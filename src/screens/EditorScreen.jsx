import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore, normalizeTemplate, uid } from '../core/useStore.js';
import { CANVAS_PRESETS, formatMm, getCanvasPreset } from '../core/constants.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { analyzeFrameSlots } from '../core/frameSlotAi.js';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { compressToTransparentWebp } from '../utils/compressor.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readImageSize(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function slug(value) {
  return String(value || 'photobooth-strip')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'photobooth-strip';
}

function formatInches(mm) {
  const value = mm / 25.4;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getCanvasSizeDisplay(template, preset, unit) {
  if (unit === 'mm') {
    return {
      width: formatMm(preset.mmWidth),
      height: formatMm(preset.mmHeight),
      label: 'mm'
    };
  }
  if (unit === 'in') {
    return {
      width: formatInches(preset.mmWidth),
      height: formatInches(preset.mmHeight),
      label: 'in'
    };
  }
  return {
    width: template.width,
    height: template.height,
    label: 'px'
  };
}

function findBestPresetForFrame(frameSize) {
  const frameRatio = frameSize.width / frameSize.height;
  return CANVAS_PRESETS
    .map((preset) => {
      const presetRatio = preset.width / preset.height;
      const ratioScore = Math.abs(frameRatio - presetRatio);
      const dimensionScore = Math.abs(frameSize.width - preset.width) / preset.width + Math.abs(frameSize.height - preset.height) / preset.height;
      return { preset, score: ratioScore + dimensionScore * 0.08 };
    })
    .sort((a, b) => a.score - b.score)[0].preset;
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

export default function EditorScreen({ navigate }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const scrollerRef = useRef(null);
  const stageRef = useRef(null);
  const importRef = useRef(null);
  const frameRef = useRef(null);
  const rulerHRef = useRef(null);
  const rulerVRef = useRef(null);
  const template = useStore((store) => store.template);
  const selectedSlotId = useStore((store) => store.selectedSlotId);
  const zoom = useStore((store) => store.zoom);
  const pan = useStore((store) => store.pan);
  const theme = useStore((store) => store.theme);
  const setTemplate = useStore((store) => store.setTemplate);
  const setSelectedSlotId = useStore((store) => store.setSelectedSlotId);
  const setZoom = useStore((store) => store.setZoom);
  const setPan = useStore((store) => store.setPan);
  const resetTemplate = useStore((store) => store.resetTemplate);
  const saveTemplateQuietly = useStore((store) => store.saveTemplateQuietly);
  const showToast = useStore((store) => store.showToast);
  const commitTemplate = useStore((store) => store.commitTemplate);
  const undo = useStore((store) => store.undo);
  const redo = useStore((store) => store.redo);
  const pastTemplates = useStore((store) => store.pastTemplates);
  const futureTemplates = useStore((store) => store.futureTemplates);
  const [viewport, setViewport] = useState({ width: 860, height: 844 });
  const [canvasUnit, setCanvasUnit] = useState('px');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(() => (
    template.id === 'default-template' ? 'unsaved' : 'saved'
  ));
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  useEffect(() => {
    const isExplicitAction = location.state?.isExplicitEdit;
    if (!isExplicitAction) {
      resetTemplate();
    }
  }, [location.state?.isExplicitEdit, resetTemplate]);

  const selectedSlot = useMemo(
    () => template.slots.find((slot) => slot.id === selectedSlotId) || null,
    [template.slots, selectedSlotId]
  );
  const selectedPreset = useMemo(() => getCanvasPreset(template.presetId), [template.presetId]);
  const canvasSize = useMemo(
    () => getCanvasSizeDisplay(template, selectedPreset, canvasUnit),
    [template, selectedPreset, canvasUnit]
  );

  const stageLeft = (viewport.width - template.width * zoom) / 2 + pan.x;
  const stageTop = (viewport.height - template.height * zoom) / 2 + pan.y;

  const currentDpi = template.dpi || selectedPreset.dpi || 300;

  let rulerStepPx = 100;
  let rulerLabelStep = 100;
  if (canvasUnit === 'mm') {
    rulerStepPx = (currentDpi / 25.4) * 10;
    rulerLabelStep = 10;
  } else if (canvasUnit === 'in') {
    rulerStepPx = currentDpi;
    rulerLabelStep = 1;
  }

  const numTicksX = Math.floor(template.width / rulerStepPx);
  const numTicksY = Math.floor(template.height / rulerStepPx);

  const ppi = template.dpi || selectedPreset.dpi;
  const bleedPixels = template.enableBleed ? Math.round((template.bleed || 2) / 25.4 * ppi) : 0;

  const previousSaveStatus = useRef(saveStatus);

  useEffect(() => {
    previousSaveStatus.current = saveStatus;
  }, [saveStatus]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const resize = () => setViewport({ width: node.clientWidth, height: node.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let touchStartDist = 0;
    let touchStartZoom = 1;
    let touchStartPan = { x: 0, y: 0 };
    let touchStartMidpoint = { x: 0, y: 0 };

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const rect = scroller.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const currentZoom = useStore.getState().zoom;
        const currentPan = useStore.getState().pan;
        
        const zoomFactor = e.deltaY > 0 ? 0.94 : 1.06;
        const nextZoom = clamp(currentZoom * zoomFactor, 0.18, 2.25);
        
        if (nextZoom !== currentZoom) {
          const nextPanX = currentPan.x + (mouseX - rect.width / 2 - currentPan.x) * (1 - nextZoom / currentZoom);
          const nextPanY = currentPan.y + (mouseY - rect.height / 2 - currentPan.y) * (1 - nextZoom / currentZoom);
          
          setZoom(nextZoom);
          setPan({ x: nextPanX, y: nextPanY });
        }
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
        touchStartZoom = useStore.getState().zoom;
        touchStartPan = useStore.getState().pan;
        
        const rect = scroller.getBoundingClientRect();
        touchStartMidpoint = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = dist / touchStartDist;
        const nextZoom = clamp(touchStartZoom * scale, 0.18, 2.25);
        
        const rect = scroller.getBoundingClientRect();
        const nextPanX = touchStartPan.x + (touchStartMidpoint.x - rect.width / 2 - touchStartPan.x) * (1 - nextZoom / touchStartZoom);
        const nextPanY = touchStartPan.y + (touchStartMidpoint.y - rect.height / 2 - touchStartPan.y) * (1 - nextZoom / touchStartZoom);
        
        setZoom(nextZoom);
        setPan({ x: nextPanX, y: nextPanY });
      }
    };

    scroller.addEventListener('wheel', handleWheel, { passive: false });
    scroller.addEventListener('touchstart', handleTouchStart, { passive: false });
    scroller.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      scroller.removeEventListener('wheel', handleWheel);
      scroller.removeEventListener('touchstart', handleTouchStart);
      scroller.removeEventListener('touchmove', handleTouchMove);
    };
  }, [undo, redo]);

  useEffect(() => {
    const canvasH = rulerHRef.current;
    const canvasV = rulerVRef.current;
    if (!canvasH || !canvasV) return;

    const ctxH = canvasH.getContext('2d');
    const ctxV = canvasV.getContext('2d');
    if (!ctxH || !ctxV) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(0, viewport.width);
    const h = Math.max(0, viewport.height);

    canvasH.width = w * dpr;
    canvasH.height = 24 * dpr;
    canvasH.style.width = `${w}px`;
    canvasH.style.height = `24px`;
    ctxH.scale(dpr, dpr);

    canvasV.width = 24 * dpr;
    canvasV.height = h * dpr;
    canvasV.style.width = `24px`;
    canvasV.style.height = `${h}px`;
    ctxV.scale(dpr, dpr);

    const isDark = theme === 'dark';
    const bgColor = isDark ? 'rgba(18, 22, 27, 0.96)' : 'rgba(251, 251, 247, 0.92)';
    const textColor = isDark ? '#9aa5b2' : '#64748b';
    const tickColor = isDark ? '#2b3440' : '#cbd5e1';

    // Draw Horizontal Ruler Background
    ctxH.fillStyle = bgColor;
    ctxH.fillRect(0, 0, w, 24);

    // Draw Vertical Ruler Background
    ctxV.fillStyle = bgColor;
    ctxV.fillRect(0, 0, 24, h);

    ctxH.strokeStyle = tickColor;
    ctxH.lineWidth = 1;
    ctxV.strokeStyle = tickColor;
    ctxV.lineWidth = 1;

    ctxH.fillStyle = textColor;
    ctxH.font = '9px Inter, sans-serif';
    ctxH.textAlign = 'left';
    ctxH.textBaseline = 'top';

    ctxV.fillStyle = textColor;
    ctxV.font = '9px Inter, sans-serif';
    ctxV.textAlign = 'left';
    ctxV.textBaseline = 'top';

    const stepSizePx = rulerStepPx * zoom;
    
    // Draw Horizontal Ticks
    const startIdx = Math.floor(-stageLeft / stepSizePx);
    const endIdx = Math.ceil((w - stageLeft) / stepSizePx);

    for (let i = startIdx; i <= endIdx; i++) {
      const x = stageLeft + i * stepSizePx;
      if (x < 0 || x > w) continue;

      // Major tick
      ctxH.beginPath();
      ctxH.moveTo(x, 12);
      ctxH.lineTo(x, 24);
      ctxH.stroke();

      const label = String(i * rulerLabelStep);
      ctxH.fillText(label, x + 3, 2);

      // Sub-ticks
      for (let j = 1; j < 10; j++) {
        const subX = x + j * (stepSizePx / 10);
        if (subX >= 0 && subX <= w) {
          ctxH.beginPath();
          ctxH.moveTo(subX, j === 5 ? 16 : 20);
          ctxH.lineTo(subX, 24);
          ctxH.stroke();
        }
      }
    }

    // Draw Vertical Ticks
    const startIdxY = Math.floor(-stageTop / stepSizePx);
    const endIdxY = Math.ceil((h - stageTop) / stepSizePx);

    for (let i = startIdxY; i <= endIdxY; i++) {
      const y = stageTop + i * stepSizePx;
      if (y < 0 || y > h) continue;

      // Major tick
      ctxV.beginPath();
      ctxV.moveTo(12, y);
      ctxV.lineTo(24, y);
      ctxV.stroke();

      const label = String(i * rulerLabelStep);
      ctxV.save();
      ctxV.translate(3, y + 3);
      ctxV.rotate(-Math.PI / 2);
      ctxV.fillText(label, 0, 0);
      ctxV.restore();

      // Sub-ticks
      for (let j = 1; j < 10; j++) {
        const subY = y + j * (stepSizePx / 10);
        if (subY >= 0 && subY <= h) {
          ctxV.beginPath();
          ctxV.moveTo(j === 5 ? 16 : 20, subY);
          ctxV.lineTo(24, subY);
          ctxV.stroke();
        }
      }
    }
  }, [viewport, stageLeft, stageTop, zoom, rulerStepPx, rulerLabelStep, theme]);



  function applyAiResult(nextTemplate, result) {
    updateTemplate({ ...nextTemplate, slots: result.slots });
    setSelectedSlotId(result.slots[0]?.id || null);

    // We format the toast message to include the full detail previously shown in the inline banner
    const detail = result.mode !== 'analyzing' ? `\n${result.slots.length} slots` : '';
    showToast(`${result.message}${detail}`, result.mode === 'fallback' ? 'warning' : 'success');
  }

  function updateTemplate(nextTemplate) {
    commitTemplate();
    setSaveStatus('unsaved');
    setTemplate(nextTemplate);
    setTimeout(saveTemplateQuietly, 0);
  }

  function updateSlot(slotId, updates) {
    const slots = template.slots.map((slot) => {
      if (slot.id !== slotId) return slot;
      const next = { ...slot, ...updates };
      next.width = clamp(Number(next.width) || 60, 60, template.width - next.x);
      next.height = clamp(Number(next.height) || 60, 60, template.height - next.y);
      next.x = clamp(Number(next.x) || 0, 0, template.width - next.width);
      next.y = clamp(Number(next.y) || 0, 0, template.height - next.height);
      next.rotation = Number(next.rotation) || 0;
      next.radius = clamp(Number(next.radius) || 0, 0, 160);
      return next;
    });
    updateTemplate({ ...template, slots });
  }

  function fitStage() {
    const widthFit = (viewport.width - 72) / template.width;
    const heightFit = (viewport.height - 72) / template.height;
    setPan({ x: 0, y: 0 });
    setZoom(clamp(Math.min(widthFit, heightFit), 0.18, 1));
  }

  function changeCanvasPreset(presetId) {
    const preset = getCanvasPreset(presetId);
    const targetDpi = template.dpi || preset.dpi || 300;
    const newWidth = Math.round((preset.mmWidth / 25.4) * targetDpi);
    const newHeight = Math.round((preset.mmHeight / 25.4) * targetDpi);

    const previousWidth = template.width || preset.width;
    const previousHeight = template.height || preset.height;
    const scaleX = newWidth / previousWidth;
    const scaleY = newHeight / previousHeight;
    const slots = template.slots.map((slot) => {
      const next = {
        ...slot,
        x: Math.round(slot.x * scaleX),
        y: Math.round(slot.y * scaleY),
        width: Math.round(slot.width * scaleX),
        height: Math.round(slot.height * scaleY)
      };
      next.width = clamp(next.width, 60, newWidth);
      next.height = clamp(next.height, 60, newHeight);
      next.x = clamp(next.x, 0, newWidth - next.width);
      next.y = clamp(next.y, 0, newHeight - next.height);
      return next;
    });

    updateTemplate({
      ...template,
      presetId: preset.id,
      dpi: targetDpi,
      width: newWidth,
      height: newHeight,
      slots
    });
    setPan({ x: 0, y: 0 });
  }

  function changeCanvasDpi(newDpiStr) {
    const newDpi = parseInt(newDpiStr, 10);
    const mmWidth = selectedPreset.mmWidth;
    const mmHeight = selectedPreset.mmHeight;
    const newWidth = Math.round((mmWidth / 25.4) * newDpi);
    const newHeight = Math.round((mmHeight / 25.4) * newDpi);

    const previousWidth = template.width;
    const previousHeight = template.height;
    const scaleX = newWidth / previousWidth;
    const scaleY = newHeight / previousHeight;
    const slots = template.slots.map((slot) => {
      const next = {
        ...slot,
        x: Math.round(slot.x * scaleX),
        y: Math.round(slot.y * scaleY),
        width: Math.round(slot.width * scaleX),
        height: Math.round(slot.height * scaleY)
      };
      next.width = clamp(next.width, 60, newWidth);
      next.height = clamp(next.height, 60, newHeight);
      next.x = clamp(next.x, 0, newWidth - next.width);
      next.y = clamp(next.y, 0, newHeight - next.height);
      return next;
    });

    updateTemplate({
      ...template,
      dpi: newDpi,
      width: newWidth,
      height: newHeight,
      slots
    });
    setPan({ x: 0, y: 0 });
  }

  async function uploadFrame(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') {
      showToast('Please upload a PNG frame file.', 'error');
      event.target.value = '';
      return;
    }
    
    showToast('Compressing image...', 'info');
    const compressedBlob = await compressToTransparentWebp(file, 2);
    const frameImage = await readFileAsDataUrl(compressedBlob);
    
    const frameSize = await readImageSize(frameImage);
    const preset = findBestPresetForFrame(frameSize);
    const nextTemplate = {
      ...template,
      frameImage,
      presetId: preset.id,
      width: preset.width,
      height: preset.height
    };
    setPan({ x: 0, y: 0 });
    showToast(`Canvas preset set to ${preset.name}.\nAnalyzing the frame...`, 'info');
    const result = await analyzeFrameSlots(frameImage, nextTemplate);
    applyAiResult(nextTemplate, result);
    event.target.value = '';
  }

  async function matchSlots() {
    showToast('Analyzing frame slots...', 'info');
    const result = await analyzeFrameSlots(template.frameImage, template);
    applyAiResult(template, result);
  }

  async function autoFillMetadata() {
    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    if (!apiKey) {
      showToast('Error: VITE_GEMINI_KEY is missing in .env', 'error');
      return;
    }

    setIsGeneratingMetadata(true);
    showToast('AI is generating metadata...', 'info');

    try {
      const prompt = `Analyze this photobooth template layout/image and generate highly specific metadata for it.
Template Name: "${template.name}"
Size: ${template.width}x${template.height}
Slots: ${template.slots?.length || 0}
Format: ${template.details?.format || 'Unknown'}

Instructions:
1. Pay close attention to the "Template Name". If it contains specific acronyms, event names (like KKN, prom, graduation), or themes, heavily base your description and tags around that context.
2. If an image is provided, read any text on the frame and analyze the specific graphics/branding to infer the exact event type.
3. Be hyper-specific. Do not generate generic responses like "Capture unforgettable moments." Tailor the description strictly to what this template is clearly designed for.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are an expert copywriter for a photobooth app. Your job is to generate highly engaging, concise, and hyper-specific metadata based on the provided template attributes and its image. You excel at inferring the exact context (e.g. community service, university events, specific parties) from brief titles and visual clues, avoiding generic filler." }]
          },
          contents: [{
            parts: [
              { text: prompt },
              ...(template.frameImage && template.frameImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/) ? [{
                inlineData: {
                  mimeType: template.frameImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)[1],
                  data: template.frameImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)[2]
                }
              }] : [])
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                description: {
                  type: "STRING",
                  description: "A short, engaging 1-2 sentence description highlighting the template's vibe."
                },
                tags: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "4 to 6 relevant lowercase tags (no hashtags, e.g. 'vintage', 'minimal')."
                },
                theme: {
                  type: "STRING",
                  enum: ["General", "Wedding", "Birthday", "Graduation", "Anniversary", "Party & Festival", "Corporate", "Baby & Bridal Shower", "Retro & Vintage", "Seasonal & Holiday", "Movie", "Other"]
                },
                colorStyle: {
                  type: "STRING",
                  enum: ["Light", "Dark", "Monochrome", "Colorful"]
                }
              },
              required: ["description", "tags", "theme", "colorStyle"]
            }
          }
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        const metadata = JSON.parse(text);
        updateTemplate({
          ...template,
          description: metadata.description || template.description,
          tags: metadata.tags || template.tags,
          theme: metadata.theme || template.theme,
          colorStyle: metadata.colorStyle || template.colorStyle
        });
        showToast('Metadata successfully generated!', 'success');
      } else {
        throw new Error('No content generated');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: AI quota exceeded or unavailable.', 'error');
    } finally {
      setIsGeneratingMetadata(false);
    }
  }

  async function importTemplate(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = normalizeTemplate(JSON.parse(text));
      setSaveStatus('unsaved');
      setTemplate(imported);
      setSelectedSlotId(imported.slots[0]?.id || null);
      setTimeout(saveTemplateQuietly, 0);
      showToast('Successfully imported template layout.', 'success');
    } catch {
      showToast('Template import failed', 'error');
    }
    event.target.value = '';
  }

  function addSlot() {
    const slot = {
      id: uid(),
      name: `Slot ${template.slots.length + 1}`,
      x: 86,
      y: 100,
      width: 430,
      height: 320,
      rotation: 0,
      radius: 16,
      fit: 'cover',
      mirror: true
    };
    updateTemplate({ ...template, slots: [...template.slots, slot] });
    setSelectedSlotId(slot.id);
  }

  function deleteSlot(slotId) {
    const slots = template.slots.filter((slot) => slot.id !== slotId);
    updateTemplate({ ...template, slots });
    if (selectedSlotId === slotId) setSelectedSlotId(slots[0]?.id || null);
  }

  function duplicateSlot() {
    if (!selectedSlot) return;
    const copy = {
      ...selectedSlot,
      id: uid(),
      name: `${selectedSlot.name} Copy`,
      x: clamp(selectedSlot.x + 24, 0, template.width - selectedSlot.width),
      y: clamp(selectedSlot.y + 24, 0, template.height - selectedSlot.height)
    };
    updateTemplate({ ...template, slots: [...template.slots, copy] });
    setSelectedSlotId(copy.id);
  }

  function moveLayer(direction) {
    const index = template.slots.findIndex((slot) => slot.id === selectedSlotId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= template.slots.length) return;
    const slots = [...template.slots];
    const [slot] = slots.splice(index, 1);
    slots.splice(nextIndex, 0, slot);
    updateTemplate({ ...template, slots });
  }

  function pointerToCanvas(event) {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom
    };
  }

  function startSlotPointer(event, slot) {
    event.stopPropagation();
    if (selectedSlotId !== slot.id) {
      setSelectedSlotId(slot.id);
      return;
    }
    const handle = event.target.dataset.handle;
    const start = pointerToCanvas(event);
    const initial = { ...slot };
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);

    const move = (moveEvent) => {
      const point = pointerToCanvas(moveEvent);
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      const updates = {};
      if (!handle) {
        updates.x = initial.x + dx;
        updates.y = initial.y + dy;
      } else {
        if (handle.includes('e')) updates.width = initial.width + dx;
        if (handle.includes('s')) updates.height = initial.height + dy;
        if (handle.includes('w')) {
          const nextX = clamp(initial.x + dx, 0, initial.x + initial.width - 60);
          updates.x = nextX;
          updates.width = initial.width + initial.x - nextX;
        }
        if (handle.includes('n')) {
          const nextY = clamp(initial.y + dy, 0, initial.y + initial.height - 60);
          updates.y = nextY;
          updates.height = initial.height + initial.y - nextY;
        }
      }
      updateSlot(slot.id, updates);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function startPan(event) {
    if (event.target.closest('.slot-box')) return;
    const start = { x: event.clientX, y: event.clientY, pan };
    const move = (moveEvent) => {
      setPan({
        x: start.pan.x + moveEvent.clientX - start.x,
        y: start.pan.y + moveEvent.clientY - start.y
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  async function saveTemplateToBackend(quietArg = false) {
    const quiet = quietArg === true;
    if (!quiet) {
      setSaveStatus('saving');
      showToast('Saving template...', 'info');
    }
    try {
      const saveMethod = useStore.getState().saveTemplate;
      // We pass null for frameFile because template.frameImage is already a compressed WebP Data URL
      const { success, error } = await saveMethod(template, user.id, null);

      if (!success) {
        throw new Error(error || 'Failed to save to cloud');
      }

      saveTemplateQuietly();
      if (!quiet) {
        setSaveStatus('saved');
        showToast('Template successfully saved!', 'success');
        setShowSaveSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      if (!quiet) {
        setSaveStatus('unsaved');
        showToast('Failed to save template.', 'error');
      }
    }
  }

  const menu = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <div className="menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setMenuOpen(!menuOpen)}>File</button>
        {menuOpen && (
          <div className="menu-dropdown-content" onClick={() => setMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => {
              resetTemplate();
              showToast('Started new template', 'success');
            }}>New Template</button>
            <div className="menu-divider" />
            <button className="menu-dropdown-item" onClick={saveTemplateToBackend} style={{ color: '#10b981', fontWeight: 'bold' }}>Save Template</button>
            <button className="menu-dropdown-item" onClick={() => importRef.current?.click()}>Import from JSON...</button>
            <button className="menu-dropdown-item" onClick={() => downloadJson(template, `${slug(template.name)}.json`)}>Export to JSON...</button>
            <div className="menu-divider" />
            <button className="menu-dropdown-item" onClick={() => frameRef.current?.click()}>Upload Frame...</button>
          </div>
        )}
      </div>
      <div className="menu-dropdown" onMouseLeave={() => setEditMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setEditMenuOpen(!editMenuOpen)}>Edit</button>
        {editMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setEditMenuOpen(false)}>
            <button className="menu-dropdown-item" disabled={pastTemplates.length === 0} onClick={undo}>
              Undo <span style={{ opacity: 0.5, float: 'right' }}>⌘Z</span>
            </button>
            <button className="menu-dropdown-item" disabled={futureTemplates.length === 0} onClick={redo}>
              Redo <span style={{ opacity: 0.5, float: 'right' }}>⇧⌘Z</span>
            </button>
          </div>
        )}
      </div>
      {/* <div className="menu-dropdown" onMouseLeave={() => setHelpMenuOpen(false)}>
        <button className="menu-dropdown-button" onPointerDown={() => setHelpMenuOpen(!helpMenuOpen)}>Help</button>
        {helpMenuOpen && (
          <div className="menu-dropdown-content" onClick={() => setHelpMenuOpen(false)}>
            <button className="menu-dropdown-item" onClick={() => setShowAboutModal(true)}>
              About Photobooth
            </button>
          </div>
        )}
      </div> */}
    </div>
  );

  const actions = (
    <>
      {/* <span className={`save-status ${saveStatus}`} >
        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'All changes saved'}
      </span> */}
      <Button variant="primary" onClick={saveTemplateToBackend} disabled={saveStatus === 'saving'}>
        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
      </Button>
      <Button variant="warning" onClick={() => navigate(`/booth/${template.id}`, { state: { returnTo } })}>Start</Button>
      <input ref={importRef} className="hidden-file" type="file" accept="application/json" onChange={importTemplate} />
    </>
  );



  return (
    <AppShell
      title="Editor"
      menu={menu}
      actions={actions}
      showBackButton
      onBack={() => navigate(returnTo)}
      statusLabel={
        saveStatus === 'saving'
          ? 'Saving to cloud'
          : saveStatus === 'saved'
            ? 'Saved to cloud'
            : 'Not saved to cloud'
      }
      statusBar={<div>Photobooth {template.width}x{template.height}{canvasUnit}</div>}
      statusBarRight={<div>Part of <a href="https://arwndoprtma.space" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>arwndoprtma.space</a></div>}
    >
      <main className="editor-layout">
        <aside className="panel">
          <CollapsibleSection title="Template" note="Frame and layout">
            <label>Name<input value={template.name || ''} onChange={(event) => updateTemplate({ ...template, name: event.target.value })} /></label>
            <label>Description
              <textarea
                value={template.description || ''}
                onChange={(event) => updateTemplate({ ...template, description: event.target.value })}
                rows={2}
                style={{ width: '100%', resize: 'vertical', marginTop: '4px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}
              />
            </label>
            <label>Tags (comma separated)
              <input
                value={template.tags?.join(', ') || ''}
                onChange={(event) => updateTemplate({ ...template, tags: event.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="vintage, minimal, etc."
              />
            </label>
            <div className="form-grid">
              <label>Theme
                <select value={template.theme || 'General'} onChange={(event) => updateTemplate({ ...template, theme: event.target.value })}>
                  <option value="General">General</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Graduation">Graduation</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Party & Festival">Party & Festival</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Baby & Bridal Shower">Baby & Bridal Shower</option>
                  <option value="Retro & Vintage">Retro & Vintage</option>
                  <option value="Seasonal & Holiday">Seasonal & Holiday</option>
                  <option value="Movie">Movie</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>Color Style
                <select value={template.colorStyle || 'Light'} onChange={(event) => updateTemplate({ ...template, colorStyle: event.target.value })}>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="Monochrome">Monochrome</option>
                  <option value="Colorful">Colorful</option>
                </select>
              </label>
            </div>
            <div className="frame-actions" style={{ marginTop: '12px' }}>
              <Button variant="primary" className="frame-upload-button" onClick={() => frameRef.current?.click()}>
                <span>Upload Frame</span>
                <small>PNG artwork only</small>
              </Button>
              <Button variant="ai" onClick={matchSlots}>
                <span>Auto-Match Slots</span>
              </Button>
              <Button variant="ai" onClick={autoFillMetadata} disabled={isGeneratingMetadata}>
                <span>{isGeneratingMetadata ? 'Generating...' : 'Auto-fill Metadata'}</span>
              </Button>
              <Button variant="ghost" className="frame-clear-button" onClick={() => updateTemplate({ ...template, frameImage: '' })}>Clear Frame</Button>
            </div>
            <input ref={frameRef} className="hidden-file" type="file" accept="image/png,.png" onChange={uploadFrame} />
          </CollapsibleSection>
          <CollapsibleSection title="Output" note={`${template.dpi || selectedPreset.dpi} PPI print file`}>
            <label>Preset
              <select value={selectedPreset.id} onChange={(event) => changeCanvasPreset(event.target.value)}>
                {CANVAS_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
            </label>
            <label>Print Quality (PPI)
              <select value={template.dpi || selectedPreset.dpi} onChange={(event) => changeCanvasDpi(event.target.value)}>
                <option value="150">150 PPI (Draft)</option>
                <option value="300">300 PPI (High Quality)</option>
                <option value="600">600 PPI (Maximum)</option>
              </select>
            </label>
            <label>Unit
              <select value={canvasUnit} onChange={(event) => setCanvasUnit(event.target.value)}>
                <option value="px">Pixels</option>
                <option value="mm">Millimeters</option>
                <option value="in">Inches</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px', marginBottom: '8px' }}>
              <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={template.enableBleed || false} onChange={(e) => updateTemplate({ ...template, enableBleed: e.target.checked })} />
              <span style={{ fontWeight: 'normal' }}>Enable Bleed</span>
            </label>
            {template.enableBleed && (
              <div className="form-grid">
                <label>Bleed amount (mm)
                  <input type="number" min="0" step="1" value={template.bleed || 2} onChange={(event) => updateTemplate({ ...template, bleed: Number(event.target.value) })} />
                </label>
                <label>Bleed Color
                  <input type="color" value={template.bleedColor || '#ffffff'} onChange={(event) => updateTemplate({ ...template, bleedColor: event.target.value })} />
                </label>
              </div>
            )}
            <div className="form-grid">
              <label>Width ({canvasSize.label})<input value={canvasSize.width} disabled /></label>
              <label>Height ({canvasSize.label})<input value={canvasSize.height} disabled /></label>
            </div>
            <div className="output-card">
              <div><span>Pixels</span><strong>{template.width} x {template.height}</strong></div>
              <div><span>Print</span><strong>{formatMm(selectedPreset.mmWidth)} x {formatMm(selectedPreset.mmHeight)} mm</strong></div>
              <div><span>Inches</span><strong>{formatInches(selectedPreset.mmWidth)} x {formatInches(selectedPreset.mmHeight)} in</strong></div>
            </div>
          </CollapsibleSection>
        </aside>

        <motion.section
          className="workspace"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="ruler-corner" />
          <canvas ref={rulerHRef} className="ruler-x" />
          <canvas ref={rulerVRef} className="ruler-y" />

          <motion.div
            ref={scrollerRef}
            className="canvas-scroller"
            onPointerDown={startPan}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div
              ref={stageRef}
              className="template-stage"
              style={{
                width: template.width,
                height: template.height,
                left: stageLeft,
                top: stageTop,
                transform: `scale(${zoom})`,
                outline: bleedPixels > 0 ? `${bleedPixels}px solid ${template.bleedColor || '#ffffff'}` : 'none'
              }}
            >
              <div className="frame-layer" style={template.frameImage ? { backgroundImage: `url(${template.frameImage})` } : undefined} />
              <div className="slot-layer">
                {template.slots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className={`slot-box ${slot.id === selectedSlotId ? 'selected' : ''}`}
                    onPointerDown={(event) => startSlotPointer(event, slot)}
                    style={{
                      left: slot.x,
                      top: slot.y,
                      width: slot.width,
                      height: slot.height,
                      borderRadius: slot.radius,
                      transform: `rotate(${slot.rotation}deg)`
                    }}
                  >
                    <span className="slot-label">{index + 1}</span>
                    {slot.id === selectedSlotId && (
                      <>
                        <span className="handle nw" data-handle="nw" />
                        <span className="handle ne" data-handle="ne" />
                        <span className="handle sw" data-handle="sw" />
                        <span className="handle se" data-handle="se" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <div className="zoom-hud">
            <Button variant="icon" title="Zoom out" onClick={() => setZoom(clamp(zoom / 1.15, 0.18, 2.25))}>-</Button>
            <Button title="Fit to screen" onClick={fitStage}>Fit</Button>
            <Button title="100%" onClick={() => setZoom(1)}>100%</Button>
            <Button variant="icon" title="Zoom in" onClick={() => setZoom(clamp(zoom * 1.15, 0.18, 2.25))}>+</Button>
            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          </div>
        </motion.section>

        <aside className="panel right">
          <CollapsibleSection title="Slots" note={template.slots.length} noteClassName="slot-count" headingClassName="section-heading inline">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="primary" onClick={addSlot}>Add Slot</Button>
            </div>
            <div className="slot-list">
              {template.slots.map((slot, index) => (
                <div key={slot.id} className={`slot-item ${slot.id === selectedSlotId ? 'active' : ''}`} onClick={() => setSelectedSlotId(slot.id)}>
                  <div className="slot-meta">
                    <span className="slot-name">{index + 1}. {slot.name}</span>
                    <span className="slot-size">{Math.round(slot.x)}, {Math.round(slot.y)} · {Math.round(slot.width)} x {Math.round(slot.height)}</span>
                  </div>
                  <Button variant="icon" title="Delete slot" onClick={(event) => { event.stopPropagation(); deleteSlot(slot.id); }}>×</Button>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Inspector" note={selectedSlot ? selectedSlot.name : 'No slot selected'}>
            {!selectedSlot ? (
              <div className="empty-state">Select a slot on the canvas or from the list.</div>
            ) : (
              <>
                <div className="inspector-summary">
                  <strong>{selectedSlot.name}</strong>
                  <span>{Math.round(selectedSlot.width)} x {Math.round(selectedSlot.height)} px at {Math.round(selectedSlot.x)}, {Math.round(selectedSlot.y)}</span>
                </div>
                <label>Name<input value={selectedSlot.name} onChange={(event) => updateSlot(selectedSlot.id, { name: event.target.value })} /></label>
                <div className="form-grid">
                  {['x', 'y', 'width', 'height', 'rotation', 'radius'].map((field) => (
                    <label key={field}>{field[0].toUpperCase() + field.slice(1)}
                      <input type="number" value={Math.round(selectedSlot[field])} onChange={(event) => updateSlot(selectedSlot.id, { [field]: Number(event.target.value) })} />
                    </label>
                  ))}
                </div>
                <div className="form-grid">
                  <label>Fit
                    <select value={selectedSlot.fit} onChange={(event) => updateSlot(selectedSlot.id, { fit: event.target.value })}>
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </label>
                  <label>Mirror
                    <select value={String(selectedSlot.mirror)} onChange={(event) => updateSlot(selectedSlot.id, { mirror: event.target.value === 'true' })}>
                      <option value="false">Off</option>
                      <option value="true">On</option>
                    </select>
                  </label>
                </div>
                <div className="button-grid">
                  <Button onClick={duplicateSlot}>Duplicate</Button>
                  <Button onClick={() => moveLayer(1)}>Bring Forward</Button>
                  <Button onClick={() => moveLayer(-1)}>Send Backward</Button>
                  <Button variant="danger" onClick={() => deleteSlot(selectedSlot.id)}>Delete</Button>
                </div>
              </>
            )}
          </CollapsibleSection>
        </aside>
      </main>


      {showSaveSuccessModal && (
        <div
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
          <div style={{
            background: 'var(--panel)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90vw',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Template Saved</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--muted)' }}>
              Your template has been successfully saved. What would you like to do next?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowSaveSuccessModal(false)}>
                Continue Editing
              </Button>
              <Button variant="primary" onClick={() => navigate('/catalog')}>
                Go to Catalog
              </Button>
            </div>
          </div>
        </div>
      )}

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
          <img
            onClick={(e) => e.stopPropagation()}
            src={aboutImage}
            alt="About iBooth"
            style={{ width: '800px', maxWidth: '90vw', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}
    </AppShell>
  );
}
