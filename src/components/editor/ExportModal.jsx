import React, { useState, useRef, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";

const EXPORT_SIZE = 1000;
const BRAND_LOGO_SRC = "/brand-logo.svg";

export default function ExportModal({ garmentImage, logos, texts, showShadow, onClose }) {
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
    const scale = EXPORT_SIZE / 500;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    // Draw garment
    if (garmentImage) {
      const img = await loadImage(garmentImage);
      const { dx, dy, dw, dh } = fitContain(img.width, img.height, EXPORT_SIZE, EXPORT_SIZE);
      if (showShadow) {
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 24 * scale;
        ctx.shadowOffsetY = 8 * scale;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
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

    // Draw hardcoded brand watermark (always injected at export)
    await drawBrandWatermark(ctx, scale);
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

function drawBrandWatermark(ctx, scale) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 100 * scale;
      const ratio = img.height / img.width;
      const w = maxW;
      const h = w * ratio;
      const margin = 16 * scale;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, EXPORT_SIZE - w - margin, EXPORT_SIZE - h - margin, w, h);
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