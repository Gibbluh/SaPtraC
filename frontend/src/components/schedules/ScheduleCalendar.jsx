import { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import withDragAndDropModule from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../index.css"; // Tailwind overrides

const withDragAndDrop =
  withDragAndDropModule.default || withDragAndDropModule;

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Helper to combine date and time string
function combineDateAndTime(date, time) {
  // date: ISO string or Date, time: 'HH:mm'
  const d = moment(date).format("YYYY-MM-DD");
  return moment(`${d} ${time}`, "YYYY-MM-DD HH:mm").toDate();
}

/**
 * ScheduleCalendar
 * @param {Object} props
 * @param {Array} props.schedules - Array of schedule objects
 * @param {Function} props.onSelectEvent - Callback when an event is clicked
 * @param {Function} props.onEventDrop - Callback when an event is dropped (drag-and-drop)
 * @param {Function} [props.onEventDropValidate] - Async validator for drag-and-drop (returns true if valid, false if conflict)
 * @param {Array} [props.realtimeEvents] - List of schedule events for real-time updates
 */
const ScheduleCalendar = ({ schedules = [], onSelectEvent, onEventDrop, onEventDropValidate, realtimeEvents = [] }) => {
  // Transform schedules to calendar events
  const events = useMemo(() => {
    const source = realtimeEvents.length > 0 ? realtimeEvents : schedules;
    return source.map((sch) => ({
      id: sch._id,
      title: `${sch.driver?.fullName || sch.driver} - ${sch.unit?.plateNumber || sch.unit}`,
      start: combineDateAndTime(sch.shiftDate, sch.shiftStart),
      end: combineDateAndTime(sch.shiftDate, sch.shiftEnd),
      resource: sch,
      allDay: false,
      status: sch.status,
    }));
  }, [schedules, realtimeEvents]);

  // Event style for Tailwind
  const eventPropGetter = useCallback((event) => {
    let bg = "bg-blue-500";
    if (event.status === "Completed") bg = "bg-green-500";
    else if (event.status === "Cancelled") bg = "bg-red-500";
    else if (event.status === "Active") bg = "bg-blue-500";
    return {
      className: `${bg} text-white rounded px-2 py-1 border-none cursor-pointer` // Tailwind
    };
  }, []);

  // Drag and drop handler with validation
  const handleEventDrop = useCallback(async ({ event, start, end }) => {
    if (onEventDropValidate) {
      const isValid = await onEventDropValidate({ event, start, end });
      if (!isValid) return; // Prevent drop if conflict
    }
    if (onEventDrop) {
      onEventDrop({ event, start, end });
    }
  }, [onEventDrop, onEventDropValidate]);

  // Optionally, handle resize
  const handleEventResize = useCallback(async ({ event, start, end }) => {
    if (onEventDropValidate) {
      const isValid = await onEventDropValidate({ event, start, end });
      if (!isValid) return;
    }
    if (onEventDrop) {
      onEventDrop({ event, start, end });
    }
  }, [onEventDrop, onEventDropValidate]);

  return (
    <div className="w-full h-[600px] md:h-[700px] bg-white rounded shadow p-2 md:p-4">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        style={{ height: "100%" }}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        popup
        toolbar
        selectable={false}
        className="rbc-calendar"
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable
        draggableAccessor={() => true}
      />
    </div>
  );
};

export default ScheduleCalendar;
