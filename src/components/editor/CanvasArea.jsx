import React, { useState, useEffect, useRef, forwardRef, useCallback } from "react";

const CANVAS_SIZE = 500;
const SNAP_THRESHOLD = 6;

const CanvasArea = forwardRef(function CanvasArea(
  {
    garmentImage,
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
  const canvasScale = useRef(1);

  useEffect(() => {
    const computeScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const available = Math.min(rect.width - 80, rect.height - 80);
        canvasScale.current = available / CANVAS_SIZE;
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
    const scale = canvasScale.current;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [ref]);

  const handleMouseDown = useCallback((e, item) => {
    e.stopPropagation();
    bringToFront(item.id);
    const pos = toCanvas(e.clientX, e.clientY);
    setDragging({
      id: item.id,
      type: item.type,
      offsetX: pos.x - item.x,
      offsetY: pos.y - item.y,
    });
  }, [bringToFront, toCanvas]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const pos = toCanvas(e.clientX, e.clientY);
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
      if (dragging.type === "logo") updateLogoCommit();
      else updateTextCommit();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, logos, texts, showSnap, updateLogo, updateText, updateLogoCommit, updateTextCommit, toCanvas]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#F5F5F7] overflow-hidden" onClick={() => setSelectedId(null)}>
      <div
        ref={ref}
        data-canvas
        className="relative bg-white shadow-lg"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `scale(${canvasScale.current})`,
          transformOrigin: "center center",
        }}
        onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
      >
        {garmentImage ? (
          <img
            src={garmentImage}
            alt="Garment"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={showShadow ? { filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" } : undefined}
            draggable={false}
          />
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
          />
        ))}

        {texts.map((text) => (
          <CanvasText
            key={text.id}
            text={text}
            isSelected={selectedId === text.id}
            onMouseDown={(e) => handleMouseDown(e, text)}
          />
        ))}

        {snapLines.x !== null && (
          <div className="absolute top-0 bottom-0 w-px bg-[#00C7D9] pointer-events-none" style={{ left: snapLines.x }} />
        )}
        {snapLines.y !== null && (
          <div className="absolute left-0 right-0 h-px bg-[#00C7D9] pointer-events-none" style={{ top: snapLines.y }} />
        )}
      </div>
    </div>
  );
});

function CanvasLogo({ logo, isSelected, onMouseDown }) {
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
    </div>
  );
}

function CanvasText({ text, isSelected, onMouseDown }) {
  return (
    <div
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
    </div>
  );
}

export default CanvasArea;