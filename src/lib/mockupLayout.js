// Shared layout calculations used by both the live preview canvas and the
// export renderer. Keeping them in one place guarantees the exported image is
// identical to what is displayed in the preview.

export const BRAND_LOGO_SRC = "/brand-logo.svg";

// The brand logo's intrinsic aspect ratio (height / width).
// brand-logo.svg is 400 x 120, so ratio = 0.3
const BRAND_LOGO_RATIO = 120 / 400;

/**
 * Compute the fixed layout for a square canvas of the given size.
 * Returns the watermark rectangle (anchored to the bottom-right corner with a
 * consistent proportional margin) and the uniform padding applied to the
 * garment area.
 */
export function computeLayout(canvasSize) {
  const padding = Math.round(canvasSize * 0.06); // ~30px at 500, ~60px at 1000
  const wmMargin = 0; // flush to the very bottom-right corner
  const wmWidth = Math.round(canvasSize * 0.26); // watermark width
  const wmHeight = Math.round(wmWidth * BRAND_LOGO_RATIO);

  const watermark = {
    x: canvasSize - wmWidth - wmMargin,
    y: canvasSize - wmHeight - wmMargin,
    w: wmWidth,
    h: wmHeight,
  };

  return { canvasSize, padding, watermark };
}

/**
 * Compute the rectangle the garment image should occupy within the canvas.
 *
 * The garment is centred, maintains its aspect ratio, maximises its size within
 * the padded usable area, and is guaranteed never to overlap the watermark's
 * protected bottom-right corner.
 *
 * @param {{canvasSize:number,padding:number,watermark:{x,y,w,h}}} layout
 * @param {number} imgW  garment image natural width
 * @param {number} imgH  garment image natural height
 * @returns {{x,y,w,h}|null}
 */
export function computeGarmentRect(layout, imgW, imgH) {
  const { canvasSize, padding, watermark } = layout;
  if (!imgW || !imgH) return null;

  const r = imgH / imgW;
  const cx = canvasSize / 2;

  const usableW = canvasSize - 2 * padding;
  const usableH = canvasSize - 2 * padding;

  // Two independent ways the garment can clear the watermark while staying
  // centred: by keeping its right edge left of the watermark, or by keeping its
  // bottom edge above the watermark. We only need one to hold, so we take the
  // more permissive (larger) of the two as the binding watermark-clearance cap.
  const capByRight = 2 * (watermark.x - cx); // gw so that right edge clears
  const capByBottom = (2 * (watermark.y - cx)) / r; // gw so that bottom edge clears
  const wmClear = Math.max(capByRight, capByBottom);

  let gw = Math.min(usableW, usableH / r, wmClear);
  gw = Math.max(gw, 1);
  const gh = gw * r;

  return {
    x: cx - gw / 2,
    y: cx - gh / 2,
    w: gw,
    h: gh,
  };
}