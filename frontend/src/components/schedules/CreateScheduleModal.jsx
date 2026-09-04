import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useScheduleApi } from "../../lib/scheduleApi";
import { Calendar, Search, ChevronDown, X } from "lucide-react";

const shiftMap = {
  "First Shift": {
    shiftStart: "05:00",
    shiftEnd: "13:00",
  },
  "Second Shift": {
    shiftStart: "13:00",
    shiftEnd: "21:00",
  },
};

/* =========================================================
   SEARCHABLE SELECT
========================================================= */

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  searchPlaceholder = "Type to search...",
  error,
  getOptionLabel,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedOption = options.find(
    (option) => option._id === value
  );

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option)
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  useEffect(() => {
    if (!open) {
      setSearchText("");
    }
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !event.target.closest(
          `[data-searchable-select="${name}"]`
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [name]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name,
        value: option._id,
      },
    });

    setOpen(false);
    setSearchText("");
  };

  const handleClear = (event) => {
    event.stopPropagation();

    onChange({
      target: {
        name,
        value: "",
      },
    });

    setSearchText("");
  };

  return (
    <div
      className="relative"
      data-searchable-select={name}
    >
      <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-black">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-base font-medium text-black shadow-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <span className="text-black">
            {selectedOption
              ? getOptionLabel(selectedOption)
              : placeholder}
          </span>

          <div className="flex items-center gap-2">
            {selectedOption && (
              <span
                type="button"
                onClick={handleClear}
                className="flex h-6 w-6 items-center justify-center rounded-md text-black hover:bg-slate-100"
              >
                <X size={16} />
              </span>
            )}

            <ChevronDown
              size={20}
              className={`text-black transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
            {/* SEARCH */}
            <div className="border-b border-slate-200 bg-slate-50 p-3">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black"
                />

                <input
                  type="text"
                  autoFocus
                  value={searchText}
                  onChange={(e) =>
                    setSearchText(e.target.value)
                  }
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-base font-medium text-black outline-none transition-all placeholder:text-black focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            {/* OPTIONS */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-4 text-center text-sm font-semibold text-black">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected =
                    option._id === value;

                  return (
                    <button
                      key={option._id}
                      type="button"
                      onClick={() =>
                        handleSelect(option)
                      }
                      className={`w-full px-4 py-3 text-left text-base font-medium text-black transition-colors hover:bg-blue-50 ${
                        isSelected
                          ? "bg-blue-100 font-bold"
                          : "bg-white"
                      }`}
                    >
                      {getOptionLabel(option)}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

const CreateScheduleModal = ({
  isOpen,
  onClose,
  drivers = [],
  units = [],
  onSuccess,
}) => {
  const { createSchedule } = useScheduleApi();

  const [form, setForm] = useState({
    shiftDate: "",
    unit: "",
    driver: "",
    shiftType: "First Shift",
    route: "",
    remarks: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    // reset form when opened
    setForm({
      shiftDate: "",
      unit: "",
      driver: "",
      shiftType: "First Shift",
      route: "",
      remarks: "",
    });

    setErrors({});
    setSubmitting(false);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  };

  const validate = () => {
    const err = {};

    if (!form.shiftDate) {
      err.shiftDate =
        "Shift date is required";
    }

    if (!form.unit) {
      err.unit = "Unit is required";
    }

    if (!form.driver) {
      err.driver =
        "Driver is required";
    }

    if (!form.shiftType) {
      err.shiftType =
        "Shift type is required";
    }

    if (!form.route) {
      err.route =
        "Route is required";
    }

    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validate();

    setErrors(validation);

    if (
      Object.keys(validation).length > 0
    ) {
      return;
    }

    const times =
      shiftMap[form.shiftType] ||
      shiftMap["First Shift"];

    const payload = {
      driver: form.driver,
      unit: form.unit,
      shiftDate: form.shiftDate,
      shiftType: form.shiftType,
      shiftStart: times.shiftStart,
      shiftEnd: times.shiftEnd,
      route: form.route,
      remarks: form.remarks,
    };

    setSubmitting(true);

    try {
      const res =
        await createSchedule(payload);

      onSuccess &&
        onSuccess(res);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to create schedule";

      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /*
   * Driver list:
   * A-Z by first name + last name.
   */
  const sortedDrivers = [
    ...drivers,
  ].sort((a, b) => {
    const nameA =
      `${a.firstName || ""} ${
        a.lastName || ""
      }`
        .trim()
        .toLowerCase();

    const nameB =
      `${b.firstName || ""} ${
        b.lastName || ""
      }`
        .trim()
        .toLowerCase();

    return nameA.localeCompare(nameB);
  });

  /*
   * Unit list:
   * A-Z / natural numeric order by BODY NUMBER only.
   *
   * Plate number is intentionally not used here,
   * matching the Create Maintenance Modal behavior.
   */
  const sortedUnits = [
    ...units,
  ].sort((a, b) => {
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
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">

        {/* HEADER */}
        <div className="mb-7 flex items-center justify-between border-b border-slate-200 pb-5">

          <div>
            <h2 className="text-2xl font-extrabold uppercase tracking-wide text-black">
              Create Schedule
            </h2>

            <p className="mt-1 text-sm font-medium text-black">
              Assign a driver, unit, shift, and route.
            </p>
          </div>

  
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* SHIFT DATE */}
            <div>

              <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-black">
                Shift Date
              </label>

              <div className="relative">

                <input
                  type="date"
                  name="shiftDate"
                  value={form.shiftDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base font-medium text-black shadow-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    const input =
                      e.currentTarget
                        .previousElementSibling;

                    if (input) {
                      if (
                        typeof input.showPicker ===
                        "function"
                      ) {
                        input.showPicker();
                      } else {
                        input.focus();
                      }
                    }
                  }}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-black transition-all hover:bg-slate-100 active:scale-95"
                  aria-label="Open calendar"
                  title="Select date"
                >
                  <Calendar
                    size={20}
                    strokeWidth={2.2}
                  />
                </button>

              </div>

              {errors.shiftDate && (
                <p className="mt-2 text-sm font-bold text-red-600">
                  {errors.shiftDate}
                </p>
              )}

            </div>

            {/* SHIFT TYPE */}
            <div>

              <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-black">
                Shift Type
              </label>

              <select
                name="shiftType"
                value={form.shiftType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                <option>
                  First Shift
                </option>

                <option>
                  Second Shift
                </option>
              </select>

              {errors.shiftType && (
                <p className="mt-2 text-sm font-bold text-red-600">
                  {errors.shiftType}
                </p>
              )}

            </div>

            {/* =================================================
                UNIT SEARCHABLE - BODY NUMBER ONLY
            ================================================== */}

            <SearchableSelect
              label="Unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              options={sortedUnits}
              placeholder="Select Unit"
              searchPlaceholder="Type body number..."
              error={errors.unit}
              getOptionLabel={(unit) =>
                unit.bodyNumber ||
                "N/A"
              }
            />

            {/* DRIVER SEARCHABLE */}
            <SearchableSelect
              label="Driver"
              name="driver"
              value={form.driver}
              onChange={handleChange}
              options={sortedDrivers}
              placeholder="Select Driver"
              searchPlaceholder="Type driver name..."
              error={errors.driver}
              getOptionLabel={(driver) =>
                `${driver.firstName || ""} ${
                  driver.lastName || ""
                }`.trim() ||
                "Unknown Driver"
              }
            />

            {/* ROUTE */}
            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-black">
                Route
              </label>

              <input
                type="text"
                name="route"
                value={form.route}
                onChange={handleChange}
                placeholder="Enter route"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black placeholder:text-black shadow-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />

              {errors.route && (
                <p className="mt-2 text-sm font-bold text-red-600">
                  {errors.route}
                </p>
              )}

            </div>

            {/* REMARKS */}
            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-black">
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Optional remarks..."
                className="min-h-[120px] w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black placeholder:text-black shadow-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />

            </div>

          </div>

          {/* SUBMIT ERROR */}
          {errors.submit && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-bold text-red-700">
                {errors.submit}
              </p>

            </div>
          )}

          {/* FOOTER */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-2.5 text-base font-bold text-black shadow-sm transition-all hover:bg-slate-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
            >
              {submitting
                ? "Creating..."
                : "Create Schedule"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateScheduleModal;