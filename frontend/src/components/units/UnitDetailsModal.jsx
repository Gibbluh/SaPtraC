import AvailabilityBadge from "./AvailabilityBadge";
import MaintenanceBadge from "./MaintenanceBadge";

const UnitDetailsModal = ({ open, unit, onClose }) => {
  if (!open || !unit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-black">
              Unit Details
            </h2>

            <p className="mt-1 text-sm font-medium text-black">
              Registered vehicle information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-lg font-bold text-black transition-all hover:bg-slate-200 active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Unit Information */}
        <div className="space-y-4">

          {/* Plate Number */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Plate Number
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.plateNumber || "-"}
              </span>
            </div>
          </div>

          {/* Body Number */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Body Number
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.bodyNumber || "-"}
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Route
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.route || "-"}
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Type
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.unitType || "-"}
              </span>
            </div>
          </div>

          {/* Fuel */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Fuel
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.fuelType || "-"}
              </span>
            </div>
          </div>

          {/* Capacity */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Capacity
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.capacity || "-"}
              </span>
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Availability
              </span>

              <AvailabilityBadge
                status={unit.availabilityStatus}
              />
            </div>
          </div>

          {/* Maintenance */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Maintenance
              </span>

              <MaintenanceBadge
                status={unit.maintenanceStatus}
              />
            </div>
          </div>

          {/* Registration Expiry */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Registration Expiry
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.registrationExpiry?.slice(0, 10) || "-"}
              </span>
            </div>
          </div>

          {/* Insurance Expiry */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Insurance Expiry
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {unit.insuranceExpiry?.slice(0, 10) || "-"}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                QR Code
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              {unit.qrCode ? (
                <>
                  <div className="rounded-2xl border-2 border-slate-300 bg-white p-3 shadow-sm">
                    <img
                      src={unit.qrCode}
                      alt="QR Code"
                      className="h-40 w-40 rounded-lg object-contain"
                    />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-black">
                    Official Unit QR Code
                  </p>
                </>
              ) : (
                <div className="flex min-h-[160px] w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white">
                  <span className="text-sm font-semibold italic text-black">
                    No QR code available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-2.5 text-sm font-bold text-black shadow-sm transition-all hover:bg-slate-200 active:scale-95"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitDetailsModal;