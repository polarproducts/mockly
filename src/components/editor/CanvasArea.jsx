import React, { useState, useEffect, useLayoutEffect, useRef, forwardRef, useCallback } from "react";
import { computeLayout, BRAND_LOGO_SRC } from "@/lib/mockupLayout";

const CANVAS_SIZE = 2000;
const SNAP_THRESHOLD = 24;
const GARMENT_ID = "__garment__";
const MIN_GARMENT = 160;

const CanvasArea = forwardRef(function CanvasArea(
  {
    garmentImage,
    garmentRect,
    updateGarmentRect,
    logos,
    texts,
    selectedId,
    updateLogo,
    updateLogoCommit,
    updateText,
    updateTextCommit,
    bringToFront,
    setSelectedId,
    showSnap,
    showShadow,
  },
  ref
) {
  const [dragging, setDragging] = useState(null);
  const [snapLines, setSnapLines] = useState({ x: null, y: null });
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [canvasScale, setCanvasScale] = useState(0.25);
  const layout = computeLayout(CANVAS_SIZE);

  useLayoutEffect(() => {
    const computeScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const available = Math.min(rect.width - 80, rect.height - 80);
        setCanvasScale(available / CANVAS_SIZE);
      }
    };
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, []);

  const toCanvas = useCallback((clientX, clientY) => {
    const el = ref?.current || containerRef.current?.querySelector("[data-canvas]");
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scale = canvasScale || 1;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [ref, canvasScale]);

  // ---- Garment interaction ----
  const startGarmentDrag = useCallback((e) => {
    e.stopPropagation();
    setSelectedId(GARMENT_ID);
    if (!garmentRect) return;
    const pos = toCanvas(e.clientX, e.clientY);
    setDragging({
      kind: "garment-move",
      offsetX: pos.x - garmentRect.x,
      offsetY: pos.y - garmentRect.y,
    });
  }, [garmentRect, setSelectedId, toCanvas]);

  const startGarmentResize = useCallback((e, corner) => {
    e.stopPropagation();
    setSelectedId(GARMENT_ID);
    if (!garmentRect) return;
    setDragging({ kind: "garment-resize", corner });
  }, [garmentRect, setSelectedId]);

  // ---- Logo/text interaction ----
  const handleMouseDown = useCallback((e, item) => {
    e.stopPropagation();
    bringToFront(item.id);
    const pos = toCanvas(e.clientX, e.clientY);
    setDragging({
      kind: "item-move",
      id: item.id,
      type: item.type,
      offsetX: pos.x - item.x,
      offsetY: pos.y - item.y,
    });
  }, [bringToFront, toCanvas]);

  const startItemResize = useCallback((e, item, corner) => {
    e.stopPropagation();
    bringToFront(item.id);
    setSelectedId(item.id);
    const el = itemRefs.current[item.id];
    const canvasEl = ref?.current;
    let measuredW = item.width || 100;
    let measuredH = item.height || 30;
    if (el && canvasEl) {
      const r = el.getBoundingClientRect();
      const s = canvasScale || 1;
      measuredW = r.width / s;
      measuredH = r.height / s;
    }
    if (item.type === "logo") {
      const aspect = (item.originalHeight || item.height) / (item.originalWidth || item.width);
      setDragging({
        kind: "item-resize",
        id: item.id,
        type: "logo",
        corner,
        startX: item.x,
        startY: item.y,
        startW: item.width,
        startH: item.height,
        aspect,
      });
    } else {
      setDragging({
        kind: "item-resize",
        id: item.id,
        type: "text",
        corner,
        startX: item.x,
        startY: item.y,
        startW: measuredW,
        startH: measuredH,
        startFontSize: item.fontSize,
      });
    }
  }, [bringToFront, setSelectedId, toCanvas, ref, canvasScale]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const pos = toCanvas(e.clientX, e.clientY);

      if (dragging.kind === "garment-move" && garmentRect) {
        let newX = pos.x - dragging.offsetX;
        let newY = pos.y - dragging.offsetY;
        newX = Math.max(0, Math.min(newX, CANVAS_SIZE - garmentRect.w));
        newY = Math.max(0, Math.min(newY, CANVAS_SIZE - garmentRect.h));
        updateGarmentRect({ x: newX, y: newY });
        return;
      }

      if (dragging.kind === "garment-resize" && garmentRect) {
        const aspect = garmentRect.aspect || (garmentRect.h / garmentRect.w);
        let { x, y, w, h } = garmentRect;
        const corner = dragging.corner;

        if (corner === "se") {
          let nw = pos.x - x;
          nw = Math.max(MIN_GARMENT, Math.min(nw, CANVAS_SIZE - x));
          let nh = nw * aspect;
          if (y + nh > CANVAS_SIZE) { nh = CANVAS_SIZE - y; nw = nh / aspect; }
          w = nw; h = nh;
        } else if (corner === "sw") {
          let nw = (x + w) - pos.x;
          nw = Math.max(MIN_GARMENT, Math.min(nw, x + w));
          let nh = nw * aspect;
          if (y + nh > CANVAS_SIZE) { nh = CANVAS_SIZE - y; nw = nh / aspect; }
          x = x + w - nw; w = nw; h = nh;
        } else if (corner === "ne") {
          let nw = pos.x - x;
          nw = Math.max(MIN_GARMENT, Math.min(nw, CANVAS_SIZE - x));
          let nh = nw * aspect;
          if (y + nh > CANVAS_SIZE) { nh = CANVAS_SIZE - y; nw = nh / aspect; }
          w = nw; h = nh;
        } else if (corner === "nw") {
          let nw = (x + w) - pos.x;
          nw = Math.max(MIN_GARMENT, Math.min(nw, x + w));
          let nh = nw * aspect;
          if (y + nh > CANVAS_SIZE) { nh = CANVAS_SIZE - y; nw = nh / aspect; }
          x = x + w - nw; w = nw; h = nh;
        }
        updateGarmentRect({ x, y, w, h });
        return;
      }

      if (dragging.kind === "item-resize") {
        if (dragging.type === "logo") {
          const { startX, startY, startW, startH, aspect, corner } = dragging;
          let newW, newX = startX, newY = startY;
          if (corner === "se") {
            newW = pos.x - startX;
          } else if (corner === "sw") {
            newW = (startX + startW) - pos.x;
            newX = pos.x;
          } else if (corner === "ne") {
            newW = pos.x - startX;
          } else {
            newW = (startX + startW) - pos.x;
            newX = pos.x;
          }
          newW = Math.max(80, newW);
          let newH = newW * aspect;
          if (newX < 0) { newW += newX; newX = 0; newH = newW * aspect; }
          if (newX + newW > CANVAS_SIZE) { newW = CANVAS_SIZE - newX; newH = newW * aspect; }
          if (corner === "ne" || corner === "nw") {
            newY = startY + startH - newH;
            if (newY < 0) { newH += newY; newY = 0; newW = newH / aspect; if (corner === "nw") newX = startX + startW - newW; }
          }
          updateLogo(dragging.id, { x: newX, y: newY, width: newW, height: newH });
        } else {
          const { startX, startW, startFontSize, corner } = dragging;
          let scale = 1;
          if (corner === "se" || corner === "ne") {
            scale = (pos.x - startX) / startW;
          } else {
            scale = ((startX + startW) - pos.x) / startW;
          }
          scale = Math.max(0.1, scale);
          let newFontSize = Math.max(32, Math.min(800, Math.round(startFontSize * scale)));
          updateText(dragging.id, { fontSize: newFontSize });
        }
        return;
      }

      // item move
      let newX = pos.x - dragging.offsetX;
      let newY = pos.y - dragging.offsetY;

      let sX = null, sY = null;
      if (showSnap) {
        const item = dragging.type === "logo"
          ? logos.find(l => l.id === dragging.id)
          : texts.find(t => t.id === dragging.id);
        if (item) {
          const w = item.width || 0;
          const h = item.height || (item.fontSize || 24);
          const cx = newX + w / 2;
          const cy = newY + h / 2;
          if (Math.abs(cx - CANVAS_SIZE / 2) < SNAP_THRESHOLD) {
            newX = CANVAS_SIZE / 2 - w / 2;
            sX = CANVAS_SIZE / 2;
          }
          if (Math.abs(cy - CANVAS_SIZE / 2) < SNAP_THRESHOLD) {
            newY = CANVAS_SIZE / 2 - h / 2;
            sY = CANVAS_SIZE / 2;
          }
        }
      }
      setSnapLines({ x: sX, y: sY });

      if (dragging.type === "logo") {
        updateLogo(dragging.id, { x: newX, y: newY });
      } else {
        updateText(dragging.id, { x: newX, y: newY });
      }
    };

    const handleUp = () => {
      setDragging(null);
      setSnapLines({ x: null, y: null });
      if (dragging.kind === "item-move" || dragging.kind === "item-resize") {
        if (dragging.type === "logo") updateLogoCommit();
        else updateTextCommit();
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, garmentRect, logos, texts, showSnap, updateLogo, updateText, updateLogoCommit, updateTextCommit, updateGarmentRect, toCanvas]);

  const garmentSelected = selectedId === GARMENT_ID;

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#F5F5F7] overflow-hidden" onClick={() => setSelectedId(null)}>
      <div style={{ width: CANVAS_SIZE * canvasScale, height: CANVAS_SIZE * canvasScale }} className="relative shrink-0">
        <div
          ref={ref}
          data-canvas
          className="absolute top-0 left-0 bg-white shadow-lg"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            transform: `scale(${canvasScale})`,
            transformOrigin: "top left",
          }}
          onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
        >
          {garmentImage && garmentRect ? (
            <div
              className={`absolute cursor-move ${garmentSelected ? "ring-2 ring-[#00C7D9]" : "ring-1 ring-transparent hover:ring-[#00C7D9]/40"}`}
              style={{
                left: garmentRect.x,
                top: garmentRect.y,
                width: garmentRect.w,
                height: garmentRect.h,
                ...(showShadow ? { filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" } : {}),
              }}
              onMouseDown={startGarmentDrag}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={garmentImage}
                alt="Garment"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              {garmentSelected && (
                <>
                  <ResizeHandle corner="nw" pos="top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" onDown={startGarmentResize} />
                  <ResizeHandle corner="ne" pos="top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" onDown={startGarmentResize} />
                  <ResizeHandle corner="sw" pos="bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" onDown={startGarmentResize} />
                  <ResizeHandle corner="se" pos="bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" onDown={startGarmentResize} />
                </>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-[#9CA3AF]">Upload a garment to begin</p>
            </div>
          )}

          {logos.map((logo) => (
            <CanvasLogo
              key={logo.id}
              logo={logo}
              isSelected={selectedId === logo.id}
              onMouseDown={(e) => handleMouseDown(e, logo)}
              onResizeStart={(e, corner) => startItemResize(e, logo, corner)}
            />
          ))}

          {texts.map((text) => (
            <CanvasText
              key={text.id}
              text={text}
              isSelected={selectedId === text.id}
              onMouseDown={(e) => handleMouseDown(e, text)}
              onResizeStart={(e, corner) => startItemResize(e, text, corner)}
              registerRef={(el) => { if (el) itemRefs.current[text.id] = el; }}
            />
          ))}

          {snapLines.x !== null && (
            <div className="absolute top-0 bottom-0 w-px bg-[#00C7D9] pointer-events-none" style={{ left: snapLines.x }} />
          )}
          {snapLines.y !== null && (
            <div className="absolute left-0 right-0 h-px bg-[#00C7D9] pointer-events-none" style={{ top: snapLines.y }} />
          )}

          {/* Brand watermark — fixed bottom-right, always the top layer, 100% opacity */}
          <img
            src={BRAND_LOGO_SRC}
            alt="Brand"
            className="absolute pointer-events-none select-none"
            style={{
              left: layout.watermark.x,
              top: layout.watermark.y,
              width: layout.watermark.w,
              height: layout.watermark.h,
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
});

function ResizeHandle({ corner, pos, onDown }) {
  return (
    <div
      onMouseDown={(e) => onDown(e, corner)}
      className={`absolute w-3 h-3 bg-white border-2 border-[#00C7D9] rounded-sm ${pos}`}
      style={{ zIndex: 30 }}
    />
  );
}

function CanvasLogo({ logo, isSelected, onMouseDown, onResizeStart }) {
  return (
    <div
      className={`absolute cursor-move ${isSelected ? "ring-2 ring-[#00C7D9] ring-offset-1" : ""}`}
      style={{
        left: logo.x,
        top: logo.y,
        width: logo.width,
        height: logo.height,
        transform: `rotate(${logo.rotation}deg)`,
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <img src={logo.url} alt={logo.name} className="w-full h-full object-contain pointer-events-none" draggable={false} />
      {isSelected && onResizeStart && (
        <>
          <ResizeHandle corner="nw" pos="top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" onDown={onResizeStart} />
          <ResizeHandle corner="ne" pos="top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" onDown={onResizeStart} />
          <ResizeHandle corner="sw" pos="bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" onDown={onResizeStart} />
          <ResizeHandle corner="se" pos="bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" onDown={onResizeStart} />
        </>
      )}
    </div>
  );
}

function CanvasText({ text, isSelected, onMouseDown, onResizeStart, registerRef }) {
  return (
    <div
      ref={registerRef}
      className={`absolute cursor-move whitespace-nowrap ${isSelected ? "ring-2 ring-[#00C7D9] ring-offset-1" : ""}`}
      style={{
        left: text.x,
        top: text.y,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
        color: text.color,
        transform: `rotate(${text.rotation}deg)`,
        lineHeight: 1.2,
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {text.content}
      {isSelected && onResizeStart && (
        <>
          <ResizeHandle corner="nw" pos="top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" onDown={onResizeStart} />
          <ResizeHandle corner="ne" pos="top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" onDown={onResizeStart} />
          <ResizeHandle corner="sw" pos="bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" onDown={onResizeStart} />
          <ResizeHandle corner="se" pos="bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" onDown={onResizeStart} />
        </>
      )}
    </div>
  );
}

export default CanvasArea;