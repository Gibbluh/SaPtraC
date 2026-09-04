const DriverPagination = ({ page = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-5 border-t border-slate-100 pt-4">
      <div className="text-xs font-medium text-slate-500">
        Page {page} of {totalPages}
      </div>

      <div className="flex gap-1.5">
        <button
          className="px-3 py-1 text-xs font-semibold border rounded-lg transition-all duration-150 shadow-xs bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <button
          className="px-3 py-1 text-xs font-semibold border rounded-lg transition-all duration-150 shadow-xs bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DriverPagination;