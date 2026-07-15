import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore, loadFinalSession } from '../core/useStore.js';
import { formatMm, getTemplatePreset } from '../core/constants.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import TemplateCanvas from '../components/TemplateCanvas.jsx';
import Dialog from '../components/Dialog.jsx';
import { motion } from 'framer-motion';

function slug(value) {
  return String(value || 'photobooth-strip')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'photobooth-strip';
}

export default function PreviewScreen({ navigate }) {
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const paneRef = useRef(null);
  const canvasRef = useRef(null);
  const template = useStore((store) => store.template);
  const setBooth = useStore((store) => store.setBooth);
  const previewZoom = useStore((store) => store.previewZoom);
  const setPreviewZoom = useStore((store) => store.setPreviewZoom);
  const [fitZoom, setFitZoom] = useState(previewZoom);
  const session = loadFinalSession();
  const preset = getTemplatePreset(template);
  const output = useMemo(() => ({
    width: session.width || template.width,
    height: session.height || template.height,
    mmWidth: session.mmWidth || preset.mmWidth,
    mmHeight: session.mmHeight || preset.mmHeight,
    dpi: session.dpi || preset.dpi,
    bleed: session.bleed || template.bleed || 2,
    bleedColor: session.bleedColor || template.bleedColor || '#ffffff',
    enableBleed: session.enableBleed ?? template.enableBleed ?? false
  }), [session.width, session.height, session.mmWidth, session.mmHeight, session.dpi, session.bleed, session.bleedColor, session.enableBleed, template.width, template.height, template.bleed, template.bleedColor, template.enableBleed, preset]);

  const [filename, setFilename] = useState(slug(session.templateName || template.name));
  const [format, setFormat] = useState('png');
  const [ppi, setPpi] = useState(output.dpi);
  const [colorMode, setColorMode] = useState('rgb');
  const [includeBleed, setIncludeBleed] = useState(output.enableBleed);
  const [previewBleed, setPreviewBleed] = useState(output.bleed);
  const [previewBleedColor, setPreviewBleedColor] = useState(output.bleedColor);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  useEffect(() => {
    const node = paneRef.current;
    if (!node) return;
    const resize = () => {
      const availableWidth = Math.max(160, node.clientWidth - 72);
      const availableHeight = Math.max(160, node.clientHeight - 72);
      const nextFitZoom = Math.min(availableWidth / output.width, availableHeight / output.height, 1);
      setFitZoom(nextFitZoom);
      setPreviewZoom(nextFitZoom);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [output.width, output.height, setPreviewZoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !session.image) return;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const bPixels = includeBleed ? Math.round((previewBleed || 0) / 25.4 * ppi) : 0;
      const innerWidth = canvas.width - 2 * bPixels;
      const innerHeight = canvas.height - 2 * bPixels;
      
      if (format === 'jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(bPixels, bPixels, innerWidth, innerHeight);
      }
      
      if (includeBleed && bPixels > 0) {
        context.fillStyle = previewBleedColor || '#ffffff';
        context.fillRect(0, 0, canvas.width, bPixels); // Top
        context.fillRect(0, canvas.height - bPixels, canvas.width, bPixels); // Bottom
        context.fillRect(0, bPixels, bPixels, canvas.height - 2 * bPixels); // Left
        context.fillRect(canvas.width - bPixels, bPixels, bPixels, canvas.height - 2 * bPixels); // Right
      }
      
      context.drawImage(image, bPixels, bPixels, innerWidth, innerHeight);
    };
    image.src = session.image;
  }, [session.image, includeBleed, previewBleed, previewBleedColor, output.dpi, format, ppi]);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.005;
        const zoomChange = e.deltaY * -zoomSensitivity;
        setPreviewZoom((prev) => Math.min(Math.max(0.18, prev + zoomChange), 1.6));
      }
    };

    pane.addEventListener('wheel', handleWheel, { passive: false });
    return () => pane.removeEventListener('wheel', handleWheel);
  }, [setPreviewZoom]);

  const scale = ppi / output.dpi;
  const imageWidth = Math.round(output.width * scale);
  const imageHeight = Math.round(output.height * scale);
  const bleedPixels = includeBleed ? Math.round(previewBleed / 25.4 * ppi) : 0;
  const exportWidth = imageWidth + 2 * bleedPixels;
  const exportHeight = imageHeight + 2 * bleedPixels;

  function downloadFinal() {
    if (!session.image) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = exportWidth;
    offscreen.height = exportHeight;
    const ctx = offscreen.getContext('2d');

    ctx.clearRect(0, 0, exportWidth, exportHeight);
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bleedPixels, bleedPixels, imageWidth, imageHeight);
    }
    
    if (includeBleed && bleedPixels > 0) {
      ctx.fillStyle = previewBleedColor || '#ffffff';
      ctx.fillRect(0, 0, exportWidth, bleedPixels);
      ctx.fillRect(0, exportHeight - bleedPixels, exportWidth, bleedPixels);
      ctx.fillRect(0, bleedPixels, bleedPixels, exportHeight - 2 * bleedPixels);
      ctx.fillRect(exportWidth - bleedPixels, bleedPixels, bleedPixels, exportHeight - 2 * bleedPixels);
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, bleedPixels, bleedPixels, imageWidth, imageHeight);
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      offscreen.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename || 'photobooth'}.${format}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, mimeType, 1.0);
    };
    img.src = session.image;
  }

  function printFinal() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalMmWidth = output.mmWidth + (includeBleed ? previewBleed * 2 : 0);
    const finalMmHeight = output.mmHeight + (includeBleed ? previewBleed * 2 : 0);
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Print Photobooth Strip</title>
          <style>
            @page { size: ${finalMmWidth}mm ${finalMmHeight}mm; margin: 0; }
            body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: ${includeBleed ? previewBleedColor : 'white'}; }
            img { width: ${finalMmWidth}mm; height: ${finalMmHeight}mm; object-fit: contain; }
          </style>
        </head>
        <body><img src="${canvas.toDataURL('image/png')}" /></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  const actions = (
    <>
      <Button variant="warning" onClick={() => setShowNewSessionDialog(true)}>New Session</Button>
    </>
  );

  return (
    <AppShell title="Preview" actions={actions}>
      <main className="preview-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(620px, 1fr) 340px', gap: '24px', flex: 1, overflow: 'hidden' }}>
          <motion.section
            ref={paneRef}
            className="final-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {session.image ? (
              <canvas
                ref={canvasRef}
                className="preview-canvas"
                width={exportWidth}
                height={exportHeight}
                style={{
                  width: exportWidth * previewZoom,
                  height: exportHeight * previewZoom,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <TemplateCanvas className="preview-canvas" template={template} style={{ width: output.width * previewZoom, height: output.height * previewZoom }} />
            )}
          </motion.div>
          <div className="zoom-hud">
            <Button variant="icon" title="Zoom out" onClick={() => setPreviewZoom(Math.max(0.18, previewZoom / 1.15))}>-</Button>
            <Button title="Fit to screen" onClick={() => setPreviewZoom(fitZoom)}>Fit</Button>
            <Button title="100%" onClick={() => setPreviewZoom(1)}>100%</Button>
            <Button variant="icon" title="Zoom in" onClick={() => setPreviewZoom(Math.min(1.6, previewZoom * 1.15))}>+</Button>
            <span className="zoom-value">{Math.round(previewZoom * 100)}%</span>
          </div>
        </motion.section>
        <aside className="export-pane">
          <h2 className="panel-title">Export Settings</h2>
          <label>File name<input value={filename} onChange={e => setFilename(e.target.value)} /></label>
          <label>Format
            <select value={format} onChange={e => setFormat(e.target.value)}>
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </label>
          <label>PPI
            <select value={ppi} onChange={e => setPpi(Number(e.target.value))}>
              <option value="150">150</option>
              <option value="300">300</option>
              <option value="600">600</option>
            </select>
          </label>
          <label>Color Mode
            <select value={colorMode} onChange={e => setColorMode(e.target.value)}>
              <option value="rgb">RGB (Digital)</option>
              <option value="cmyk">CMYK (Print)</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px', marginBottom: '8px' }}>
            <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={includeBleed} onChange={e => setIncludeBleed(e.target.checked)} />
            <span style={{ fontWeight: 'normal' }}>Include Bleed</span>
          </label>
          
          {includeBleed && (
            <div className="form-grid" style={{ marginBottom: '16px' }}>
              <label>Bleed amount (mm)
                <input type="number" min="0" step="1" value={previewBleed || 2} onChange={(event) => setPreviewBleed(Number(event.target.value))} />
              </label>
              <label>Bleed Color
                <input type="color" value={previewBleedColor || '#ffffff'} onChange={(event) => setPreviewBleedColor(event.target.value)} />
              </label>
            </div>
          )}

          <div className="info-grid" style={{ marginTop: '16px' }}>
            <div className="info-row"><span>Pixels</span><strong>{exportWidth} x {exportHeight}</strong></div>
            <div className="info-row"><span>Print size</span><strong>{formatMm(output.mmWidth + (includeBleed ? previewBleed * 2 : 0))} mm x {formatMm(output.mmHeight + (includeBleed ? previewBleed * 2 : 0))} mm</strong></div>
            <div className="info-row"><span>Resolution</span><strong>{ppi} DPI</strong></div>
            <div className="info-row"><span>Color</span><strong>{colorMode.toUpperCase()}</strong></div>
          </div>
        </aside>
        </div>

        {/* Bottom Bar */}
        <motion.section 
          style={{ display: 'grid', gridTemplateColumns: 'minmax(620px, 1fr) 340px', gap: '24px', width: '100%', marginTop: '24px', flexShrink: 0 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Left Panel Controls */}
          <div className="booth-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Button variant="secondary" onClick={() => navigate(`/booth/${template.id}`, { state: { returnTo } })}>Back to Booth</Button>
            <Button variant="danger" style={{ marginLeft: '12px' }} onClick={() => setShowExitDialog(true)}>Exit</Button>
          </div>
          
          {/* Right Panel Controls */}
          <div className="button-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="primary" style={{ width: '100%' }} onClick={downloadFinal}>Download</Button>
            <Button style={{ width: '100%' }} onClick={printFinal}>Print</Button>
          </div>
        </motion.section>
      </main>

      <Dialog
        isOpen={showNewSessionDialog}
        onClose={() => setShowNewSessionDialog(false)}
        title="Start New Session?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowNewSessionDialog(false)}>Cancel</Button>
            <Button variant="warning" onClick={() => {
              setShowNewSessionDialog(false);
              setBooth(null);
              navigate(`/booth/${template.id}`, { state: { returnTo } });
            }}>New Session</Button>
          </>
        }
      >
        Are you sure you want to start a new session? Your current photos will be discarded.
      </Dialog>

      <Dialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        title="Discard Photos & Exit?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowExitDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              setShowExitDialog(false);
              setBooth(null);
              navigate(returnTo);
            }}>Exit</Button>
          </>
        }
      >
        Are you sure you want to exit? Your current photos will be discarded.
      </Dialog>
    </AppShell>
  );
}
