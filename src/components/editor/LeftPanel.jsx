import React, { useRef } from "react";
import { Upload, Type, Image } from "lucide-react";

export default function LeftPanel({
  garmentImage,
  setGarmentImage,
  logos,
  addLogo,
  addText,
  selectedId,
  setSelectedId,
}) {
  const garmentInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleGarmentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGarmentImage(URL.createObjectURL(file));
  };

  const handleLogoUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addLogo);
    e.target.value = "";
  };

  return (
    <div className="w-64 bg-white border-r border-[#EEF0F3] flex flex-col shrink-0 overflow-hidden">
      {/* Garment */}
      <div className="p-4 border-b border-[#EEF0F3]">
        <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider mb-3">Garment</h3>
        <input ref={garmentInputRef} type="file" accept="image/*" className="hidden" onChange={handleGarmentUpload} />
        {garmentImage ? (
          <div className="relative group">
            <img src={garmentImage} alt="Garment" className="w-full aspect-square object-contain rounded-lg border border-[#EEF0F3] bg-[#F5F5F7]" />
            <button
              onClick={() => garmentInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs font-medium"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => garmentInputRef.current?.click()}
            className="w-full aspect-square rounded-lg border-2 border-dashed border-[#EEF0F3] hover:border-[#00C7D9] transition-colors flex flex-col items-center justify-center gap-2 text-[#9CA3AF] hover:text-[#00C7D9]"
          >
            <Image className="w-6 h-6" />
            <span className="text-xs font-medium">Upload Garment</span>
          </button>
        )}
      </div>

      {/* Logos */}
      <div className="p-4 border-b border-[#EEF0F3] flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider">Logos</h3>
          <input ref={logoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleLogoUpload} />
          <button
            onClick={() => logoInputRef.current?.click()}
            className="p-1 rounded-md hover:bg-[#E0F7FA] text-[#00C7D9] transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
        {logos.length === 0 ? (
          <button
            onClick={() => logoInputRef.current?.click()}
            className="w-full py-6 rounded-lg border-2 border-dashed border-[#EEF0F3] hover:border-[#00C7D9] transition-colors flex flex-col items-center justify-center gap-1.5 text-[#9CA3AF] hover:text-[#00C7D9]"
          >
            <Upload className="w-5 h-5" />
            <span className="text-xs">Upload Logos</span>
          </button>
        ) : (
          <div className="space-y-1.5">
            {logos.map((logo) => (
              <div
                key={logo.id}
                onClick={() => setSelectedId(logo.id)}
                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${
                  selectedId === logo.id ? "bg-[#E0F7FA] ring-1 ring-[#00C7D9]" : "hover:bg-[#F5F5F7]"
                }`}
              >
                <img src={logo.url} alt={logo.name} className="w-8 h-8 object-contain rounded bg-[#F5F5F7] p-0.5" />
                <span className="text-xs text-[#1A1A2E] truncate flex-1">{logo.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Text */}
      <div className="p-4">
        <button
          onClick={addText}
          className="w-full py-2.5 rounded-lg border border-[#EEF0F3] hover:border-[#00C7D9] text-[#6B7280] hover:text-[#00C7D9] transition-colors flex items-center justify-center gap-2 text-xs font-medium"
        >
          <Type className="w-4 h-4" />
          Add Text
        </button>
      </div>
    </div>
  );
}