import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Bookmark,
  Trash2,
  Users,
  Clock,
  Layers,
  Filter,
  Command,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bell,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useScheduleApi } from "../../lib/scheduleApi";
import api from "../../lib/axios";

import {
  ROUTES,
  ROUTE_COLORS,
  SHIFT_TIMES,
  getMondayOfWeek,
  getDaysOfWeek,
  formatWeekRangeLabel,
  formatDateFriendly,
  getRouteForUnit,
  getRouteConfig
} from "../../components/schedules/scheduleConstants";

import AssignmentPopover from "../../components/schedules/AssignmentPopover";
import ScheduleHistoryDrawer from "../../components/schedules/ScheduleHistoryDrawer";
import DriverHistoryDrawer from "../../components/schedules/DriverHistoryDrawer";
import AddUnitToRouteModal from "../../components/schedules/AddUnitToRouteModal";
import AddNewRouteModal from "../../components/schedules/AddNewRouteModal";
import CommandPalette from "../../components/schedules/CommandPalette";

import RoutesOverviewView from "../../components/schedules/views/RoutesOverviewView";
import RouteDetailView from "../../components/schedules/views/RouteDetailView";
import WeekSummaryRouteView from "../../components/schedules/views/WeekSummaryRouteView";

/**
 * SchedulingBoard: Route-Focused Progressive Disclosure
 * Level 1: Routes Overview (Default summary grid)
 * Level 2: Route Detail (Single route unit & shift table)
 * Level 3: Assignment Popover (Driver dispatch & conflict check)
 * Level 4: Week Summary (One route x 7 days)
 */
