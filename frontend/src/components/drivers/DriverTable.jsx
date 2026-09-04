import { useEffect, useState } from "react";
import DriverStatusBadge from "./DriverStatusBadge";
import useAuth from "../../lib/useAuth";
import api from "../../lib/axios";

const DriverTable = ({
  search,
  status,
  page,
  refreshKey,
  onShowDetails,
  onAddDriver,
  onTotalPagesChange,
}) => {
  const { user } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
   * =========================================================
   * QR POPUP STATE
   * =========================================================
   *
   * UI-only addition.
   * Does not change any existing driver logic.
   * =========================================================
   */
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    const loadDrivers = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get("/drivers", {
          params: {
            search,
            status,
            page,
            limit: 10,
          },
        });

        console.log("DRIVER RESPONSE:", res.data);

        const payload = res.data;

        const list = Array.isArray(payload)
          ? payload
          : payload.drivers || [];

        setDrivers(list);

        if (onTotalPagesChange) {
          onTotalPagesChange(payload.totalPages || 1);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load drivers"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
  }, [
    search,
    status,
    page,
    refreshKey,
    onTotalPagesChange,
  ]);

  /*
   * =========================================================
   * QR CLOSE HANDLER
   * =========================================================
   */
  const handleCloseQR = () => {
    setSelectedQR(null);
  };

  if (loading) {
    return (
      <div className="mt-5 animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-1/4 rounded bg-slate-200"></div>
          <div className="h-9 w-24 rounded bg-slate-200"></div>
        </div>

        <div className="space-y-4">
          <div className="h-11 rounded bg-slate-100"></div>
          <div className="h-11 rounded bg-slate-100"></div>
          <div className="h-11 rounded bg-slate-100"></div>
          <div className="h-11 rounded bg-slate-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 rounded-xl border border-rose-200 bg-white p-6 text-center text-base font-semibold text-black shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
          <span className="text-lg font-bold uppercase tracking-wider text-black">
            Registered Drivers
          </span>

          {user?.role !== "Operational Manager" && (
            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-95"
              onClick={onAddDriver}
            >
              + Add Driver
            </button>
          )}
        </div>

        <table className="min-w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                Name
              </th>

              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                Email
              </th>

              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                Status
              </th>

              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                QR Code
              </th>

              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider text-black">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-base font-semibold text-black"
                >
                  No drivers found.
                </td>
              </tr>
            ) : (
              [...drivers]
                .sort((a, b) => {
                  const nameA = (
                    a.name ||
                    `${a.firstName || ""} ${
                      a.lastName || ""
                    }`
                  )
                    .trim()
                    .toLowerCase();

                  const nameB = (
                    b.name ||
                    `${b.firstName || ""} ${
                      b.lastName || ""
                    }`
                  )
                    .trim()
                    .toLowerCase();

                  return nameA.localeCompare(nameB);
                })
                .map((driver) => {
                  /*
                   * Preserve existing QR source logic.
                   * Only the click behavior is added.
                   */
                  const qrSource =
                    driver.qrCodeUrl ||
                    (driver.qrCode &&
                    typeof driver.qrCode === "string"
                      ? driver.qrCode
                      : null);

                  return (
                    <tr
                      key={driver._id}
                      className="border-b border-slate-100 transition-colors duration-150 odd:bg-white even:bg-slate-50/40 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-base font-semibold text-black">
                        {driver.name ||
                          `${driver.firstName || ""} ${
                            driver.lastName || ""
                          }`.trim()}
                      </td>

                      <td className="px-6 py-4 text-base text-black">
                        {driver.email}
                      </td>

                      <td className="px-6 py-4 text-base text-black">
                        <DriverStatusBadge
                          status={driver.status}
                        />
                      </td>

                      <td className="px-6 py-4 text-base">
                        {qrSource ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQR(qrSource)
                            }
                            className="group inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white p-1 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                            aria-label="View QR Code"
                            title="View QR Code"
                          >
                            <img
                              src={qrSource}
                              src={qrSource}
                              alt="QR"
                              className="h-10 w-10 rounded transition-transform duration-150 group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <span className="text-sm font-medium italic text-black">
                            No QR
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right text-base">
                        <button
                          className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all duration-150 hover:bg-slate-200 active:scale-95"
                          onClick={() =>
                            onShowDetails(driver)
                          }
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================
          QR CODE POPUP
      ========================================================= */}

      {selectedQR && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseQR}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-black">
                Driver QR Code
              </h3>

              <button
                type="button"
                onClick={handleCloseQR}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-slate-100 active:scale-95"
                aria-label="Close QR Code"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* QR IMAGE */}
            <div className="flex items-center justify-center rounded-xl border-slate-200 bg-white p-4">
              <img
                src={selectedQR}
                alt="Driver QR Code"
                className="h-72 w-72 max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverTable;