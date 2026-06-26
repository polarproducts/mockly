import React from "react";
import { Trash2, Download, RotateCw } from "lucide-react";

const FONTS = [
  "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New",
  "Verdana", "Impact", "Comic Sans MS", "Trebuchet MS", "Palatino Linotype",
  "Lucida Console", "Tahoma", "Garamond",
];

export default function RightPanel({
  selectedItem,
  updateLogo,
  updateLogoCommit,
  updateText,
  updateTextCommit,
  deleteLogo,
  deleteText,
  onExport,
  garmentImage,
}) {
  const isLogo = selectedItem?.type === "logo";
  const isText = selectedItem?.type === "text";

  return (
    <div className="w-64 bg-white border-l border-[#EEF0F3] flex flex-col shrink-0">
      {selectedItem ? (
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider">
              {isLogo ? "Logo Controls" : "Text Controls"}
            </h3>
            <button
              onClick={() => isLogo ? deleteLogo(selectedItem.id) : deleteText(selectedItem.id)}
              className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {isLogo && (
            <div className="space-y-4">
              <ControlGroup label="Width">
                <input
                  type="range"
                  min={20}
                  max={400}
                  value={selectedItem.width}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    const ratio = selectedItem.originalHeight / selectedItem.originalWidth;
                    updateLogo(selectedItem.id, { width: w, height: w * ratio });
                  }}
                  onMouseUp={updateLogoCommit}
                  className="w-full accent-[#00C7D9]"
                />
                <span className="text-xs text-[#9CA3AF]">{Math.round(selectedItem.width)}px</span>
              </ControlGroup>

              <ControlGroup label="Rotation">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedItem.rotation}
                    onChange={(e) => updateLogo(selectedItem.id, { rotation: Number(e.target.value) })}
                    onMouseUp={updateLogoCommit}
                    className="flex-1 accent-[#00C7D9]"
                  />
                  <button
                    onClick={() => { updateLogo(selectedItem.id, { rotation: 0 }); updateLogoCommit(); }}
                    className="p-1 rounded hover:bg-[#F5F5F7] text-[#9CA3AF]"
                    title="Reset rotation"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-[#9CA3AF]">{selectedItem.rotation}°</span>
              </ControlGroup>
            </div>
          )}

          {isText && (
            <div className="space-y-4">
              <ControlGroup label="Text Content">
                <input
                  type="text"
                  value={selectedItem.content}
                  onChange={(e) => updateText(selectedItem.id, { content: e.target.value })}
                  onBlur={updateTextCommit}
                  className="w-full px-3 py-1.5 text-sm border border-[#EEF0F3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00C7D9]"
                />
              </ControlGroup>

              <ControlGroup label="Font">
                <select
                  value={selectedItem.fontFamily}
                  onChange={(e) => { updateText(selectedItem.id, { fontFamily: e.target.value }); updateTextCommit(); }}
                  className="w-full px-3 py-1.5 text-sm border border-[#EEF0F3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00C7D9] bg-white"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </ControlGroup>

              <ControlGroup label="Size">
                <input
                  type="range"
                  min={8}
                  max={120}
                  value={selectedItem.fontSize}
                  onChange={(e) => updateText(selectedItem.id, { fontSize: Number(e.target.value) })}
                  onMouseUp={updateTextCommit}
                  className="w-full accent-[#00C7D9]"
                />
                <span className="text-xs text-[#9CA3AF]">{selectedItem.fontSize}px</span>
              </ControlGroup>

              <ControlGroup label="Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedItem.color}
                    onChange={(e) => updateText(selectedItem.id, { color: e.target.value })}
                    onBlur={updateTextCommit}
                    className="w-8 h-8 rounded border border-[#EEF0F3] cursor-pointer"
                  />
                  <span className="text-xs text-[#9CA3AF] uppercase">{selectedItem.color}</span>
                </div>
              </ControlGroup>

              <ControlGroup label="Rotation">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedItem.rotation}
                    onChange={(e) => updateText(selectedItem.id, { rotation: Number(e.target.value) })}
                    onMouseUp={updateTextCommit}
                    className="flex-1 accent-[#00C7D9]"
                  />
                  <button
                    onClick={() => { updateText(selectedItem.id, { rotation: 0 }); updateTextCommit(); }}
                    className="p-1 rounded hover:bg-[#F5F5F7] text-[#9CA3AF]"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-[#9CA3AF]">{selectedItem.rotation}°</span>
              </ControlGroup>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 flex-1 flex items-center justify-center">
          <p className="text-xs text-[#9CA3AF] text-center">Select a logo or text element to edit its properties</p>
        </div>
      )}

      {/* Export */}
      <div className="p-4 border-t border-[#EEF0F3]">
        <button
          onClick={onExport}
          disabled={!garmentImage}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export Mockup
        </button>
      </div>
    </div>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-[#6B7280] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}