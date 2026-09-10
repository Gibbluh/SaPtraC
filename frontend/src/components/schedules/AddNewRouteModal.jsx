import React, { useState } from "react";
import { X, Plus, Sparkles, Check } from "lucide-react";
import { COLOR_PRESETS } from "./scheduleConstants";

/**
 * AddNewRouteModal
 * Allows creating a new route with custom name, color theme, and description.
 */
const AddNewRouteModal = ({ isOpen, onClose, onCreateRoute }) => {
  const [routeName, setRouteName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [description, setDescription] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!routeName.trim()) return;

    onCreateRoute({
      name: routeName.trim(),
      hex: selectedColor.hex,
      colorName: selectedColor.name,
      description: description.trim(),
    });

    setRouteName("");
    setDescription("");
    setSelectedColor(COLOR_PRESETS[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-750/70">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-2xs"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Add New Route
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a new transit route for scheduling & unit dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Route Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cabuyao Express, Pacita Complex"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-750 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Route Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((color) => {
                const isSelected = selectedColor.name === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition select-none ${
                      isSelected
                        ? "border-slate-800 dark:border-white ring-2 ring-blue-500 bg-slate-50 dark:bg-slate-700"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate text-slate-800 dark:text-slate-200 text-[11px]">
                      {color.name}
                    </span>
                    {isSelected && <Check className="w-3 h-3 ml-auto text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Main terminal loop servicing high-traffic rush hour zones"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-750 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!routeName.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Route</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewRouteModal;

