const MaintenanceDetailsModal = ({ open, maintenance, onClose }) => {
  if (!open || !maintenance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-black">
              Maintenance Details
            </h2>

            <p className="mt-1 text-sm font-medium text-black">
              Complete information for this maintenance record
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-lg font-bold text-black transition hover:bg-slate-100 active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">

          {/* Basic Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-base font-bold uppercase tracking-wide text-black">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Unit
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.unit?.plateNumber || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Issue Title
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.issueTitle || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Description
                </p>

                <p className="mt-2 text-base leading-relaxed text-black">
                  {maintenance.issueDescription || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Category
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.issueCategory || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Priority
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.priorityLevel || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Status
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.maintenanceStatus || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Maintenance Type
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.maintenanceType || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-bold uppercase tracking-wide text-black">
              Cost Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Parts Cost
                </p>

                <p className="mt-2 text-xl font-bold text-black">
                  ₱{Number(maintenance.partsCost || 0).toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Total Cost
                </p>

                <p className="mt-2 text-xl font-bold text-black">
                  ₱{Number(maintenance.totalCost || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-base font-bold uppercase tracking-wide text-black">
              Additional Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Reported Date
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.reportedDate
                    ? new Date(
                        maintenance.reportedDate
                      ).toLocaleString()
                    : "-"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">
                  Remarks
                </p>

                <p className="mt-1 text-base font-semibold text-black">
                  {maintenance.remarks || "None"}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-black shadow-sm transition hover:bg-slate-100 active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default MaintenanceDetailsModal;