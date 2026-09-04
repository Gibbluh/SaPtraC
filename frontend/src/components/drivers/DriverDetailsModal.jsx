import DriverStatusBadge from "./DriverStatusBadge";

const DriverDetailsModal = ({ open, driver, onClose }) => {
  if (!open || !driver) return null;

  console.log(driver);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-black">
              Driver Details
            </h2>

            <p className="mt-1 text-sm font-medium text-black">
              Driver profile information
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

        {/* Driver Information */}
        <div className="space-y-4">

          {/* Name */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Name
              </span>

              <span className="text-base font-bold text-black sm:text-right">
                {driver.firstName} {driver.middleName} {driver.lastName}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Email
              </span>

              <span className="break-all text-base font-semibold text-black sm:max-w-[65%] sm:text-right">
                {driver.email}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-black">
                Status
              </span>

              <DriverStatusBadge status={driver.status} />
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
              {driver.qrCode ? (
                <>
                  <div className="rounded-2xl border-2 border-slate-300 bg-white p-3 shadow-sm">
                    <img
                      src={driver.qrCode}
                      alt="QR Code"
                      className="h-40 w-40 rounded-lg object-contain"
                    />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-black">
                    Official Driver QR Code
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

export default DriverDetailsModal;