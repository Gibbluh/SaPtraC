import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useScheduleApi } from "../../lib/scheduleApi";
import CreateScheduleModal from "../../components/schedules/CreateScheduleModal";
import api from "../../lib/axios";
import { Calendar } from "lucide-react";

const ROUTES = [
  "LANGGAM",
  "ESTRELLA",
  "VILLAROSA",
  "BAYAN-BAYANAN",
  "CALAMBA",
];

const getRouteForUnit = (bodyNumber) => {
  const num = parseInt(bodyNumber, 10);

  if (isNaN(num)) return null;

  if (num >= 1 && num <= 20) return "LANGGAM";

  if (
    (num >= 31 && num <= 40) ||
    (num >= 46 && num <= 52) ||
    num === 66
  ) {
    return "ESTRELLA";
  }

  if ((num >= 21 && num <= 30) || (num >= 41 && num <= 45)) {
    return "VILLAROSA";
  }

  if (num >= 53 && num <= 56) return "BAYAN-BAYANAN";

  if (num >= 57 && num <= 65) return "CALAMBA";

  return null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Date(dateStr).toLocaleDateString("en-US", options);
};

const formatTimestamp = (ts) => {
  if (!ts) return "N/A";

  return new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Memoized UnitCard Component
const UnitCard = React.memo(
  ({
    unit,
    drivers,
    uState,
    dbState,
    onDriverChange,
    onSave,
    isSaving,
    isSaved,
    onTriggerDelete,
    onTriggerDetails,
    allAssignedDrivers,
  }) => {
    // Determine if a driver is assigned elsewhere
    const isDriverUnavailable = (driverId, currentShift) => {
      if (!driverId) return false;

      // Check if driver is assigned in the alternate shift
      if (
        currentShift === "first" &&
        uState.secondShiftDriver === driverId
      ) {
        return true;
      }

      if (
        currentShift === "second" &&
        uState.firstShiftDriver === driverId
      ) {
        return true;
      }

      // Check if driver is assigned to any other unit
      return (
        allAssignedDrivers.has(driverId) &&
        uState.firstShiftDriver !== driverId &&
        uState.secondShiftDriver !== driverId
      );
    };

    const hasUnsavedChanges = useMemo(() => {
      return (
        uState.firstShiftDriver !== dbState.firstShiftDriver ||
        uState.secondShiftDriver !== dbState.secondShiftDriver
      );
    }, [uState, dbState]);

    const handleRemoveAction = (shift) => {
      const scheduleId =
        shift === "first"
          ? dbState.firstShiftScheduleId
          : dbState.secondShiftScheduleId;

      if (scheduleId) {
        onTriggerDelete(scheduleId, unit._id, shift);
      } else {
        onDriverChange(unit._id, shift, "");
      }
    };

    return (
      <div className="bg-slate-50/70 border border-slate-200/50 rounded-lg p-4 space-y-4 transition-all duration-150 hover:shadow-xs hover:border-slate-300">
        {/* Unit Header */}
        <div
          onClick={() => onTriggerDetails(unit, dbState)}
          className="flex justify-between items-center cursor-pointer hover:bg-slate-100 p-2 -m-2 rounded-lg transition-all duration-150 group"
          title="Click to view assignment details"
        >
          <span className="text-sm font-bold text-black tracking-tight group-hover:text-blue-600 transition-colors duration-150">
            UNIT {unit.bodyNumber || "Unknown"}
          </span>

          <span className="text-xs text-black font-semibold">
            {unit.plateNumber}
          </span>
        </div>

        {/* First Shift */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            First Shift
          </label>

          <select
            value={uState.firstShiftDriver}
            onChange={(e) =>
              onDriverChange(unit._id, "first", e.target.value)
            }
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-black shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
          >
            <option value="">Select Driver</option>

            {drivers.map((d) => {
              const unavailable = isDriverUnavailable(d._id, "first");

              return (
                <option
                  key={d._id}
                  value={d._id}
                  disabled={unavailable}
                >
                  {d.firstName} {d.lastName}
                  {unavailable ? " (Assigned)" : ""}
                </option>
              );
            })}
          </select>

          {uState.firstShiftDriver && (
            <button
              type="button"
              onClick={() => handleRemoveAction("first")}
              className="text-xs text-black hover:text-rose-600 font-bold flex items-center gap-1 mt-1 transition-colors duration-150 active:scale-95"
            >
              🗑 Remove Assignment
            </button>
          )}
        </div>

        {/* Second Shift */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            Second Shift
          </label>

          <select
            value={uState.secondShiftDriver}
            onChange={(e) =>
              onDriverChange(unit._id, "second", e.target.value)
            }
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-black shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
          >
            <option value="">Select Driver</option>

            {drivers.map((d) => {
              const unavailable = isDriverUnavailable(d._id, "second");

              return (
                <option
                  key={d._id}
                  value={d._id}
                  disabled={unavailable}
                >
                  {d.firstName} {d.lastName}
                  {unavailable ? " (Assigned)" : ""}
                </option>
              );
            })}
          </select>

          {uState.secondShiftDriver && (
            <button
              type="button"
              onClick={() => handleRemoveAction("second")}
              className="text-xs text-black hover:text-rose-600 font-bold flex items-center gap-1 mt-1 transition-colors duration-150 active:scale-95"
            >
              🗑 Remove Assignment
            </button>
          )}
        </div>

        {/* Save / Status Button */}
        <button
          onClick={() => onSave(unit._id)}
          disabled={isSaving || isSaved}
          className={`w-full mt-2 px-3 py-2 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95 hover:shadow-md flex items-center justify-center gap-1.5 ${
            isSaving
              ? "bg-blue-400 cursor-not-allowed"
              : isSaved
              ? "bg-green-600 cursor-not-allowed"
              : hasUnsavedChanges
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          }`}
        >
          {isSaving
            ? "Saving Assignment..."
            : isSaved
            ? "✔ Saved"
            : hasUnsavedChanges
            ? "● Unsaved Changes"
            : "Save Assignment"}
        </button>
      </div>
    );
  }
);

const SchedulingBoard = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [drivers, setDrivers] = useState([]);
  const [units, setUnits] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [recentDates, setRecentDates] = useState([]);
  const [dropdownStates, setDropdownStates] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState(null);
  const [savedStatuses, setSavedStatuses] = useState({});

  // Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    unit: null,
    dbState: null,
  });

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [firstShiftDetail, setFirstShiftDetail] = useState(null);
  const [secondShiftDetail, setSecondShiftDetail] = useState(null);

  // Confirm Delete State
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    scheduleId: null,
    unitId: null,
    shiftType: null,
  });

  const socketRef = useRef(null);

  const { getSchedules, getSingleSchedule } = useScheduleApi();

  // Load active and non-archived drivers & all units on mount
  useEffect(() => {
    const initDropdownData = async () => {
      setInitialLoading(true);

      try {
        const [driversRes, unitsRes] = await Promise.all([
          api.get("/drivers", {
            params: {
              limit: 1000,
              status: "Active",
            },
          }),
          api.get("/units", {
            params: {
              limit: 1000,
            },
          }),
        ]);

        const activeDrivers = (driversRes.data.drivers || []).filter(
          (d) => d.status === "Active" && !d.deletedAt
        );

        setDrivers(activeDrivers);

        const activeUnits = (unitsRes.data.units || []).filter(
          (u) => !u.deletedAt
        );

        activeUnits.sort((a, b) => {
          const numA = parseInt(a.bodyNumber, 10) || 0;
          const numB = parseInt(b.bodyNumber, 10) || 0;

          return numA - numB;
        });

        setUnits(activeUnits);
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("Failed to load initial dropdown data.");
      } finally {
        setInitialLoading(false);
      }
    };

    initDropdownData();
  }, []);

  // Fetch board schedules for selected date, and recent history
  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dateSchedulesRes, allSchedulesRes] =
        await Promise.all([
          getSchedules({
            date: selectedDate,
            limit: 1000,
          }),
          getSchedules({
            limit: 1000,
          }),
        ]);

      const dateSchedules = dateSchedulesRes.schedules || [];
      setSchedules(dateSchedules);

      const allSchedules =
        allSchedulesRes.schedules || [];

      const dates = allSchedules
        .map((s) => {
          if (!s.shiftDate) return null;

          return new Date(s.shiftDate)
            .toISOString()
            .slice(0, 10);
        })
        .filter(Boolean);

      const uniqueDates = Array.from(new Set(dates)).slice(
        0,
        10
      );

      setRecentDates(uniqueDates);
    } catch (err) {
      console.error("Failed to load schedules", err);
      setError("Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Trigger fetch when date changes
  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Setup dynamic dropdown values state mapping
  useEffect(() => {
    if (units.length === 0) return;

    const initialStates = {};

    units.forEach((unit) => {
      initialStates[unit._id] = {
        unitId: unit._id,
        firstShiftDriver: "",
        secondShiftDriver: "",
      };
    });

    schedules.forEach((schedule) => {
      const unitId =
        schedule.unit?._id || schedule.unit;

      const driverId =
        schedule.driver?._id || schedule.driver;

      if (unitId && driverId && initialStates[unitId]) {
        if (schedule.shiftType === "First Shift") {
          initialStates[unitId].firstShiftDriver =
            driverId;
        } else if (
          schedule.shiftType === "Second Shift"
        ) {
          initialStates[unitId].secondShiftDriver =
            driverId;
        }
      }
    });

    setDropdownStates(initialStates);
  }, [schedules, units]);

  // Load detailed schedule metadata
  useEffect(() => {
    if (
      !detailsModal.isOpen ||
      !detailsModal.dbState
    ) {
      return;
    }

    const loadDetails = async () => {
      setDetailsLoading(true);
      setFirstShiftDetail(null);
      setSecondShiftDetail(null);

      try {
        const promises = [];
        const dbState = detailsModal.dbState;

        if (dbState.firstShiftScheduleId) {
          promises.push(
            getSingleSchedule(
              dbState.firstShiftScheduleId
            ).then((res) => {
              setFirstShiftDetail(
                res.schedule || res
              );
            })
          );
        }

        if (dbState.secondShiftScheduleId) {
          promises.push(
            getSingleSchedule(
              dbState.secondShiftScheduleId
            ).then((res) => {
              setSecondShiftDetail(
                res.schedule || res
              );
            })
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error(
          "Failed to load schedule details",
          err
        );

        toast.error(
          "Failed to load assignment details."
        );
      } finally {
        setDetailsLoading(false);
      }
    };

    loadDetails();
  }, [
    detailsModal.isOpen,
    detailsModal.dbState,
    getSingleSchedule,
  ]);

  // Socket.io listener ref trick to avoid reconnect loops
  const fetchBoardDataRef = useRef(fetchBoardData);

  useEffect(() => {
    fetchBoardDataRef.current =
      fetchBoardData;
  }, [fetchBoardData]);

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    const refreshData = () => {
      fetchBoardDataRef.current();
    };

    const SCHEDULE_EVENTS = [
      "scheduleCreated",
      "scheduleUpdated",
      "scheduleDeleted",
      "driverReplaced",
      "statusChanged",
    ];

    SCHEDULE_EVENTS.forEach((event) => {
      socket.on(event, refreshData);
    });

    return () => {
      SCHEDULE_EVENTS.forEach((event) =>
        socket.off(event)
      );

      socket.disconnect();
    };
  }, []);

  // Callback to handle local select value state update
  const handleDriverChange = useCallback(
    (unitId, shift, driverId) => {
      setDropdownStates((prev) => ({
        ...prev,
        [unitId]: {
          ...prev[unitId],
          [shift === "first"
            ? "firstShiftDriver"
            : "secondShiftDriver"]: driverId,
        },
      }));
    },
    []
  );

  // Compute Set of all assigned drivers on the board
  const allAssignedDrivers = useMemo(() => {
    const assigned = new Set();

    Object.values(dropdownStates).forEach(
      (state) => {
        if (state.firstShiftDriver) {
          assigned.add(state.firstShiftDriver);
        }

        if (state.secondShiftDriver) {
          assigned.add(state.secondShiftDriver);
        }
      }
    );

    return assigned;
  }, [dropdownStates]);

  // Compute current database state
  const dbStateForUnit = useMemo(() => {
    const mapping = {};

    units.forEach((unit) => {
      mapping[unit._id] = {
        firstShiftDriver: "",
        secondShiftDriver: "",
        firstShiftScheduleId: null,
        secondShiftScheduleId: null,
        firstShiftSchedule: null,
        secondShiftSchedule: null,
      };
    });

    schedules.forEach((schedule) => {
      const unitId =
        schedule.unit?._id || schedule.unit;

      const driverId =
        schedule.driver?._id || schedule.driver;

      if (unitId && driverId && mapping[unitId]) {
        if (schedule.shiftType === "First Shift") {
          mapping[unitId].firstShiftDriver =
            driverId;

          mapping[unitId].firstShiftScheduleId =
            schedule._id;

          mapping[unitId].firstShiftSchedule =
            schedule;
        } else if (
          schedule.shiftType === "Second Shift"
        ) {
          mapping[unitId].secondShiftDriver =
            driverId;

          mapping[unitId].secondShiftScheduleId =
            schedule._id;

          mapping[unitId].secondShiftSchedule =
            schedule;
        }
      }
    });

    return mapping;
  }, [schedules, units]);

  // Validate shift assignments
  const validateAssignment = (
    unitId,
    firstDriver,
    secondDriver
  ) => {
    if (
      firstDriver &&
      firstDriver === secondDriver
    ) {
      return "A driver cannot be assigned to both shifts on the same unit.";
    }

    if (firstDriver) {
      const duplicateUnit = Object.entries(
        dropdownStates
      ).find(([uId, state]) => {
        if (uId === unitId) return false;

        return (
          state.firstShiftDriver ===
            firstDriver ||
          state.secondShiftDriver ===
            firstDriver
        );
      });

      if (duplicateUnit) {
        const otherUnit = units.find(
          (u) => u._id === duplicateUnit[0]
        );

        const driver = drivers.find(
          (d) => d._id === firstDriver
        );

        const driverName = driver
          ? `${driver.firstName} ${driver.lastName}`
          : "Driver";

        const unitNum = otherUnit
          ? `Unit ${otherUnit.bodyNumber}`
          : "another unit";

        const duplicateShift =
          duplicateUnit[1].firstShiftDriver ===
          firstDriver
            ? "First Shift"
            : "Second Shift";

        return `${driverName} is already assigned to ${unitNum} (${duplicateShift}).`;
      }
    }

    if (secondDriver) {
      const duplicateUnit = Object.entries(
        dropdownStates
      ).find(([uId, state]) => {
        if (uId === unitId) return false;

        return (
          state.firstShiftDriver ===
            secondDriver ||
          state.secondShiftDriver ===
            secondDriver
        );
      });

      if (duplicateUnit) {
        const otherUnit = units.find(
          (u) => u._id === duplicateUnit[0]
        );

        const driver = drivers.find(
          (d) => d._id === secondDriver
        );

        const driverName = driver
          ? `${driver.firstName} ${driver.lastName}`
          : "Driver";

        const unitNum = otherUnit
          ? `Unit ${otherUnit.bodyNumber}`
          : "another unit";

        const duplicateShift =
          duplicateUnit[1].firstShiftDriver ===
          secondDriver
            ? "First Shift"
            : "Second Shift";

        return `${driverName} is already assigned to ${unitNum} (${duplicateShift}).`;
      }
    }

    return null;
  };

  // Perform permanent MongoDB Save Assignment operation
  const handleSaveAssignment = useCallback(
    async (unitId) => {
      const uState =
        dropdownStates[unitId];

      if (!uState) return;

      const unit = units.find(
        (u) => u._id === unitId
      );

      const unitRoute =
        getRouteForUnit(unit?.bodyNumber) ||
        unit?.route ||
        "Unassigned";

      const validationError =
        validateAssignment(
          unitId,
          uState.firstShiftDriver,
          uState.secondShiftDriver
        );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      setSavingUnitId(unitId);

      try {
        const dbState =
          dbStateForUnit[unitId] || {};

        const existingFirst =
          dbState.firstShiftSchedule;

        const existingSecond =
          dbState.secondShiftSchedule;

        const selectedFirst =
          uState.firstShiftDriver;

        const selectedSecond =
          uState.secondShiftDriver;

        const promises = [];

        let isUpdate = false;
        let isCreate = false;

        // 1. First Shift
        if (!selectedFirst) {
          if (existingFirst) {
            promises.push(
              api.delete(
                `/schedules/${existingFirst._id}`
              )
            );
          }
        } else {
          if (!existingFirst) {
            isCreate = true;

            promises.push(
              api.post("/schedules", {
                driver: selectedFirst,
                unit: unitId,
                shiftDate: selectedDate,
                shiftType: "First Shift",
                shiftStart: "05:00",
                shiftEnd: "13:00",
                route: unitRoute,
              })
            );
          } else if (
            (existingFirst.driver?._id ||
              existingFirst.driver) !==
            selectedFirst
          ) {
            isUpdate = true;

            promises.push(
              api.put(
                `/schedules/${existingFirst._id}`,
                {
                  ...existingFirst,
                  driver: selectedFirst,
                }
              )
            );
          }
        }

        // 2. Second Shift
        if (!selectedSecond) {
          if (existingSecond) {
            promises.push(
              api.delete(
                `/schedules/${existingSecond._id}`
              )
            );
          }
        } else {
          if (!existingSecond) {
            isCreate = true;

            promises.push(
              api.post("/schedules", {
                driver: selectedSecond,
                unit: unitId,
                shiftDate: selectedDate,
                shiftType: "Second Shift",
                shiftStart: "13:00",
                shiftEnd: "21:00",
                route: unitRoute,
              })
            );
          } else if (
            (existingSecond.driver?._id ||
              existingSecond.driver) !==
            selectedSecond
          ) {
            isUpdate = true;

            promises.push(
              api.put(
                `/schedules/${existingSecond._id}`,
                {
                  ...existingSecond,
                  driver: selectedSecond,
                }
              )
            );
          }
        }

        if (promises.length > 0) {
          await Promise.all(promises);

          if (isUpdate) {
            toast.success(
              "✔ Assignment updated successfully."
            );
          } else if (isCreate) {
            toast.success(
              "✔ Assignment saved successfully."
            );
          } else {
            toast.success(
              "✔ Assignment removed successfully."
            );
          }

          await fetchBoardData();

          setSavedStatuses((prev) => ({
            ...prev,
            [unitId]: true,
          }));

          setTimeout(() => {
            setSavedStatuses((prev) => ({
              ...prev,
              [unitId]: false,
            }));
          }, 2000);
        } else {
          toast.success(
            "No changes to save"
          );
        }
      } catch (err) {
        console.error(err);

        toast.error(
          err?.response?.data?.message ||
            err.message ||
            "Failed to save assignments"
        );
      } finally {
        setSavingUnitId(null);
      }
    },
    [
      dropdownStates,
      units,
      dbStateForUnit,
      selectedDate,
      fetchBoardData,
      drivers,
    ]
  );

  // Trigger Confirmation Modal for Saved Assignment Delete
  const handleTriggerDelete = useCallback(
    (scheduleId, unitId, shiftType) => {
      setConfirmDelete({
        isOpen: true,
        scheduleId,
        unitId,
        shiftType,
      });
    },
    []
  );

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    const { scheduleId } =
      confirmDelete;

    if (!scheduleId) return;

    try {
      await api.delete(
        `/schedules/${scheduleId}`
      );

      toast.success(
        "✔ Assignment removed successfully."
      );

      setConfirmDelete({
        isOpen: false,
        scheduleId: null,
        unitId: null,
        shiftType: null,
      });

      await fetchBoardData();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Failed to remove assignment"
      );
    }
  };

  // Trigger Details Modal for Saved Schedule
  const handleTriggerDetails = useCallback(
    (unit, dbState) => {
      setDetailsModal({
        isOpen: true,
        unit,
        dbState,
      });
    },
    []
  );

  // Group units dynamically by route
  const groupedUnits = ROUTES.reduce(
    (acc, route) => {
      acc[route] = units.filter(
        (u) =>
          getRouteForUnit(u.bodyNumber) ===
          route
      );

      return acc;
    },
    {}
  );

  const isBoardLoading =
    initialLoading || loading;

  return (
    <div className="space-y-7">
      {/* Header Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
              Daily Dispatch Scheduling Board
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-black uppercase tracking-wider whitespace-nowrap">
                Select Date:
              </label>

              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                  className="border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20"
                />

                <Calendar
                  size={16}
                  className="absolute right-3 text-black pointer-events-none z-10"
                />
              </div>
            </div>

            <button
              onClick={() =>
                setIsCreateModalOpen(
                  true
                )
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95 hover:shadow-md"
            >
              + Create Schedule
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-black rounded-lg p-4 text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}

      {isBoardLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 bg-slate-200/40 rounded-xl border border-slate-200"
                ></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Dispatch Board Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {ROUTES.map((route) => {
            const routeUnits =
              groupedUnits[route] || [];

            return (
              <div
                key={route}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[520px]"
              >
                {/* Column Header */}
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <span className="text-sm font-bold text-black tracking-wider">
                    {route}
                  </span>

                  <span className="text-xs bg-slate-200 text-black font-bold px-2.5 py-1 rounded-full">
                    {routeUnits.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[70vh]">
                  {routeUnits.length === 0 ? (
                    <div className="text-center py-10 text-sm text-black font-medium italic">
                      No units assigned
                    </div>
                  ) : (
                    routeUnits.map((unit) => {
                      const uState =
                        dropdownStates[
                          unit._id
                        ] || {
                          firstShiftDriver:
                            "",
                          secondShiftDriver:
                            "",
                        };

                      const dbState =
                        dbStateForUnit[
                          unit._id
                        ] || {
                          firstShiftDriver:
                            "",
                          secondShiftDriver:
                            "",
                          firstShiftScheduleId:
                            null,
                          secondShiftScheduleId:
                            null,
                        };

                      return (
                        <UnitCard
                          key={unit._id}
                          unit={unit}
                          drivers={drivers}
                          uState={uState}
                          dbState={dbState}
                          onDriverChange={
                            handleDriverChange
                          }
                          onSave={
                            handleSaveAssignment
                          }
                          isSaving={
                            savingUnitId ===
                            unit._id
                          }
                          isSaved={
                            !!savedStatuses[
                              unit._id
                            ]
                          }
                          onTriggerDelete={
                            handleTriggerDelete
                          }
                          onTriggerDetails={
                            handleTriggerDetails
                          }
                          allAssignedDrivers={
                            allAssignedDrivers
                          }
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Schedules History List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-black uppercase tracking-wider mb-5 pb-3 border-b border-slate-200">
          Recent Schedules
        </h2>

        {recentDates.length === 0 ? (
          <p className="text-sm text-black italic">
            No recent schedules found.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {recentDates.map((d) => (
              <button
                key={d}
                onClick={() =>
                  setSelectedDate(d)
                }
                className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  selectedDate === d
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-black border-slate-300 hover:bg-slate-100"
                }`}
              >
                {formatDate(d)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Details Modal */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-black uppercase tracking-wider">
                Assignment Details — Unit{" "}
                {detailsModal.unit?.bodyNumber}
              </h2>

              <button
                className="text-sm text-black hover:text-blue-600 font-semibold transition-colors duration-150 focus:outline-none"
                onClick={() =>
                  setDetailsModal({
                    isOpen: false,
                    unit: null,
                    dbState: null,
                  })
                }
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-md text-blue-600"></span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Unit & Route Info */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-black uppercase tracking-wider">
                      Unit Number
                    </span>

                    <span className="text-sm font-semibold text-black">
                      {detailsModal.unit?.bodyNumber}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-black uppercase tracking-wider">
                      Route
                    </span>

                    <span className="text-sm font-semibold text-black">
                      {getRouteForUnit(
                        detailsModal.unit?.bodyNumber
                      ) ||
                        detailsModal.unit?.route ||
                        "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* First Shift Detail */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                    First Shift (05:00 - 13:00)
                  </h3>

                  {firstShiftDetail ? (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Assigned Driver
                        </span>

                        <span className="font-semibold text-black">
                          {firstShiftDetail.driver
                            ? `${firstShiftDetail.driver.firstName} ${firstShiftDetail.driver.lastName}`
                            : "Unknown"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Assigned By
                        </span>

                        <span className="font-medium text-black">
                          {firstShiftDetail.assignedBy
                            ? firstShiftDetail.assignedBy.firstName
                              ? `${firstShiftDetail.assignedBy.firstName} ${firstShiftDetail.assignedBy.lastName}`
                              : firstShiftDetail.assignedBy.username ||
                                firstShiftDetail.assignedBy.email
                            : "System"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Remarks
                        </span>

                        <span className="font-medium text-black">
                          {firstShiftDetail.remarks ||
                            "No remarks"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Created At
                        </span>

                        <span className="font-medium text-black">
                          {formatTimestamp(
                            firstShiftDetail.createdAt
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Updated At
                        </span>

                        <span className="font-medium text-black">
                          {formatTimestamp(
                            firstShiftDetail.updatedAt
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-black italic">
                      No assignment saved for First Shift on this date.
                    </p>
                  )}
                </div>

                {/* Second Shift Detail */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                    Second Shift (13:00 - 21:00)
                  </h3>

                  {secondShiftDetail ? (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Assigned Driver
                        </span>

                        <span className="font-semibold text-black">
                          {secondShiftDetail.driver
                            ? `${secondShiftDetail.driver.firstName} ${secondShiftDetail.driver.lastName}`
                            : "Unknown"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Assigned By
                        </span>

                        <span className="font-medium text-black">
                          {secondShiftDetail.assignedBy
                            ? secondShiftDetail.assignedBy.firstName
                              ? `${secondShiftDetail.assignedBy.firstName} ${secondShiftDetail.assignedBy.lastName}`
                              : secondShiftDetail.assignedBy.username ||
                                secondShiftDetail.assignedBy.email
                            : "System"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Remarks
                        </span>

                        <span className="font-medium text-black">
                          {secondShiftDetail.remarks ||
                            "No remarks"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Created At
                        </span>

                        <span className="font-medium text-black">
                          {formatTimestamp(
                            secondShiftDetail.createdAt
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-black uppercase tracking-wider">
                          Updated At
                        </span>

                        <span className="font-medium text-black">
                          {formatTimestamp(
                            secondShiftDetail.updatedAt
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-black italic">
                      No assignment saved for Second Shift on this date.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black text-sm font-semibold rounded-lg border border-slate-300 transition-all duration-150 active:scale-95"
                onClick={() =>
                  setDetailsModal({
                    isOpen: false,
                    unit: null,
                    dbState: null,
                  })
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-2">
              Remove Assignment
            </h3>

            <p className="text-sm text-black mb-6">
              Remove this assignment?
            </p>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={() =>
                  setConfirmDelete({
                    isOpen: false,
                    scheduleId: null,
                    unitId: null,
                    shiftType: null,
                  })
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black text-sm font-semibold rounded-lg border border-slate-300 transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        drivers={drivers}
        units={units}
        onSuccess={() => {
          toast.success(
            "Schedule created successfully"
          );

          setIsCreateModalOpen(false);
          fetchBoardData();
        }}
      />
    </div>
  );
};

export default SchedulingBoard;
