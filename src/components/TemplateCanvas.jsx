import React, { useRef, useEffect } from 'react';

// Canvas drawing utilities
function drawBaseFrame(template, context) {
  const width = template.width;
  const height = template.height;
  context.fillStyle = "#fbfbf7";
  context.fillRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f7faf8");
  gradient.addColorStop(1, "#dfe8e5");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(15, 118, 110, 0.10)";
  context.beginPath();
  context.arc(width / 2, Math.min(290, height * 0.2), Math.min(width, height) * 0.28, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(15, 118, 110, 0.22)";
  context.lineWidth = 2;
  context.strokeRect(28, 28, width - 56, height - 56);
}

async function drawFrameOverlay(template, context) {
  if (template.frameImage) {
    try {
      const image = await loadImage(template.frameImage);
      context.drawImage(image, 0, 0, template.width, template.height);
    } catch {
      return;
    }
  }
}

function drawTemplateTitle(template, context) {
  context.fillStyle = "#31524e";
  context.font = "800 28px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(template.name, template.width / 2, template.height - 56);
}

function drawActiveSlot(context, slot) {
  const cx = slot.x + slot.width / 2;
  const cy = slot.y + slot.height / 2;
  context.save();
  context.translate(cx, cy);
  context.rotate((slot.rotation * Math.PI) / 180);
  context.strokeStyle = "#c2410c";
  context.lineWidth = 8;
  roundedRect(context, -slot.width / 2 - 6, -slot.height / 2 - 6, slot.width + 12, slot.height + 12, slot.radius + 8);
  context.stroke();
  context.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawFittedImage(context, image, x, y, width, height, fit, mirror) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if ((fit === "cover" && imageRatio > boxRatio) || (fit === "contain" && imageRatio < boxRatio)) {
    drawWidth = height * imageRatio;
  } else {
    drawHeight = width / imageRatio;
  }
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;
  context.save();
  if (mirror) {
    context.translate(x + width, y);
    context.scale(-1, 1);
    context.drawImage(image, width - dx - drawWidth, dy - y, drawWidth, drawHeight);
  } else {
    context.drawImage(image, dx, dy, drawWidth, drawHeight);
  }
  context.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    // If the image is coming from the backend's storage, proxy it through Vite
    // to avoid CORS errors when crossOrigin = "anonymous" is set.
    if (src && src.includes('localhost:8000/storage')) {
      src = src.replace(/https?:\/\/localhost:8000\/storage/, '/storage');
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function drawTemplateToCanvas(template, canvas, captures = [], activeIndex = -1) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBaseFrame(template, context);

  for (const [index, slot] of template.slots.entries()) {
    context.save();
    const cx = slot.x + slot.width / 2;
    const cy = slot.y + slot.height / 2;
    context.translate(cx, cy);
    context.rotate((slot.rotation * Math.PI) / 180);
    context.translate(-slot.width / 2, -slot.height / 2);
    roundedRect(context, 0, 0, slot.width, slot.height, slot.radius);
    context.clip();
    context.fillStyle = "#e9efed";
    context.fillRect(0, 0, slot.width, slot.height);
    context.strokeStyle = "#b7c3bf";
    context.lineWidth = 2;
    context.strokeRect(0, 0, slot.width, slot.height);

    if (captures[index]) {
      const image = await loadImage(captures[index]);
      drawFittedImage(context, image, 0, 0, slot.width, slot.height, slot.fit, false);
    } else {
      context.fillStyle = "#47625d";
      context.font = "700 34px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), slot.width / 2, slot.height / 2);
    }
    context.restore();
  }

  await drawFrameOverlay(template, context);
  drawTemplateTitle(template, context);

  if (activeIndex >= 0 && template.slots[activeIndex]) {
    drawActiveSlot(context, template.slots[activeIndex]);
  }
}

// React Component
function pointInSlot(point, slot) {
  const cx = slot.x + slot.width / 2;
  const cy = slot.y + slot.height / 2;
  const angle = -(slot.rotation * Math.PI) / 180;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + slot.width / 2;
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + slot.height / 2;
  return localX >= 0 && localX <= slot.width && localY >= 0 && localY <= slot.height;
}

export default function TemplateCanvas({ template, captures = [], activeIndex = -1, className, style, onSlotClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && template) {
      drawTemplateToCanvas(template, canvasRef.current, captures, activeIndex);
    }
  }, [template, captures, activeIndex]);

  if (!template) return null;

  function handleClick(event) {
    if (!onSlotClick) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * template.width,
      y: ((event.clientY - rect.top) / rect.height) * template.height
    };
    const slotIndex = template.slots.findLastIndex((slot) => pointInSlot(point, slot));
    if (slotIndex >= 0) onSlotClick(slotIndex);
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={template.width} 
      height={template.height} 
      className={className} 
      style={{ maxWidth: '100%', height: 'auto', cursor: onSlotClick ? 'pointer' : undefined, ...style }}
      onClick={handleClick}
    />
  );
}
