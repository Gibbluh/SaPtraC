import { X, Command, Keyboard } from "lucide-react";

const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: "Route Navigation",
      items: [
        { key: "1 – 5", desc: "Jump directly to Route (Langgam..Calamba)" },
        { key: "← →", desc: "Navigate previous / next day" },
        { key: "T", desc: "Jump to Today" },
        { key: "Esc", desc: "Back to All Routes / Close modal" },
      ],
    },
    {
      group: "Dispatch & Quick Actions",
      items: [
        { key: "Click Slot", desc: "Open Assignment Popover" },
        { key: "U", desc: "Add Unit to Route" },
        { key: "Ctrl + Z", desc: "Undo last scheduling action" },
        { key: "D", desc: "Copy from yesterday" },
        { key: "Del", desc: "Remove assignment from unit" },
      ],
    },
    {
      group: "Commands & Tools",
      items: [
        { key: "Ctrl + K", desc: "Open Command Palette" },
        { key: "/", desc: "Quick search & commands" },
        { key: "?", desc: "Open this keyboard shortcuts guide" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Linear-inspired high-speed dispatch controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3">
                {group.group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center justify-between"
                  >
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {item.desc}
                    </span>
                    <kbd className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono font-bold text-[11px] shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;

