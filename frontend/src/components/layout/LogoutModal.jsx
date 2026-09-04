const LogoutModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Confirm Logout</h3>
        <p className="text-xs text-slate-500 mb-6">Are you sure you want to logout?</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200/60 transition-all duration-150 active:scale-95 shadow-xs"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all duration-150 active:scale-95 shadow-sm"
            onClick={() => {
              onConfirm();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
