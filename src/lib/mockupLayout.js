// Shared layout calculations used by both the live preview canvas and the
// export renderer. Keeping them in one place guarantees the exported image is
// identical to what is displayed in the preview.

export const BRAND_LOGO_SRC = "/brand-logo.svg";

// The brand logo's intrinsic aspect ratio (height / width).
// brand-logo.svg is 400 x 120, so ratio = 0.3
const BRAND_LOGO_RATIO = 120 / 400;

// Fixed padding (in canvas pixels) between the watermark and the right/bottom
// edges of the canvas.
const WATERMARK_MARGIN = 10;

/**
 * Compute the fixed layout for a square canvas of the given size.
 *
 * The watermark is a pure overlay — it has a fixed size (10% of canvas width)
 * and a fixed position (bottom-right corner with 10px padding). It is NOT part
 * of the garment layout, so it never influences garment positioning or scaling.
 *
 * @returns {{canvasSize:number,padding:number,watermark:{x,y,w,h}}}
 */
export function computeLayout(canvasSize) {
  const padding = Math.round(canvasSize * 0.06);

  const wmWidth = Math.round(canvasSize * 0.10); // 10% of canvas width
  const wmHeight = Math.round(wmWidth * BRAND_LOGO_RATIO);

  const watermark = {
    x: canvasSize - wmWidth - WATERMARK_MARGIN,
    y: canvasSize - wmHeight - WATERMARK_MARGIN,
    w: wmWidth,
    h: wmHeight,
  };

  return { canvasSize, padding, watermark };
}

/**
 * Compute the rectangle the garment image should occupy within the canvas.
 *
 * The garment is centred, maintains its aspect ratio, and maximises its size
 * within the padded usable area. The watermark does NOT affect this calculation
 * — it is rendered as an independent overlay on top of the garment.
 *
 * @param {{canvasSize:number,padding:number}} layout
 * @param {number} imgW  garment image natural width
 * @param {number} imgH  garment image natural height
 * @returns {{x,y,w,h}|null}
 */
export function computeGarmentRect(layout, imgW, imgH) {
  const { canvasSize, padding } = layout;
  if (!imgW || !imgH) return null;

  const r = imgH / imgW;
  const cx = canvasSize / 2;

  const usableW = canvasSize - 2 * padding;
  const usableH = canvasSize - 2 * padding;

  let gw = Math.min(usableW, usableH / r);
  gw = Math.max(gw, 1);
  const gh = gw * r;

  return {
    x: cx - gw / 2,
    y: cx - gh / 2,
    w: gw,
    h: gh,
  };
}