const SchedulingBoard = () => {
  const {
    getSchedules,
    getSingleSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useScheduleApi();

  // Core date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Current active week start for Week Summary (Monday)
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() => {
    return getMondayOfWeek(new Date());
  });

  // Custom Routes (stored in localStorage)
  const [customRoutes, setCustomRoutes] = useState(() => {
    try {
      const stored = localStorage.getItem("CTMS_CUSTOM_ROUTES");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // All active routes (Default + Custom)
  const allRoutes = useMemo(() => {
    const customKeys = Object.keys(customRoutes);
    return [...ROUTES, ...customKeys.filter((k) => !ROUTES.includes(k))];
  }, [customRoutes]);

  // Modals & Slide-over Drawers state
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [addUnitTargetRoute, setAddUnitTargetRoute] = useState("LANGGAM");
  const [isAddNewRouteModalOpen, setIsAddNewRouteModalOpen] = useState(false);
  const [historyDriver, setHistoryDriver] = useState(null);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);

  // Progressive Disclosure Navigation
  // activeTab: 'ROUTES' (Level 1 / 2) | 'WEEK_SUMMARY' (Level 4)
  const [activeTab, setActiveTab] = useState("ROUTES");
  // selectedRouteKey: null (Level 1: Routes Overview) | string e.g. "LANGGAM" (Level 2: Route Detail)
  const [selectedRouteKey, setSelectedRouteKey] = useState(null);

  // Filters
  const [routeFilter, setRouteFilter] = useState("ALL");
  const [shiftFilter, setShiftFilter] = useState("ALL");

  // Data state
  const [units, setUnits] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Draft mode for UI changes
  const [pendingChanges, setPendingChanges] = useState({});

  const displaySchedules = useMemo(() => {
    let current = [...schedules];
    
    // Apply pending deletes
    current = current.filter(s => {
      const sUnit = s.unit?._id || s.unit;
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0,10) : "";
      const key = `${sUnit}_${s.shiftType}_${sDate}`;
      return !(pendingChanges[key] && pendingChanges[key].status === 'DELETED');
    });

    // Apply pending adds and updates
    Object.values(pendingChanges).forEach(pc => {
      if (pc.status === 'DELETED') return;

      const existingIdx = current.findIndex(s => {
        const sUnit = s.unit?._id || s.unit;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0,10) : "";
        return sUnit === pc.unitId && s.shiftType === pc.shiftType && sDate === pc.dateStr;
      });

      const updatedRecord = {
        _id: pc.scheduleId || `draft_${pc.unitId}_${pc.shiftType}`,
        driver: drivers.find(d => d._id === pc.driverId),
        unit: units.find(u => u._id === pc.unitId),
        shiftType: pc.shiftType,
        shiftDate: pc.dateStr,
        route: pc.route,
        isDraft: true,
      };

      if (existingIdx !== -1) {
        current[existingIdx] = { ...current[existingIdx], ...updatedRecord };
      } else {
        current.push(updatedRecord);
      }
    });

    return current;
  }, [schedules, pendingChanges, drivers, units]);

  // Undo Stack (up to 10 historical operations)
  const [undoStack, setUndoStack] = useState([]);

  // Assignment Popover (Level 3) state
  const [isAssignPopoverOpen, setIsAssignPopoverOpen] = useState(false);
  const [assignPopoverData, setAssignPopoverData] = useState({});

  // Unit Schedule History Slide-over Drawer state
  const [historyDrawerUnit, setHistoryDrawerUnit] = useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Command palette modal
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Saved templates in localStorage
  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem("CTMS_SCHEDULE_TEMPLATES");
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: "tpl-default-1",
              name: "Regular Monday Fleet",
              createdAt: new Date().toISOString(),
              assignments: [],
            },
          ];
    } catch {
      return [];
    }
  });

  const socketRef = useRef(null);

  // 1. Fetch initial Units & Drivers
  useEffect(() => {
    let isMounted = true;
    const fetchResources = async () => {
      try {
        const [unitsRes, driversRes] = await Promise.all([
          api.get("/units?limit=100"),
          api.get("/drivers?limit=100"),
        ]);
        if (isMounted) {
          setUnits(unitsRes.data.units || unitsRes.data || []);
          setDrivers(driversRes.data.drivers || driversRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load resources:", err);
      }
    };
    fetchResources();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Schedules (Non-destructive, silent background sync)
  const fetchSchedules = useCallback(
    async (isBackground = false) => {
      try {
        if (isBackground) {
          setIsSyncing(true);
        }
        const res = await getSchedules({ limit: 500 });
        const data = res.schedules || res || [];
        setSchedules(data);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      } finally {
        if (isBackground) {
          setIsSyncing(false);
        } else {
          setInitialLoading(false);
        }
      }
    },
    [getSchedules]
  );

  useEffect(() => {
    fetchSchedules(false);
  }, [fetchSchedules]);

  // Keep a stable ref to fetchSchedules to avoid socket churn
  const fetchSchedulesRef = useRef(fetchSchedules);
  useEffect(() => {
    fetchSchedulesRef.current = fetchSchedules;
  }, [fetchSchedules]);

  // 3. Socket.IO Real-time Synchronization
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    let debounceTimer = null;
    const debouncedSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (fetchSchedulesRef.current) {
          fetchSchedulesRef.current(true);
        }
      }, 300);
    };

    socket.on("scheduleCreated", debouncedSync);
    socket.on("scheduleUpdated", debouncedSync);
    socket.on("scheduleDeleted", debouncedSync);
    socket.on("scheduleEvent", debouncedSync);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      socket.disconnect();
    };
  }, []);

  // Undo helper
  const pushUndoAction = (action) => {
    setUndoStack((prev) => [action, ...prev.slice(0, 9)]);
  };

  // Undo Last Action
  const handleUndo = async () => {
    if (undoStack.length === 0) {
      toast("No actions to undo", { icon: "ℹ️" });
      return;
    }

    const [lastAction, ...remaining] = undoStack;
    setUndoStack(remaining);

    try {
      if (lastAction.type === "CREATE") {
        await deleteSchedule(lastAction.scheduleId);
        toast.success("Undid assignment creation.", { icon: "↩️" });
      } else if (lastAction.type === "DELETE") {
        const s = lastAction.prevSchedule;
        const shiftTimes = SHIFT_TIMES[s.shiftType] || SHIFT_TIMES["First Shift"];
        await createSchedule({
          driver: s.driver?._id || s.driver,
          unit: s.unit?._id || s.unit,
          shiftDate: s.shiftDate,
          shiftType: s.shiftType,
          shiftStart: shiftTimes.start,
          shiftEnd: shiftTimes.end,
          route: s.route,
        });
        toast.success("Restored deleted assignment.", { icon: "↩️" });
      } else if (lastAction.type === "UPDATE") {
        await updateSchedule(lastAction.prevSchedule._id, {
          driver: lastAction.prevSchedule.driver?._id || lastAction.prevSchedule.driver,
          unit: lastAction.prevSchedule.unit?._id || lastAction.prevSchedule.unit,
          shiftDate: lastAction.prevSchedule.shiftDate,
          shiftType: lastAction.prevSchedule.shiftType,
          route: lastAction.prevSchedule.route,
        });
        toast.success("Reverted assignment update.", { icon: "↩️" });
      }

      await fetchSchedules(true);
    } catch (err) {
      console.error("Undo failed:", err);
      toast.error("Failed to revert action.");
    }
  };

  // Stage Assignment (Draft Mode)
  const handleStageAssignment = ({
    unitId,
    driverId,
    dateStr,
    shiftType,
    route,
    existingScheduleId,
    reassignScheduleId,
  }) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      const key = `${unitId}_${shiftType}_${dateStr}`;
      
      if (reassignScheduleId) {
         const oldS = schedules.find(s => s._id === reassignScheduleId);
         if (oldS) {
            const oldDate = oldS.shiftDate ? new Date(oldS.shiftDate).toISOString().slice(0,10) : "";
            const oldUnit = oldS.unit?._id || oldS.unit;
            const oldKey = `${oldUnit}_${oldS.shiftType}_${oldDate}`;
            next[oldKey] = { status: 'DELETED', scheduleId: oldS._id, unitId: oldUnit, shiftType: oldS.shiftType, dateStr: oldDate };
         }
      }

      next[key] = {
        unitId,
        driverId,
        dateStr,
        shiftType,
        route,
        scheduleId: existingScheduleId,
        status: existingScheduleId ? 'UPDATED' : 'ADDED',
      };
      return next;
    });
    setIsAssignPopoverOpen(false);
  };

  // Drag and Drop Swapping / Assigning
  const handleSwapOrAssign = (sourceData, targetData) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      
      const sDate = sourceData.sourceDateStr || selectedDate;
      const tDate = targetData.targetDateStr || selectedDate;

      const sKey = `${sourceData.sourceUnitId}_${sourceData.sourceShiftType}_${sDate}`;
      const tKey = `${targetData.targetUnitId}_${targetData.targetShiftType}_${tDate}`;

      const targetSchedule = displaySchedules.find(s => {
         const sUnit = s.unit?._id || s.unit;
         return sUnit === targetData.targetUnitId && s.shiftType === targetData.targetShiftType && new Date(s.shiftDate).toISOString().slice(0,10) === tDate;
      });
      const targetDriverId = targetSchedule?.driver?._id;

      if (targetDriverId) {
         next[sKey] = {
            unitId: sourceData.sourceUnitId,
            shiftType: sourceData.sourceShiftType,
            dateStr: sDate,
            route: getRouteForUnit(units.find(u => u._id === sourceData.sourceUnitId)?.bodyNumber),
            driverId: targetDriverId,
            scheduleId: sourceData.sourceScheduleId,
            status: sourceData.sourceScheduleId ? 'UPDATED' : 'ADDED'
         };

         next[tKey] = {
            unitId: targetData.targetUnitId,
            shiftType: targetData.targetShiftType,
            dateStr: tDate,
            route: getRouteForUnit(units.find(u => u._id === targetData.targetUnitId)?.bodyNumber),
            driverId: sourceData.sourceDriverId,
            scheduleId: targetData.targetScheduleId,
            status: targetData.targetScheduleId ? 'UPDATED' : 'ADDED'
         };
      } else {
         next[sKey] = {
            unitId: sourceData.sourceUnitId,
            shiftType: sourceData.sourceShiftType,
            dateStr: sDate,
            scheduleId: sourceData.sourceScheduleId,
            status: 'DELETED'
         };

         next[tKey] = {
            unitId: targetData.targetUnitId,
            shiftType: targetData.targetShiftType,
            dateStr: tDate,
            route: getRouteForUnit(units.find(u => u._id === targetData.targetUnitId)?.bodyNumber),
            driverId: sourceData.sourceDriverId,
            scheduleId: targetData.targetScheduleId,
            status: targetData.targetScheduleId ? 'UPDATED' : 'ADDED'
         };
      }
      return next;
    });
  };

  // Stage Remove Assignment
  const handleStageRemoveAssignment = (scheduleId) => {
    const s = displaySchedules.find(x => x._id === scheduleId);
    if (!s) return;
    
    const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0,10) : "";
    const sUnitId = s.unit?._id || s.unit;
    
    setPendingChanges(prev => {
       const next = { ...prev };
       const key = `${sUnitId}_${s.shiftType}_${sDate}`;
       if (s.isDraft && s.status === 'ADDED') {
          delete next[key];
       } else {
          next[key] = {
             status: 'DELETED',
             scheduleId: s._id,
             unitId: sUnitId,
             shiftType: s.shiftType,
             dateStr: sDate
          };
       }
       return next;
    });
    setIsAssignPopoverOpen(false);
  };

  // Commit All Draft Changes
  const handleCommitChanges = async () => {
    setIsActionSubmitting(true);
    let successCount = 0;
    
    try {
      const ops = Object.values(pendingChanges);
      for (const pc of ops) {
        if (pc.status === 'DELETED' && pc.scheduleId && !pc.scheduleId.startsWith('draft')) {
          await deleteSchedule(pc.scheduleId);
          successCount++;
        } else if (pc.status === 'UPDATED' && pc.scheduleId && !pc.scheduleId.startsWith('draft')) {
          const shiftTimes = SHIFT_TIMES[pc.shiftType] || SHIFT_TIMES["First Shift"];
          await updateSchedule(pc.scheduleId, {
            driver: pc.driverId,
            unit: pc.unitId,
            shiftDate: pc.dateStr,
            shiftType: pc.shiftType,
            shiftStart: shiftTimes.start,
            shiftEnd: shiftTimes.end,
            route: pc.route,
          });
          successCount++;
        } else if (pc.status === 'ADDED') {
          const shiftTimes = SHIFT_TIMES[pc.shiftType] || SHIFT_TIMES["First Shift"];
          await createSchedule({
            driver: pc.driverId,
            unit: pc.unitId,
            shiftDate: pc.dateStr,
            shiftType: pc.shiftType,
            shiftStart: shiftTimes.start,
            shiftEnd: shiftTimes.end,
            route: pc.route,
          });
          successCount++;
        }
      }
      toast.success(`Successfully saved ${successCount} changes and notified drivers.`, { icon: "✅" });
      setPendingChanges({});
      await fetchSchedules(true);
    } catch (err) {
      console.error("Failed to commit changes:", err);
      toast.error("Some changes failed to save.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Bulk: Copy from Yesterday for Route
  const handleCopyFromYesterday = async (routeKey) => {
    setIsActionSubmitting(true);
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().slice(0, 10);

    const routeUnits = units.filter(
      (u) => getRouteForUnit(u.bodyNumber, u.route) === routeKey
    );
    const unitIds = new Set(routeUnits.map((u) => u._id));

    // Find valid assignments on yesterday
    const yesterdaySchedules = schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      const sDriverId = s.driver?._id || s.driver;
      return sDate === yesterdayStr && unitIds.has(sUnitId) && sDriverId;
    });

    if (yesterdaySchedules.length === 0) {
      toast(`No assignments found on ${formatDateFriendly(yesterdayStr)} to copy.`, {
        icon: "ℹ️",
      });
      setIsActionSubmitting(false);
      return;
    }

    let copiedCount = 0;
    try {
      for (const s of yesterdaySchedules) {
        const uId = s.unit?._id || s.unit;
        const dId = s.driver?._id || s.driver;
        const shiftTimes = SHIFT_TIMES[s.shiftType] || SHIFT_TIMES["First Shift"];

        // Check if slot already has assignment on selectedDate
        const alreadyExists = schedules.some((ex) => {
          const exDate = ex.shiftDate ? new Date(ex.shiftDate).toISOString().slice(0, 10) : "";
          const exUnitId = ex.unit?._id || ex.unit;
          return exDate === selectedDate && exUnitId === uId && ex.shiftType === s.shiftType;
        });

        if (!alreadyExists) {
          try {
            const res = await createSchedule({
              driver: dId,
              unit: uId,
              shiftDate: selectedDate,
              shiftType: s.shiftType,
              shiftStart: shiftTimes.start,
              shiftEnd: shiftTimes.end,
              route: s.route || routeKey,
            });
            pushUndoAction({
              type: "CREATE",
              scheduleId: (res.schedule || res)._id,
            });
            copiedCount++;
          } catch {
            // ignore individual conflict
          }
        }
      }

      toast.success(
        `Copied ${copiedCount} assignments from yesterday (${formatDateFriendly(yesterdayStr)})!`,
        { icon: "📋" }
      );
      await fetchSchedules(true);
    } catch (err) {
      console.error("Failed to copy from yesterday:", err);
      toast.error("Failed to copy assignments.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Bulk: Copy from Last Week for Route
  const handleCopyFromLastWeek = async (routeKey) => {
    setIsActionSubmitting(true);
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    const lastWeekStr = d.toISOString().slice(0, 10);

    const routeUnits = units.filter(
      (u) => getRouteForUnit(u.bodyNumber, u.route) === routeKey
    );
    const unitIds = new Set(routeUnits.map((u) => u._id));

    const lastWeekSchedules = schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      const sDriverId = s.driver?._id || s.driver;
      return sDate === lastWeekStr && unitIds.has(sUnitId) && sDriverId;
    });

    if (lastWeekSchedules.length === 0) {
      toast(`No assignments found on ${formatDateFriendly(lastWeekStr)} to copy.`, {
        icon: "ℹ️",
      });
      setIsActionSubmitting(false);
      return;
    }

    let copiedCount = 0;
    try {
      for (const s of lastWeekSchedules) {
        const uId = s.unit?._id || s.unit;
        const dId = s.driver?._id || s.driver;
        const shiftTimes = SHIFT_TIMES[s.shiftType] || SHIFT_TIMES["First Shift"];

        const alreadyExists = schedules.some((ex) => {
          const exDate = ex.shiftDate ? new Date(ex.shiftDate).toISOString().slice(0, 10) : "";
          const exUnitId = ex.unit?._id || ex.unit;
          return exDate === selectedDate && exUnitId === uId && ex.shiftType === s.shiftType;
        });

        if (!alreadyExists) {
          try {
            const res = await createSchedule({
              driver: dId,
              unit: uId,
              shiftDate: selectedDate,
              shiftType: s.shiftType,
              shiftStart: shiftTimes.start,
              shiftEnd: shiftTimes.end,
              route: s.route || routeKey,
            });
            pushUndoAction({
              type: "CREATE",
              scheduleId: (res.schedule || res)._id,
            });
            copiedCount++;
          } catch {}
        }
      }

      toast.success(
        `Copied ${copiedCount} assignments from same day last week (${formatDateFriendly(lastWeekStr)})!`,
        { icon: "✨" }
      );
      await fetchSchedules(true);
    } catch (err) {
      console.error("Failed to copy from last week:", err);
      toast.error("Failed to copy assignments.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Bulk: Clear Day for Route
  const handleClearDay = async (routeKey) => {
    setIsActionSubmitting(true);
    const routeUnits = units.filter(
      (u) => getRouteForUnit(u.bodyNumber, u.route) === routeKey
    );
    const unitIds = new Set(routeUnits.map((u) => u._id));

    const daySchedules = schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      return sDate === selectedDate && unitIds.has(sUnitId);
    });

    try {
      for (const s of daySchedules) {
        await deleteSchedule(s._id);
        pushUndoAction({
          type: "DELETE",
          prevSchedule: s,
        });
      }

      toast.success(`Cleared ${daySchedules.length} assignments.`, {
        icon: "🗑️",
      });
      await fetchSchedules(true);
    } catch (err) {
      console.error("Failed to clear day:", err);
      toast.error("Failed to clear assignments.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Bulk: Save Template
  const handleSaveTemplate = (name) => {
    const routeUnits = selectedRouteKey
      ? units.filter((u) => getRouteForUnit(u.bodyNumber, u.route) === selectedRouteKey)
      : units;
    const unitIds = new Set(routeUnits.map((u) => u._id));

    const targetSchedules = schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      return sDate === selectedDate && unitIds.has(sUnitId) && (s.driver?._id || s.driver);
    });

    const newTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      routeKey: selectedRouteKey || "ALL",
      createdAt: new Date().toISOString(),
      assignments: targetSchedules.map((s) => ({
        unitId: s.unit?._id || s.unit,
        driverId: s.driver?._id || s.driver,
        shiftType: s.shiftType,
        route: s.route || selectedRouteKey,
      })),
    };

    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    try {
      localStorage.setItem("CTMS_SCHEDULE_TEMPLATES", JSON.stringify(updated));
    } catch {}

    toast.success(`Template "${name}" saved!`, { icon: "🔖" });
  };

  // Bulk: Apply Template
  const handleApplyTemplate = async (templateId) => {
    const tpl = savedTemplates.find((t) => t.id === templateId);
    if (!tpl || !tpl.assignments) return;

    setIsActionSubmitting(true);
    let appliedCount = 0;

    try {
      for (const item of tpl.assignments) {
        const shiftTimes = SHIFT_TIMES[item.shiftType] || SHIFT_TIMES["First Shift"];
        try {
          const res = await createSchedule({
            driver: item.driverId,
            unit: item.unitId,
            shiftDate: selectedDate,
            shiftType: item.shiftType,
            shiftStart: shiftTimes.start,
            shiftEnd: shiftTimes.end,
            route: item.route || selectedRouteKey,
          });
          pushUndoAction({
            type: "CREATE",
            scheduleId: (res.schedule || res)._id,
          });
          appliedCount++;
        } catch {}
      }

      toast.success(`Applied template (${appliedCount} shifts created)`, { icon: "🎉" });
      await fetchSchedules(true);
    } catch (err) {
      console.error("Failed to apply template:", err);
      toast.error("Failed to apply template.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Open Add Unit Modal
  const handleOpenAddUnitModal = (targetRoute) => {
    setAddUnitTargetRoute(targetRoute || selectedRouteKey || allRoutes[0] || "LANGGAM");
    setIsAddUnitModalOpen(true);
  };

  // Add Units to Route (Updates unit's assigned route)
  const handleAddUnitsToRoute = async (routeKey, unitsToAdd) => {
    const targetConfig = getRouteConfig(routeKey, customRoutes);
    setIsActionSubmitting(true);
    try {
      // Optimistically update units in state
      setUnits((prev) =>
        prev.map((u) => {
          const matching = unitsToAdd.find((add) => add._id === u._id);
          return matching ? { ...u, route: routeKey } : u;
        })
      );

      // Sync each unit to backend
      await Promise.allSettled(
        unitsToAdd.map((u) =>
          api.put(`/units/${u._id}`, { route: routeKey })
        )
      );

      toast.success(
        `${unitsToAdd.length} ${unitsToAdd.length === 1 ? "unit" : "units"} added to ${targetConfig.name} route`,
        { icon: "🚐" }
      );
      setIsAddUnitModalOpen(false);
    } catch (err) {
      console.error("Failed to add units to route:", err);
      toast.error("Failed to update unit route assignment.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Create New Route
  const handleCreateNewRoute = ({ name, hex, colorName, description }) => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const updated = {
      ...customRoutes,
      [key]: { name, hex, colorName, description },
    };
    setCustomRoutes(updated);
    try {
      localStorage.setItem("CTMS_CUSTOM_ROUTES", JSON.stringify(updated));
    } catch {}

    toast.success(`Route "${name}" created!`, { icon: "🛣️" });
    setIsAddNewRouteModalOpen(false);
  };

  // Remove Unit from Route (unassigns route, unit remains in system)
  const handleRemoveUnitFromRoute = async (unitId, routeKey) => {
    const targetConfig = getRouteConfig(routeKey, customRoutes);
    setUnits((prev) =>
      prev.map((u) => (u._id === unitId ? { ...u, route: "UNASSIGNED" } : u))
    );
    try {
      await api.put(`/units/${unitId}`, { route: "UNASSIGNED" });
      toast.success(`Unit removed from ${targetConfig.name}`, { icon: "ℹ️" });
    } catch (err) {
      console.error("Failed to remove unit from route:", err);
      toast.error("Failed to update unit route.");
    }
  };

  // Bulk: Remove Units from Route
  const handleBulkRemoveUnitsFromRoute = async (unitIds, routeKey) => {
    const targetConfig = getRouteConfig(routeKey, customRoutes);
    const idSet = new Set(unitIds);
    setUnits((prev) =>
      prev.map((u) => (idSet.has(u._id) ? { ...u, route: "UNASSIGNED" } : u))
    );
    try {
      await Promise.allSettled(
        unitIds.map((id) => api.put(`/units/${id}`, { route: "UNASSIGNED" }))
      );
      toast.success(
        `${unitIds.length} units removed from ${targetConfig.name}`,
        { icon: "ℹ️" }
      );
    } catch (err) {
      console.error("Bulk remove failed:", err);
      toast.error("Failed to remove units.");
    }
  };

  // Bulk: Clear Assignments for Specific Units on a Date
  const handleBulkClearAssignments = async (unitIds, dateStr) => {
    const idSet = new Set(unitIds);
    const targetSchedules = schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      return sDate === dateStr && idSet.has(sUnitId);
    });

    if (targetSchedules.length === 0) {
      toast("No active assignments to clear for selected units.", { icon: "ℹ️" });
      return;
    }

    setIsActionSubmitting(true);
    try {
      for (const s of targetSchedules) {
        await deleteSchedule(s._id);
        pushUndoAction({
          type: "DELETE",
          prevSchedule: s,
        });
      }
      toast.success(`Cleared ${targetSchedules.length} assignments.`, {
        icon: "🗑️",
      });
      await fetchSchedules(true);
    } catch (err) {
      console.error("Bulk clear failed:", err);
      toast.error("Failed to clear assignments.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Open Driver History Slide-Over
  const handleOpenDriverHistory = (driver) => {
    setHistoryDriver(driver);
    setIsDriverHistoryOpen(true);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isAssignPopoverOpen) {
          setIsAssignPopoverOpen(false);
        } else if (isHistoryDrawerOpen) {
          setIsHistoryDrawerOpen(false);
        } else if (isDriverHistoryOpen) {
          setIsDriverHistoryOpen(false);
        } else if (isAddUnitModalOpen) {
          setIsAddUnitModalOpen(false);
        } else if (isAddNewRouteModalOpen) {
          setIsAddNewRouteModalOpen(false);
        } else if (selectedRouteKey) {
          setSelectedRouteKey(null);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    isAssignPopoverOpen,
    isHistoryDrawerOpen,
    isDriverHistoryOpen,
    isAddUnitModalOpen,
    isAddNewRouteModalOpen,
    selectedRouteKey,
  ]);

  // Unassigned slots count across today's schedule
  const unassignedSlotsCount = useMemo(() => {
    let unassigned = 0;
    units.forEach((u) => {
      const isMaint =
        u.status === "Under Maintenance" ||
        u.status === "Maintenance" ||
        u.maintenanceStatus === "Maintenance";
      if (isMaint) return;

      const first = displaySchedules.find((s) => {
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        const sUnitId = s.unit?._id || s.unit;
        return sDate === selectedDate && sUnitId === u._id && s.shiftType === "First Shift";
      });

      const second = displaySchedules.find((s) => {
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        const sUnitId = s.unit?._id || s.unit;
        return sDate === selectedDate && sUnitId === u._id && s.shiftType === "Second Shift";
      });

      if (!first || (!first.driver?._id && !first.driver)) unassigned++;
      if (!second || (!second.driver?._id && !second.driver)) unassigned++;
    });
    return unassigned;
  }, [units, displaySchedules, selectedDate]);

  // Jump to Today
  const handleJumpToToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Header (Above toolbar, matching other pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>SPTC</span>
            <span className="opacity-50">/</span>
            <span>Fleet Operations</span>
            <span className="opacity-50">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Scheduling</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Scheduling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Route-focused progressive disclosure dispatch system
          </p>
        </div>
      </div>

      {/* Toolbar Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Date Picker & Quick Today Button */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDate(val);
              setCurrentWeekStartDate(getMondayOfWeek(val));
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
          />

          {!isToday && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-900/40 transition"
            >
              Today
            </button>
          )}

          {/* Syncing Indicator */}
          {isSyncing && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 animate-pulse">
              <RotateCcw className="w-3 h-3 animate-spin" />
              <span className="hidden md:inline">Syncing</span>
            </div>
          )}
        </div>

        {/* Right: Filters, View Toggle, Bell Alert, Undo & Add Unit Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Route Filter Dropdown */}
          <select
            value={routeFilter}
            onChange={(e) => {
              const val = e.target.value;
              setRouteFilter(val);
              if (val !== "ALL") {
                setSelectedRouteKey(val);
              } else {
                setSelectedRouteKey(null);
              }
            }}
            className="text-xs sm:text-sm font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value="ALL">All Routes</option>
            {allRoutes.map((rk) => (
              <option key={rk} value={rk}>
                {getRouteConfig(rk, customRoutes).name}
              </option>
            ))}
          </select>

          {/* Shift Filter Dropdown */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="text-xs sm:text-sm font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value="ALL">All Shifts</option>
            <option value="First Shift">First Shift</option>
            <option value="Second Shift">Second Shift</option>
          </select>

          {/* View Toggle [Routes] [Week Summary] (Positioned after shifts) */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-750 p-1 gap-1 shadow-2xs">
            <button
              type="button"
              title="Routes Overview"
              aria-label="Routes Overview"
              onClick={() => {
                setActiveTab("ROUTES");
              }}
              className={`p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${
                activeTab === "ROUTES"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Week Summary"
              aria-label="Week Summary"
              onClick={() => {
                setActiveTab("WEEK_SUMMARY");
              }}
              className={`p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${
                activeTab === "WEEK_SUMMARY"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* Unassigned Slots Alert Bell Icon */}
          {unassignedSlotsCount > 0 && (
            <div
              title={`${unassignedSlotsCount} unassigned slots need driver assignment today`}
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center transition shadow-2xs"
            >
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
          )}

          {/* Undo Button */}
          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
              title="Undo last action"
            >
              <Undo2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Undo ({undoStack.length})</span>
            </button>
          )}

          {/* Commit Pending Changes Button */}
          {Object.keys(pendingChanges).length > 0 && (
            <button
              type="button"
              onClick={handleCommitChanges}
              disabled={isActionSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-tight text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer whitespace-nowrap active:scale-[0.98]"
              title="Save all draft assignments and notify drivers"
            >
              {isActionSubmitting ? (
                <RotateCcw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
              )}
              <span>Save Changes</span>
            </button>
          )}

          {/* Add Unit to Route Button */}
          <button
            type="button"
            onClick={() => handleOpenAddUnitModal(selectedRouteKey || allRoutes[0])}
            className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-tight text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer whitespace-nowrap active:scale-[0.98]"
            title="Add vehicles to route"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* Main Progressive Disclosure View Canvas */}
      {initialLoading ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading schedule board...</p>
        </div>
      ) : (
        <>
          {/* View Tab 1: ROUTES (Level 1 or Level 2) */}
          {activeTab === "ROUTES" && (
            <>
              {!selectedRouteKey ? (
                /* Level 1: Routes Overview */
                <RoutesOverviewView
                  routes={allRoutes}
                  customRoutes={customRoutes}
                  units={units}
                  schedules={displaySchedules}
                  selectedDate={selectedDate}
                  shiftFilter={shiftFilter}
                  routeFilter={routeFilter}
                  onSelectRoute={(routeKey) => setSelectedRouteKey(routeKey)}
                  onAddUnitToRoute={handleOpenAddUnitModal}
                  onOpenAddNewRoute={() => setIsAddNewRouteModalOpen(true)}
                />
              ) : (
                /* Level 2: Route Detail */
                <RouteDetailView
                  routeKey={selectedRouteKey}
                  selectedDate={selectedDate}
                  onChangeDate={setSelectedDate}
                  units={units}
                  schedules={displaySchedules}
                  drivers={drivers}
                  customRoutes={customRoutes}
                  shiftFilter={shiftFilter}
                  onBack={() => setSelectedRouteKey(null)}
                  onAssignSlot={(slotData) => {
                    setAssignPopoverData(slotData);
                    setIsAssignPopoverOpen(true);
                  }}
                  onDeleteSchedule={handleStageRemoveAssignment}
                  onOpenHistory={(unit) => {
                    setHistoryDrawerUnit(unit);
                    setIsHistoryDrawerOpen(true);
                  }}
                  onOpenDriverHistory={handleOpenDriverHistory}
                  onSwapOrAssign={handleSwapOrAssign}
                  onAddUnitToRoute={handleOpenAddUnitModal}
                  onRemoveUnitFromRoute={handleRemoveUnitFromRoute}
                  onBulkRemoveUnitsFromRoute={handleBulkRemoveUnitsFromRoute}
                  onBulkClearAssignments={handleBulkClearAssignments}
                  onCopyFromYesterday={handleCopyFromYesterday}
                  onCopyFromLastWeek={handleCopyFromLastWeek}
                  onClearDay={handleClearDay}
                  onSaveTemplate={(name) => handleSaveTemplate(name)}
                  onApplyTemplate={handleApplyTemplate}
                  savedTemplates={savedTemplates}
                />
              )}
            </>
          )}

          {/* View Tab 2: WEEK SUMMARY (Level 4) */}
          {activeTab === "WEEK_SUMMARY" && (
            <WeekSummaryRouteView
              activeRouteKey={selectedRouteKey || "LANGGAM"}
              onChangeRoute={(rk) => setSelectedRouteKey(rk)}
              allRoutes={allRoutes}
              customRoutes={customRoutes}
              currentWeekStartDate={currentWeekStartDate}
              onChangeWeek={(newWeek) => setCurrentWeekStartDate(newWeek)}
              units={units}
              schedules={displaySchedules}
              drivers={drivers}
              onAssignSlot={(slotData) => {
                setAssignPopoverData(slotData);
                setIsAssignPopoverOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Level 3: Assignment Popover Modal */}
      <AssignmentPopover
        isOpen={isAssignPopoverOpen}
        onClose={() => setIsAssignPopoverOpen(false)}
        initialData={assignPopoverData}
        units={units}
        drivers={drivers}
        schedules={displaySchedules}
        onAssign={handleStageAssignment}
        onRemove={handleStageRemoveAssignment}
        isSubmitting={isActionSubmitting}
      />

      {/* Slide-Over Unit Schedule History Drawer */}
      <ScheduleHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          setHistoryDrawerUnit(null);
        }}
        unit={historyDrawerUnit}
        allSchedules={schedules}
        drivers={drivers}
      />

      {/* Slide-Over Driver Work History Drawer */}
      <DriverHistoryDrawer
        isOpen={isDriverHistoryOpen}
        onClose={() => {
          setIsDriverHistoryOpen(false);
          setHistoryDriver(null);
        }}
        driver={historyDriver}
        allSchedules={schedules}
        units={units}
        customRoutes={customRoutes}
      />

      {/* Add Unit to Route Modal */}
      <AddUnitToRouteModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        initialRouteKey={addUnitTargetRoute}
        allRoutes={allRoutes}
        customRoutes={customRoutes}
        units={units}
        onAddUnits={handleAddUnitsToRoute}
        isSubmitting={isActionSubmitting}
      />

      {/* Add New Route Modal */}
      <AddNewRouteModal
        isOpen={isAddNewRouteModalOpen}
        onClose={() => setIsAddNewRouteModalOpen(false)}
        onCreateRoute={handleCreateNewRoute}
      />

      {/* Command Palette (Ctrl+K or /) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAction={(actionKey, payload) => {
          if (actionKey === "SET_VIEW") {
            setActiveTab("ROUTES");
            if (payload !== "BOARD") {
              setSelectedRouteKey(payload);
            } else {
              setSelectedRouteKey(null);
            }
          } else if (actionKey === "JUMP_TODAY") {
            handleJumpToToday();
          } else if (actionKey === "SET_ROUTE_FILTER") {
            setRouteFilter(payload);
            if (payload !== "ALL") setSelectedRouteKey(payload);
          } else if (actionKey === "VIEW_UNIT_HISTORY") {
            setHistoryDrawerUnit(payload);
            setIsHistoryDrawerOpen(true);
          }
        }}
        drivers={drivers}
        units={units}
      />
    </div>
  );
};

export default SchedulingBoard;

