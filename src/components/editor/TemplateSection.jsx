import React, { useState } from "react";
import { Save, Trash2, Layers } from "lucide-react";

export default function TemplateSection({ templates, onSave, onApply, onDelete }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!onSave) return;
    onSave(name);
    setName("");
  };

  return (
    <div className="p-4 border-t border-[#EEF0F3]">
      <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider mb-3">Templates</h3>
      <div className="flex gap-1.5 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name..."
          className="flex-1 px-2.5 py-1.5 text-xs border border-[#EEF0F3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00C7D9]"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg bg-[#E0F7FA] text-[#00C7D9] hover:bg-[#00C7D9] hover:text-white transition-colors shrink-0"
          title="Save current layout as template"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>
      {templates.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] text-center py-2">No saved templates yet</p>
      ) : (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#F5F5F7] group">
              <Layers className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <button
                onClick={() => onApply(tpl)}
                className="text-xs text-[#1A1A2E] truncate flex-1 text-left hover:text-[#00C7D9] transition-colors"
                title="Apply template"
              >
                {tpl.name}
              </button>
              <button
                onClick={() => onDelete(tpl.id)}
                className="p-1 rounded hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Delete template"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}