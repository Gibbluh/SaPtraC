import { useEffect, useMemo, useState } from "react";
import UnitFormModal from "../../components/units/UnitFormModal";
import UnitDetailsModal from "../../components/units/UnitDetailsModal";
import useAuth from "../../lib/useAuth";
import api from "../../lib/axios";

const ROUTES = [
  "LANGGAM",
  "ESTRELLA",
  "VILLAROSA",
  "BAYAN-BAYANAN",
  "CALAMBA",
];

const normalizeRoute = (route) => {
  if (!route) return "UNASSIGNED";

  return String(route).trim().toUpperCase();
};

const getRouteDisplayName = (route) => {
  if (route === "BAYAN-BAYANAN") return "Bayan-Bayanan";
  if (route === "UNASSIGNED") return "Unassigned";

  return (
    route.charAt(0) +
    route.slice(1).toLowerCase()
  );
};

const UnitManagementPage = () => {
  const { user } = useAuth();

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUnit, setSelectedUnit] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedRoute, setSelectedRoute] =
    useState(null);

  /*
   * =========================================================
   * QR POPUP STATE
   * =========================================================
   *
   * UI-only addition.
   * Does not modify any existing unit logic.
   * =========================================================
   */
  const [selectedQR, setSelectedQR] =
    useState(null);

  const [query, setQuery] = useState({
    search: "",
    availabilityStatus: "",
    maintenanceStatus: "",
    page: 1,
  });

  const [totalPages, setTotalPages] =
    useState(1);

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);

      try {
        const params = {
          ...query,
        };

        const res = await api.get("/units", {
          params,
        });

        setUnits(
          res.data?.units || []
        );

        setTotalPages(
          res.data?.totalPages || 1
        );

        setError(null);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load units"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [query]);

  const handleAdd = () => {
    setSelectedUnit(null);
    setShowForm(true);
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setShowForm(true);
  };

  const handleDetails = (unit) => {
    setSelectedUnit(unit);
    setShowDetails(true);
  };

  const handleFormClose = (refresh) => {
    setShowForm(false);
    setSelectedUnit(null);

    if (refresh) {
      setQuery((q) => ({
        ...q,
      }));
    }
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedUnit(null);
  };

  const handleRouteClick = (route) => {
    setSelectedRoute(route);
  };

  const closeRouteModal = () => {
    setSelectedRoute(null);
  };

  /*
   * =========================================================
   * QR POPUP HANDLERS
   * =========================================================
   */
  const handleOpenQR = (qrCode) => {
    if (!qrCode) return;

    setSelectedQR(qrCode);
  };

  const handleCloseQR = () => {
    setSelectedQR(null);
  };

  // Group currently loaded units by route
  const groupedUnits = useMemo(() => {
    const groups = {};

    ROUTES.forEach((route) => {
      groups[route] = [];
    });

    groups.UNASSIGNED = [];

    units.forEach((unit) => {
      const normalized =
        normalizeRoute(unit.route);

      if (groups[normalized]) {
        groups[normalized].push(unit);
      } else {
        groups.UNASSIGNED.push(unit);
      }
    });

    return groups;
  }, [units]);

  // Units shown when a route is opened
  const selectedRouteUnits = selectedRoute
    ? groupedUnits[selectedRoute] || []
    : [];

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6 text-black md:p-8">
        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Unit Management
            </h1>

            <p className="mt-1 text-base font-medium text-black">
              Manage transport fleet units, body numbers,
              route assignments, and maintenance status.
            </p>
          </div>

          {user?.role !==
            "Operational Manager" && (
            <button
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-95"
              onClick={handleAdd}
            >
              + Add Unit
            </button>
          )}
        </div>

        {/* SEARCH / FILTER BAR */}
        <div className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search by plate, body number, or route..."
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={query.search}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  search: e.target.value,
                  page: 1,
                }))
              }
            />

            <select
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={
                query.availabilityStatus
              }
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  availabilityStatus:
                    e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">
                All Availability
              </option>

              <option value="Available">
                Available
              </option>

              <option value="On Route">
                On Route
              </option>

              <option value="Under Maintenance">
                Under Maintenance
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

            <select
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={
                query.maintenanceStatus
              }
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  maintenanceStatus:
                    e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">
                All Maintenance
              </option>

              <option value="Good">
                Good
              </option>

              <option value="Needs Maintenance">
                Needs Maintenance
              </option>

              <option value="Under Repair">
                Under Repair
              </option>
            </select>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-base font-semibold text-black">
            {error}
          </div>
        )}

        {/* ROUTE CARDS */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ROUTES.map((route) => (
              <div
                key={route}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-10 w-1/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {ROUTES.map((route) => {
                const routeUnits =
                  groupedUnits[route] || [];

                return (
                  <button
                    key={route}
                    type="button"
                    onClick={() =>
                      handleRouteClick(route)
                    }
                    className="group rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-black transition-colors group-hover:text-blue-600">
                        {getRouteDisplayName(
                          route
                        )}
                      </h2>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-black">
                        {routeUnits.length}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-black">
                      {routeUnits.length === 1
                        ? "1 Unit Registered"
                        : `${routeUnits.length} Units Registered`}
                    </div>

                    <div className="mt-4 text-sm font-bold text-blue-600">
                      View Units →
                    </div>
                  </button>
                );
              })}
            </div>

            {/* UNASSIGNED */}
            {groupedUnits.UNASSIGNED?.length >
              0 && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() =>
                    handleRouteClick(
                      "UNASSIGNED"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md md:w-auto"
                >
                  <div className="flex items-center justify-between gap-8">
                    <div>
                      <h2 className="text-xl font-bold text-black">
                        Unassigned
                      </h2>

                      <p className="mt-1 text-sm font-medium text-black">
                        Units without a route assignment
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-black">
                      {
                        groupedUnits
                          .UNASSIGNED.length
                      }
                    </span>
                  </div>
                </button>
              </div>
            )}
          </>
        )}

        {/* PAGINATION */}
        <div className="mt-7 flex items-center justify-center gap-2">
          {Array.from(
            { length: totalPages },
            (_, i) => (
              <button
                key={i}
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
                  query.page === i + 1
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-black hover:bg-slate-100"
                }`}
                onClick={() =>
                  setQuery((q) => ({
                    ...q,
                    page: i + 1,
                  }))
                }
                disabled={
                  query.page === i + 1
                }
              >
                {i + 1}
              </button>
            )
          )}
        </div>

        {/* ROUTE UNITS MODAL */}
        {selectedRoute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {getRouteDisplayName(
                      selectedRoute
                    )}
                  </h2>

                  <p className="mt-1 text-base font-medium text-black">
                    {selectedRouteUnits.length ===
                    1
                      ? "1 unit registered in this route"
                      : `${selectedRouteUnits.length} units registered in this route`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeRouteModal
                  }
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-base font-bold text-black hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              {/* MODAL CONTENT */}
              <div className="overflow-auto p-6">
                {selectedRouteUnits.length ===
                0 ? (
                  <div className="py-16 text-center">
                    <h3 className="text-2xl font-bold text-black">
                      No Units Found
                    </h3>

                    <p className="mt-2 text-base font-medium text-black">
                      There are no units registered
                      under this route.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Plate #
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Body #
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Type
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Capacity
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Availability
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            Maintenance
                          </th>

                          <th className="px-5 py-4 text-sm font-bold uppercase tracking-wide text-black">
                            QR Code
                          </th>

                          <th className="px-5 py-4 text-right text-sm font-bold uppercase tracking-wide text-black">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedRouteUnits.map(
                          (unit) => (
                            <tr
                              key={unit._id}
                              className="border-b border-slate-200 hover:bg-slate-50"
                            >
                              <td className="px-5 py-4 text-base font-semibold text-black">
                                {unit.plateNumber ||
                                  "-"}
                              </td>

                              <td className="px-5 py-4 text-base font-semibold text-black">
                                {unit.bodyNumber ||
                                  "-"}
                              </td>

                              <td className="px-5 py-4 text-base text-black">
                                {unit.unitType ||
                                  "-"}
                              </td>

                              <td className="px-5 py-4 text-base text-black">
                                {unit.capacity ??
                                  "-"}
                              </td>

                              <td className="px-5 py-4 text-base text-black">
                                {unit.availabilityStatus ||
                                  "-"}
                              </td>

                              <td className="px-5 py-4 text-base text-black">
                                {unit.maintenanceStatus ||
                                  "-"}
                              </td>

                              {/* =====================================================
                                  CLICKABLE QR CODE
                              ====================================================== */}
                              <td className="px-5 py-4">
                                {unit.qrCode ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenQR(
                                        unit.qrCode
                                      )
                                    }
                                    className="group inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white p-1 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                                    aria-label="View Unit QR Code"
                                    title="View QR Code"
                                  >
                                    <img
                                      src={
                                        unit.qrCode
                                      }
                                      alt="Unit QR Code"
                                      className="h-12 w-12 rounded transition-transform duration-150 group-hover:scale-105"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-base font-semibold text-black">
                                    -
                                  </span>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDetails(
                                      unit
                                    )
                                  }
                                  className="mr-2 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-black hover:bg-slate-200"
                                >
                                  Details
                                </button>

                                {user?.role !==
                                  "Operational Manager" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEdit(
                                        unit
                                      )
                                    }
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT */}
        {showForm && (
          <UnitFormModal
            open={showForm}
            unit={selectedUnit}
            onClose={handleFormClose}
          />
        )}

        {/* DETAILS */}
        {showDetails && (
          <UnitDetailsModal
            open={showDetails}
            unit={selectedUnit}
            onClose={handleDetailsClose}
          />
        )}
      </div>

      {/* =========================================================
          UNIT QR CODE POPUP
      =========================================================*/}
      {selectedQR && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseQR}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* HEADER */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-black">
                Unit QR Code
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
            <div className="flex items-center justify-center border-slate-200 bg-white p-4">
              <img
                src={selectedQR}
                alt="Unit QR Code"
                className="h-72 w-72 max-w-full object-contain"
              />
            </div>            
          </div>
        </div>
      )}
    </>
  );
};

export default UnitManagementPage;