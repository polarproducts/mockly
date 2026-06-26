import React, { useState, useRef, useCallback } from "react";
import LeftPanel from "@/components/editor/LeftPanel";
import CanvasArea from "@/components/editor/CanvasArea";
import RightPanel from "@/components/editor/RightPanel";
import ExportModal from "@/components/editor/ExportModal";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/templateStorage";
import { computeLayout, computeGarmentRect } from "@/lib/mockupLayout";

const CANVAS_SIZE = 2000;

export default function Home() {
  const [garmentImage, setGarmentImage] = useState(null);
  const [garmentRect, setGarmentRect] = useState(null); // { x, y, w, h, aspect } in 500px space
  const [logos, setLogos] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSnap, setShowSnap] = useState(true);
  const [showShadow, setShowShadow] = useState(false);
  const [templates, setTemplates] = useState(() => getTemplates());
  const canvasRef = useRef(null);

  // When a new garment is uploaded, compute a sensible default rect (centred,
  // aspect-locked, fitting within the padded canvas) and store it so the user's
  // manual adjustments persist across exports.
  const handleSetGarmentImage = useCallback((url) => {
    setGarmentImage(url);
    if (!url) { setGarmentRect(null); return; }
    const img = new Image();
    img.onload = () => {
      const layout = computeLayout(CANVAS_SIZE);
      const r = computeGarmentRect(layout, img.naturalWidth, img.naturalHeight);
      if (r) setGarmentRect({ ...r, aspect: r.h / r.w });
    };
    img.src = url;
  }, []);

  const updateGarmentRect = useCallback((updates) => {
    setGarmentRect((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const pushHistory = useCallback((newLogos, newTexts) => {
    const entry = { logos: JSON.parse(JSON.stringify(newLogos)), texts: JSON.parse(JSON.stringify(newTexts)) };
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, entry];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setLogos(JSON.parse(JSON.stringify(prev.logos)));
    setTexts(JSON.parse(JSON.stringify(prev.texts)));
    setHistoryIndex((i) => i - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setLogos(JSON.parse(JSON.stringify(next.logos)));
    setTexts(JSON.parse(JSON.stringify(next.texts)));
    setHistoryIndex((i) => i + 1);
  }, [history, historyIndex]);

  const addLogo = useCallback((file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSize = 600;
      const ratio = img.width / img.height;
      const w = ratio >= 1 ? maxSize : maxSize * ratio;
      const h = ratio >= 1 ? maxSize / ratio : maxSize;
      const newLogo = {
        id: `logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "logo",
        url,
        name: file.name,
        x: 1000 - w / 2,
        y: 1000 - h / 2,
        width: w,
        height: h,
        rotation: 0,
        originalWidth: img.width,
        originalHeight: img.height
      };
      setLogos((prev) => {
        const updated = [...prev, newLogo];
        pushHistory(updated, texts);
        return updated;
      });
    };
    img.src = url;
  }, [pushHistory, texts]);

  const addText = useCallback(() => {
    const newText = {
      id: `text-${Date.now()}`,
      type: "text",
      content: "Your Text",
      x: 800,
      y: 1000,
      fontSize: 96,
      fontFamily: "Arial",
      color: "#000000",
      rotation: 0
    };
    setTexts((prev) => {
      const updated = [...prev, newText];
      pushHistory(logos, updated);
      return updated;
    });
    setSelectedId(newText.id);
  }, [pushHistory, logos]);

  const updateLogo = useCallback((id, updates) => {
    setLogos((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const updateLogoCommit = useCallback(() => {
    pushHistory(logos, texts);
  }, [logos, texts, pushHistory]);

  const updateText = useCallback((id, updates) => {
    setTexts((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const updateTextCommit = useCallback(() => {
    pushHistory(logos, texts);
  }, [logos, texts, pushHistory]);

  const deleteLogo = useCallback((id) => {
    setLogos((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      pushHistory(updated, texts);
      return updated;
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, pushHistory, texts]);

  const deleteText = useCallback((id) => {
    setTexts((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      pushHistory(logos, updated);
      return updated;
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, pushHistory, logos]);

  const bringToFront = useCallback((id) => {
    setLogos((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      return [...prev.slice(0, idx), ...prev.slice(idx + 1), item];
    });
    setTexts((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      return [...prev.slice(0, idx), ...prev.slice(idx + 1), item];
    });
    setSelectedId(id);
  }, []);

  // ---- Templates ----
  const handleSaveTemplate = useCallback((name) => {
    const tpl = saveTemplate(name, logos, texts);
    setTemplates((prev) => [tpl, ...prev]);
  }, [logos, texts]);

  const handleApplyTemplate = useCallback((template) => {
    const newLogos = template.logos.map((l) => ({
      ...l,
      id: `logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    const newTexts = template.texts.map((t) => ({
      ...t,
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setLogos(newLogos);
    setTexts(newTexts);
    setSelectedId(null);
    pushHistory(newLogos, newTexts);
  }, [pushHistory]);

  const handleDeleteTemplate = useCallback((id) => {
    deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const selectedItem = logos.find((l) => l.id === selectedId) || texts.find((t) => t.id === selectedId) || null;

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7] overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 bg-white border-b border-[#EEF0F3] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00C7D9] to-[#00A8BD] flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-sm font-semibold text-[#1A1A2E]">Mockly</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="px-2 py-1 text-xs rounded-md text-[#6B7280] hover:bg-[#F5F5F7] disabled:opacity-30 transition-colors">Undo</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-2 py-1 text-xs rounded-md text-[#6B7280] hover:bg-[#F5F5F7] disabled:opacity-30 transition-colors">Redo</button>
          <div className="w-px h-5 bg-[#EEF0F3]" />
          <label className="flex items-center gap-1.5 text-xs text-[#6B7280] cursor-pointer">
            <input type="checkbox" checked={showSnap} onChange={(e) => setShowSnap(e.target.checked)} className="accent-[#00C7D9] w-3 h-3" />
            Snap
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#6B7280] cursor-pointer">
            <input type="checkbox" checked={showShadow} onChange={(e) => setShowShadow(e.target.checked)} className="accent-[#00C7D9] w-3 h-3" />
            Shadow
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <LeftPanel
          garmentImage={garmentImage}
          setGarmentImage={handleSetGarmentImage}
          logos={logos}
          addLogo={addLogo}
          addText={addText}
          selectedId={selectedId}
          setSelectedId={setSelectedId} />
        

        <CanvasArea
          ref={canvasRef}
          garmentImage={garmentImage}
          garmentRect={garmentRect}
          updateGarmentRect={updateGarmentRect}
          logos={logos}
          texts={texts}
          selectedId={selectedId}
          updateLogo={updateLogo}
          updateLogoCommit={updateLogoCommit}
          updateText={updateText}
          updateTextCommit={updateTextCommit}
          bringToFront={bringToFront}
          setSelectedId={setSelectedId}
          showSnap={showSnap}
          showShadow={showShadow} />
        

        <RightPanel
          selectedItem={selectedItem}
          updateLogo={updateLogo}
          updateLogoCommit={updateLogoCommit}
          updateText={updateText}
          updateTextCommit={updateTextCommit}
          deleteLogo={deleteLogo}
          deleteText={deleteText}
          onExport={() => setShowExport(true)}
          garmentImage={garmentImage}
          templates={templates}
          onSaveTemplate={handleSaveTemplate}
          onApplyTemplate={handleApplyTemplate}
          onDeleteTemplate={handleDeleteTemplate} />
        
      </div>

      {showExport &&
      <ExportModal
        garmentImage={garmentImage}
        garmentRect={garmentRect}
        logos={logos}
        texts={texts}
        showShadow={showShadow}
        onClose={() => setShowExport(false)} />

      }
    </div>);

}