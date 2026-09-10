import { useState } from "react";
import {
  X,
  Copy,
  Trash2,
  Bookmark,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { formatWeekRangeLabel, formatDateFriendly } from "./scheduleConstants";

const BulkOperationsModal = ({
  isOpen,
  onClose,
  activeMode = "COPY_WEEK", // 'COPY_WEEK' | 'TEMPLATES' | 'CLEAR_WEEK'
  currentWeekStartDate,
  schedulesCount = 0,
  onCopyWeek,
  onSaveTemplate,
  onApplyTemplate,
  onClearWeek,
  savedTemplates = [],
  isSubmitting = false,
}) => {
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const currentRangeStr = formatWeekRangeLabel(currentWeekStartDate);

  // Next week calculation
  const nextWeekDate = new Date(currentWeekStartDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextRangeStr = formatWeekRangeLabel(nextWeekDate);

  const handleCopySubmit = (e) => {
    e.preventDefault();
    onCopyWeek({
      sourceWeekStart: currentWeekStartDate,
      targetWeekStart: nextWeekDate,
    });
  };

  const handleSaveTemplateSubmit = (e) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    onSaveTemplate(templateName.trim());
    setTemplateName("");
  };

  const handleApplyTemplateSubmit = (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    onApplyTemplate(selectedTemplateId);
  };

  const handleClearSubmit = (e) => {
    e.preventDefault();
    if (!confirmClear) return;
    onClearWeek();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {activeMode === "COPY_WEEK" && <Copy className="w-5 h-5" />}
              {activeMode === "TEMPLATES" && <Bookmark className="w-5 h-5" />}
              {activeMode === "CLEAR_WEEK" && <Trash2 className="w-5 h-5 text-rose-500" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeMode === "COPY_WEEK" && "Copy Schedule Week"}
                {activeMode === "TEMPLATES" && "Weekly Schedule Templates"}
                {activeMode === "CLEAR_WEEK" && "Clear Current Week"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk schedule automation & deployment
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeMode === "COPY_WEEK" && (
            <form onSubmit={handleCopySubmit} className="space-y-4">
              <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Duplicate Weekly Roster Pattern
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  This will replicate all <span className="font-bold">{schedulesCount} assignments</span> from this active week onto next week without overwriting existing assignments.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">From</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentRangeStr}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">To (Next Week)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{nextRangeStr}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || schedulesCount === 0}
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Copying..." : "Confirm & Copy Week"}
                </button>
              </div>
            </form>
          )}

          {activeMode === "TEMPLATES" && (
            <div className="space-y-5">
              {/* Save Section */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 space-y-2.5">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Save Active Week as Template
                </h3>
                <p className="text-[11px] text-slate-500">
                  Save current roster ({schedulesCount} assignments) as a recurring preset.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard Weekday Roster"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTemplateSubmit}
                    disabled={!templateName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Apply Section */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Available Presets & Templates
                </h3>
                <div className="space-y-2">
                  {savedTemplates.length === 0 ? (
                    <p className="text-slate-400 italic py-2">No templates saved yet.</p>
                  ) : (
                    savedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                          selectedTemplateId === tpl.id
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {tpl.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {tpl.assignments?.length || 0} scheduled shifts • Saved {new Date(tpl.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyTemplate(tpl.id);
                          }}
                          disabled={isSubmitting}
                          className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90"
                        >
                          Apply to Week
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMode === "CLEAR_WEEK" && (
            <form onSubmit={handleClearSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Clear All Assignments for {currentRangeStr}
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This will unassign and remove all {schedulesCount} driver shifts scheduled during this active week. You can undo this action with Ctrl+Z immediately afterwards.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={confirmClear}
                  onChange={(e) => setConfirmClear(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  I understand and want to clear {schedulesCount} assignments.
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!confirmClear || isSubmitting}
                  className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? "Clearing..." : "Wipe Week Schedule"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsModal;

