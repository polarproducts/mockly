import React, { useState, useRef, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { computeLayout, BRAND_LOGO_SRC } from "@/lib/mockupLayout";

const EXPORT_SIZE = 2000;
const PREVIEW_SIZE = 2000;

export default function ExportModal({ garmentImage, garmentRect, logos, texts, showShadow, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    renderToCanvas().then(url => setPreviewUrl(url));
  }, []);

  const renderToCanvas = async () => {
    const canvas = document.createElement("canvas");
    await drawScene(canvas);
    return canvas.toDataURL("image/png");
  };

  const drawScene = async (canvas) => {
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    const scale = EXPORT_SIZE / PREVIEW_SIZE;
    const shadowScale = EXPORT_SIZE / 500;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    // Draw garment using the exact position/size from the live preview,
    // scaled to the export resolution so the export matches the preview.
    if (garmentImage && garmentRect) {
      const img = await loadImage(garmentImage);
      const s = EXPORT_SIZE / PREVIEW_SIZE;
      if (showShadow) {
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 24 * shadowScale;
        ctx.shadowOffsetY = 8 * shadowScale;
      }
      ctx.drawImage(img, garmentRect.x * s, garmentRect.y * s, garmentRect.w * s, garmentRect.h * s);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw logos
    for (const logo of logos) {
      const img = await loadImage(logo.url);
      ctx.save();
      const cx = (logo.x + logo.width / 2) * scale;
      const cy = (logo.y + logo.height / 2) * scale;
      ctx.translate(cx, cy);
      ctx.rotate((logo.rotation * Math.PI) / 180);
      ctx.drawImage(img, (-logo.width / 2) * scale, (-logo.height / 2) * scale, logo.width * scale, logo.height * scale);
      ctx.restore();
    }

    // Draw texts
    for (const text of texts) {
      ctx.save();
      ctx.translate(text.x * scale, text.y * scale);
      ctx.rotate((text.rotation * Math.PI) / 180);
      ctx.font = `${text.fontSize * scale}px ${text.fontFamily}`;
      ctx.fillStyle = text.color;
      ctx.textBaseline = "top";
      ctx.fillText(text.content, 0, 0);
      ctx.restore();
    }

    // Draw brand watermark (always injected at export, identical layout to preview)
    await drawBrandWatermark(ctx, EXPORT_SIZE);
  };

  const handleExport = async (format) => {
    setExporting(true);
    const canvas = document.createElement("canvas");
    await drawScene(canvas);

    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    const dataUrl = canvas.toDataURL(mimeType, format === "jpg" ? 0.95 : undefined);

    const link = document.createElement("a");
    link.download = `mockup-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();

    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#EEF0F3]">
          <h2 className="text-sm font-semibold text-[#1A1A2E]">Export Mockup</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#F5F5F7] text-[#9CA3AF]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="aspect-square bg-white border border-[#EEF0F3] rounded-lg overflow-hidden mb-4">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#00C7D9]" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleExport("png")}
              disabled={exporting}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PNG
            </button>
            <button
              onClick={() => handleExport("jpg")}
              disabled={exporting}
              className="flex-1 py-2.5 rounded-lg border border-[#EEF0F3] text-[#1A1A2E] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F5F5F7] transition-all disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              JPG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function drawBrandWatermark(ctx, canvasSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const layout = computeLayout(canvasSize);
      const wm = layout.watermark;
      ctx.globalAlpha = 1;
      ctx.drawImage(img, wm.x, wm.y, wm.w, wm.h);
      ctx.globalAlpha = 1;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = BRAND_LOGO_SRC;
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitContain(imgW, imgH, boxW, boxH) {
  const ratio = Math.min(boxW / imgW, boxH / imgH);
  const dw = imgW * ratio;
  const dh = imgH * ratio;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}