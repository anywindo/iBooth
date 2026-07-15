import { uid } from "./useStore.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function createFallbackSlots(template) {
  const marginX = Math.round(template.width * 0.075);
  const top = Math.round(template.height * 0.045);
  const columnGap = Math.round(template.width * 0.055);
  const rowGap = Math.round(template.height * 0.021);
  const footer = Math.round(template.height * 0.07);
  const slotWidth = Math.floor((template.width - marginX * 2 - columnGap) / 2);
  const slotHeight = Math.floor((template.height - top - footer - rowGap * 2) / 3);

  return Array.from({ length: 6 }, (_, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    return {
    id: uid(),
    name: `Slot ${index + 1}`,
    x: marginX + column * (slotWidth + columnGap),
    y: top + row * (slotHeight + rowGap),
    width: slotWidth,
    height: slotHeight,
    rotation: 0,
    radius: 18,
    fit: "cover",
    mirror: true
    };
  });
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function buildOpenMask(data, width, height, cell) {
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  const open = new Uint8Array(cols * rows);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let transparent = 0;
      let bright = 0;
      let lowSaturationBright = 0;
      let total = 0;

      for (let yy = 1; yy < cell; yy += 2) {
        for (let xx = 1; xx < cell; xx += 2) {
          const px = x * cell + xx;
          const py = y * cell + yy;
          const index = (py * width + px) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          const luma = luminance(r, g, b);
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);
          if (a < 72) transparent += 1;
          if (luma > 240) bright += 1;
          if (luma > 216 && saturation < 24) lowSaturationBright += 1;
          total += 1;
        }
      }

      const transparentRatio = transparent / total;
      const brightRatio = bright / total;
      const neutralBrightRatio = lowSaturationBright / total;
      open[y * cols + x] = transparentRatio > 0.18 || brightRatio > 0.72 || neutralBrightRatio > 0.84 ? 1 : 0;
    }
  }

  return { open, cols, rows };
}

function collectBoxes(mask, template, cell) {
  const { open, cols, rows } = mask;
  const seen = new Uint8Array(cols * rows);
  const boxes = [];
  const minArea = template.width * template.height * 0.018;
  const maxArea = template.width * template.height * 0.52;

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const start = y * cols + x;
      if (!open[start] || seen[start]) continue;

      const queue = [[x, y]];
      seen[start] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;

      while (queue.length) {
        const [cx, cy] = queue.pop();
        count += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx <= 0 || ny <= 0 || nx >= cols - 1 || ny >= rows - 1) continue;
          const next = ny * cols + nx;
          if (!open[next] || seen[next]) continue;
          seen[next] = 1;
          queue.push([nx, ny]);
        }
      }

      const width = (maxX - minX + 1) * cell;
      const height = (maxY - minY + 1) * cell;
      const area = count * cell * cell;
      const fillRatio = area / (width * height);
      const aspect = width / height;

      if (
        area >= minArea &&
        area <= maxArea &&
        width >= template.width * 0.16 &&
        height >= template.height * 0.055 &&
        aspect >= 0.45 &&
        aspect <= 2.5 &&
        fillRatio >= 0.42
      ) {
        boxes.push({
          x: minX * cell,
          y: minY * cell,
          width,
          height,
          area,
          fillRatio,
          score: area * fillRatio
        });
      }
    }
  }

  return boxes;
}

function overlapRatio(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const overlap = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  return smaller ? overlap / smaller : 0;
}

function mergeCandidates(candidates) {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const merged = [];

  for (const candidate of sorted) {
    if (merged.some((box) => overlapRatio(box, candidate) > 0.45)) continue;
    merged.push(candidate);
  }

  return merged;
}

function estimateRadius(box) {
  return clamp(Math.round(Math.min(box.width, box.height) * 0.045), 8, 28);
}

function sortBoxesForSlotPattern(boxes, template) {
  if (boxes.length < 4) return [...boxes].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  const sortedByX = [...boxes].sort((a, b) => a.x + a.width / 2 - (b.x + b.width / 2));
  const split = Math.ceil(sortedByX.length / 2);
  const left = sortedByX.slice(0, split);
  const right = sortedByX.slice(split);
  const leftCenter = left.reduce((sum, box) => sum + box.x + box.width / 2, 0) / left.length;
  const rightCenter = right.reduce((sum, box) => sum + box.x + box.width / 2, 0) / right.length;

  if (right.length && rightCenter - leftCenter > template.width * 0.22) {
    return [
      ...left.sort((a, b) => a.y - b.y),
      ...right.sort((a, b) => a.y - b.y)
    ];
  }

  return [...boxes].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

function boxesToSlots(boxes, template) {
  return sortBoxesForSlotPattern(boxes, template)
    .map((box, index) => ({
      id: uid(),
      name: `Slot ${index + 1}`,
      x: clamp(Math.round(box.x + 5), 0, template.width - 60),
      y: clamp(Math.round(box.y + 5), 0, template.height - 60),
      width: clamp(Math.round(box.width - 10), 60, template.width),
      height: clamp(Math.round(box.height - 10), 60, template.height),
      rotation: 0,
      radius: estimateRadius(box),
      fit: "cover",
      mirror: true
    }));
}

export async function analyzeFrameSlots(frameImage, template) {
  if (!frameImage) {
    return {
      slots: createFallbackSlots(template),
      confidence: 0.35,
      mode: "fallback",
      message: "No frame image found, using a standard 4-slot strip layout."
    };
  }

  const image = await loadImage(frameImage);
  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, template.width, template.height);
  const { data } = context.getImageData(0, 0, template.width, template.height);

  const candidates = [];
  for (const cell of [6, 8, 10, 12]) {
    const mask = buildOpenMask(data, template.width, template.height, cell);
    candidates.push(...collectBoxes(mask, template, cell));
  }

  const boxes = mergeCandidates(candidates)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (boxes.length < 2) {
    return {
      slots: createFallbackSlots(template),
      confidence: 0.35,
      mode: "fallback",
      message: "Could not find clear photo openings, falling back to a standard strip layout."
    };
  }

  const slots = boxesToSlots(boxes.slice(0, 6), template);
  const averageFill = boxes.reduce((sum, box) => sum + box.fillRatio, 0) / boxes.length;
  const confidence = clamp(0.52 + Math.min(slots.length, 4) * 0.08 + averageFill * 0.18, 0.55, 0.96);

  return {
    mode: "detected",
    slots,
    confidence,
    message: `Matched ${slots.length} slot${slots.length === 1 ? "" : "s"} from the uploaded frame.`
  };
}
