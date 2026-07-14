/**
 * Compresses an image blob or dataURL to a transparent WebP format, ensuring it stays under a maximum size limit.
 * 
 * @param {Blob|string} imageInput - The image Blob or dataURL to compress.
 * @param {number} maxSizeMb - The maximum size of the output blob in megabytes.
 * @returns {Promise<Blob>} The compressed WebP blob.
 */
export async function compressToTransparentWebp(imageInput, maxSizeMb = 2) {
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  
  // Convert input to HTMLImageElement
  const img = new Image();
  if (imageInput instanceof Blob) {
    img.src = URL.createObjectURL(imageInput);
  } else {
    img.src = imageInput;
  }
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  if (imageInput instanceof Blob) {
    URL.revokeObjectURL(img.src);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  
  canvas.width = width;
  canvas.height = height;

  let quality = 0.9;
  let blob = null;

  // Iteratively compress and scale down if necessary to meet the size limit
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    if (blob.size <= maxSizeBytes) {
      break;
    }

    // Reduce quality first
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      // If quality is already low, start scaling down dimensions
      canvas.width = Math.round(canvas.width * 0.8);
      canvas.height = Math.round(canvas.height * 0.8);
    }
  }

  return blob;
}
