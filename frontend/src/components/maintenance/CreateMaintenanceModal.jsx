import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  X,
} from "lucide-react";

const CreateMaintenanceModal = ({
  open,
  onClose,
  onSubmit,
  units = [],
  mechanics = [],
  maintenance = null,
}) => {
  useEffect(() => {
    if (maintenance) {
      setForm({
        unit:
          maintenance.unit?._id ||
          "",
        assignedMechanic:
          maintenance.assignedMechanic?._id ||
          "",
        issueTitle:
          maintenance.issueTitle ||
          "",
        issueDescription:
          maintenance.issueDescription ||
          "",
        issueCategory:
          maintenance.issueCategory ||
          "",
        priorityLevel:
          maintenance.priorityLevel ||
          "Medium",
        maintenanceType:
          maintenance.maintenanceType ||
          "Corrective",
        partsCost:
          maintenance.partsCost || 0,
      });
    } else {
      setForm({
        unit: "",
        assignedMechanic: "",
        issueTitle: "",
        issueDescription: "",
        issueCategory: "",
        priorityLevel: "Medium",
        maintenanceType: "Corrective",
        partsCost: 0,
      });
    }
  }, [maintenance, open]);

  const [form, setForm] = useState({
    unit: "",
    assignedMechanic: "",
    issueTitle: "",
    issueDescription: "",
    issueCategory: "",
    priorityLevel: "Medium",
    maintenanceType: "Corrective",
    partsCost: 0,
  });

  const [unitSearch, setUnitSearch] =
    useState("");

  const [unitDropdownOpen, setUnitDropdownOpen] =
    useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("FORM TO SEND");
    console.log(form);

    onSubmit(form);
  };

  /*
   * =========================================================
   * SORT UNITS BY BODY NUMBER
   * =========================================================
   *
   * Body number is now the only displayed/searchable value.
   * numeric:true keeps values naturally ordered:
   *
   * 1
   * 2
   * 3
   * 10
   * 11
   *
   * instead of:
   * 1
   * 10
   * 11
   * 2
   *
   * =========================================================
   */
  const sortedUnits = [...units].sort(
    (a, b) => {
      const labelA = String(
        a.bodyNumber || ""
      ).trim();

      const labelB = String(
        b.bodyNumber || ""
      ).trim();

      return labelA.localeCompare(
        labelB,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      );
    }
  );

  /*
   * =========================================================
   * FILTER BY BODY NUMBER ONLY
   * =========================================================
   */
  const filteredUnits =
    sortedUnits.filter((unit) =>
      String(
        unit.bodyNumber || ""
      )
        .toLowerCase()
        .includes(
          unitSearch
            .toLowerCase()
            .trim()
        )
    );

  /*
   * =========================================================
   * SELECTED UNIT
   * =========================================================
   */
  const selectedUnit =
    units.find(
      (unit) =>
        unit._id === form.unit
    );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">

      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-7 shadow-xl animate-in fade-in zoom-in-95 duration-150">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 border-b border-slate-200 pb-4">

          <h3 className="text-xl font-bold uppercase tracking-wider text-black">
            {maintenance
              ? "Edit Maintenance Record"
              : "Create Maintenance Record"}
          </h3>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* =====================================================
              ROW 1
          ====================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* =================================================
                UNIT SEARCHABLE
            ================================================== */}

            <div className="relative">

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Unit
              </label>

              <button
                type="button"
                onClick={() =>
                  setUnitDropdownOpen(
                    (prev) => !prev
                  )
                }
                className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-base font-medium text-black shadow-sm"
              >

                <span>
                  {selectedUnit
                    ? selectedUnit.bodyNumber ||
                      "N/A"
                    : "Select Unit"}
                </span>

                <div className="flex items-center gap-2">

                  {selectedUnit && (
                    <span
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        setForm({
                          ...form,
                          unit: "",
                        });

                        setUnitSearch("");
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-black hover:bg-slate-100"
                    >
                      <X size={16} />
                    </span>
                  )}

                  <ChevronDown
                    size={20}
                    className={`text-black transition-transform ${
                      unitDropdownOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </div>

              </button>

              {unitDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">

                  {/* ===========================================
                      SEARCH
                  ============================================ */}

                  <div className="border-b border-slate-200 bg-slate-50 p-2">

                    <div className="relative">

                      <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-black"
                      />

                      <input
                        type="text"
                        autoFocus
                        value={unitSearch}
                        onChange={(e) =>
                          setUnitSearch(
                            e.target.value
                          )
                        }
                        placeholder="Type body number..."
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-10 text-sm font-medium text-black placeholder:text-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />

                    </div>

                  </div>

                  {/* ===========================================
                      OPTIONS
                  ============================================ */}

                  <div className="max-h-56 overflow-y-auto">

                    {filteredUnits.length ===
                    0 ? (
                      <div className="px-4 py-4 text-center text-sm font-semibold text-black">
                        No units found.
                      </div>
                    ) : (
                      filteredUnits.map(
                        (unit) => (
                          <button
                            key={unit._id}
                            type="button"
                            onClick={() => {

                              setForm({
                                ...form,
                                unit:
                                  unit._id,
                              });

                              setUnitDropdownOpen(
                                false
                              );

                              setUnitSearch("");

                            }}
                            className={`w-full px-4 py-3 text-left text-base font-medium text-black hover:bg-blue-50 ${
                              form.unit ===
                              unit._id
                                ? "bg-blue-100 font-bold"
                                : "bg-white"
                            }`}
                          >
                            {unit.bodyNumber ||
                              "N/A"}
                          </button>
                        )
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* =================================================
                MECHANIC
            ================================================== */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Assign Mechanic
              </label>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.assignedMechanic
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    assignedMechanic:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Assign Mechanic
                </option>

                {mechanics.map(
                  (m) => (
                    <option
                      key={m._id}
                      value={m._id}
                    >
                      {m.fullName}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          {/* =====================================================
              ROW 2
          ====================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* ISSUE TITLE */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Issue Title
              </label>

              <input
                type="text"
                placeholder="Issue Title"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black placeholder:text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.issueTitle
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    issueTitle:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* ISSUE CATEGORY */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Issue Category
              </label>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.issueCategory
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    issueCategory:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Select Issue Category
                </option>

                <option value="Engine">
                  Engine
                </option>

                <option value="Transmission">
                  Transmission
                </option>

                <option value="Brake">
                  Brake
                </option>

                <option value="Electrical">
                  Electrical
                </option>

                <option value="Suspension">
                  Suspension
                </option>

                <option value="Cooling System">
                  Cooling System
                </option>

                <option value="Fuel System">
                  Fuel System
                </option>

                <option value="Battery">
                  Battery
                </option>

                <option value="Tires">
                  Tires
                </option>

                <option value="Body">
                  Body
                </option>

                <option value="Air Conditioning">
                  Air Conditioning
                </option>

                <option value="Others">
                  Others
                </option>

              </select>

            </div>

          </div>

          {/* =====================================================
              DESCRIPTION
          ====================================================== */}

          <div>

            <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
              Issue Description
            </label>

            <textarea
              placeholder="Issue Description"
              className="min-h-[90px] w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black placeholder:text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={
                form.issueDescription
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  issueDescription:
                    e.target.value,
                })
              }
            />

          </div>

          {/* =====================================================
              COST / PRIORITY
          ====================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* PARTS COST */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Parts Cost
              </label>

              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black placeholder:text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.partsCost
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    partsCost:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* TOTAL COST */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Total Cost
              </label>

              <input
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-base text-black"
                value={`₱${Number(
                  form.partsCost
                ).toLocaleString()}`}
              />

            </div>

            {/* PRIORITY */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Priority
              </label>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.priorityLevel
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    priorityLevel:
                      e.target.value,
                  })
                }
              >

                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>

              </select>

            </div>

            {/* MAINTENANCE TYPE */}

            <div>

              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                Maintenance Type
              </label>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={
                  form.maintenanceType
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    maintenanceType:
                      e.target.value,
                  })
                }
              >

                <option value="Preventive">
                  Preventive
                </option>

                <option value="Corrective">
                  Corrective
                </option>

                <option value="Emergency">
                  Emergency
                </option>

              </select>

            </div>

          </div>

          {/* =====================================================
              ACTIONS
          ====================================================== */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-2.5 text-base font-semibold text-black transition-all hover:bg-slate-200 active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              {maintenance
                ? "Save Changes"
                : "Create"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateMaintenanceModal;