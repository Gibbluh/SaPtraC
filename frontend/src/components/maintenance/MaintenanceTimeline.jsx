import { CheckCircle, History, StickyNote, UserCog, Wrench } from "lucide-react";

const ACTION_ICONS = {
  IssueCreated: (
    <History className="size-5 text-blue-600" />
  ),

  MechanicAssigned: (
    <UserCog className="size-5 text-indigo-600" />
  ),

  StatusUpdated: (
    <Wrench className="size-5 text-amber-600" />
  ),

  RepairCompleted: (
    <CheckCircle className="size-5 text-emerald-600" />
  ),

  PartsReplaced: (
    <Wrench className="size-5 text-slate-700" />
  ),

  MaintenanceNoteAdded: (
    <StickyNote className="size-5 text-purple-600" />
  ),
};

const STATUS_COLORS = {
  Pending:
    "bg-amber-50 text-black border-amber-200",

  Diagnosed:
    "bg-indigo-50 text-black border-indigo-200",

  "In Progress":
    "bg-blue-50 text-black border-blue-200",

  "Waiting Parts":
    "bg-purple-50 text-black border-purple-200",

  Completed:
    "bg-emerald-50 text-black border-emerald-200",

  Cancelled:
    "bg-slate-100 text-black border-slate-300",
};

function formatDate(date) {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatActionType(actionType) {
  return (actionType || "Unknown")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

const MaintenanceTimeline = ({
  history = [],
  loading = false,
  error = "",
}) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-black">
          Maintenance Timeline
        </h2>

        <p className="mt-1 text-sm font-medium text-black">
          Activity history and maintenance progress
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center text-base font-semibold text-black">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-center">
            <History className="mx-auto mb-3 size-10 text-black" />

            <h3 className="text-lg font-bold text-black">
              No Repair History
            </h3>

            <p className="mt-1 text-sm font-medium text-black">
              No maintenance activity has been recorded yet.
            </p>
          </div>
        </div>
      ) : (
        <ol className="relative ml-3 border-l-2 border-slate-300">

          {(Array.isArray(history) ? history : []).map(
            (item, idx) => (
              <li
                key={item._id || idx}
                className="relative mb-8 ml-8 last:mb-0"
              >

                {/* Timeline icon */}
                <span className="absolute -left-[2.15rem] flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300 bg-white shadow-sm">
                  {ACTION_ICONS[item.actionType] || (
                    <History className="size-5 text-black" />
                  )}
                </span>

                {/* Timeline card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">

                  {/* Top row */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="text-base font-bold uppercase tracking-wide text-black">
                        {formatActionType(item.actionType)}
                      </span>

                      {item.newData?.status && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            STATUS_COLORS[item.newData.status] ||
                            "bg-slate-100 text-black border-slate-300"
                          }`}
                        >
                          {item.newData.status}
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-semibold text-black">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold italic leading-relaxed text-black">
                        "{item.notes}"
                      </p>
                    </div>
                  )}

                  {/* Performed By */}
                  {item.performedBy && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-black">
                        Performed By
                      </p>

                      <p className="mt-1 text-base font-semibold text-black">
                        {item.performedBy.fullName ||
                          item.performedBy.name ||
                          item.performedBy.email ||
                          "Unknown"}
                      </p>
                    </div>
                  )}

                  {/* Mechanic assignment */}
                  {item.actionType === "MechanicAssigned" &&
                    item.newData?.mechanic && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-black">
                          Assigned Mechanic
                        </p>

                        <p className="mt-1 text-base font-bold text-black">
                          {item.newData.mechanic.fullName ||
                            item.newData.mechanic.name ||
                            "Mechanic"}
                        </p>
                      </div>
                    )}

                  {/* Human-readable status change */}
                  {item.actionType === "StatusUpdated" &&
                    item.previousData?.status &&
                    item.newData?.status && (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-black">
                            Previous Status
                          </p>

                          <p className="mt-1 text-base font-semibold text-black">
                            {item.previousData.status}
                          </p>
                        </div>

                        <div className="hidden text-xl font-bold text-black sm:block">
                          →
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-black">
                            New Status
                          </p>

                          <p className="mt-1 text-base font-semibold text-black">
                            {item.newData.status}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Parts replaced */}
                  {item.actionType === "PartsReplaced" &&
                    item.newData?.partsReplaced && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-black">
                          Parts Replaced
                        </p>

                        <div className="mt-2 space-y-2">
                          {Array.isArray(
                            item.newData.partsReplaced
                          ) &&
                            item.newData.partsReplaced.map(
                              (part, partIndex) => (
                                <div
                                  key={partIndex}
                                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-black"
                                >
                                  {typeof part === "string"
                                    ? part
                                    : part?.name ||
                                      "Part replaced"}
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    )}

                </div>
              </li>
            )
          )}
        </ol>
      )}
    </div>
  );
};

export default MaintenanceTimeline;