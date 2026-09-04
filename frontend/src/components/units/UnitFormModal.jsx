import { useState } from "react";
import api from "../../lib/axios";
import { Calendar } from "lucide-react";

const initialState = {
  plateNumber: "",
  bodyNumber: "",
  route: "",
  unitType: "",
  fuelType: "",
  capacity: 1,
  availabilityStatus: "Available",
  maintenanceStatus: "Good",
  registrationExpiry: "",
  insuranceExpiry: "",
};

const UnitFormModal = ({ open, unit, onClose }) => {
  const [form, setForm] = useState(unit || initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare payload: ensure numeric capacity and ISO date strings
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        registrationExpiry: form.registrationExpiry
          ? new Date(form.registrationExpiry).toISOString()
          : null,
        insuranceExpiry: form.insuranceExpiry
          ? new Date(form.insuranceExpiry).toISOString()
          : null,
      };

      if (unit && unit._id) {
        await api.put(`/units/${unit._id}`, payload);
      } else {
        await api.post("/units", payload);
      }

      onClose(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save unit"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-7 w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-150">
        
        <h2 className="text-xl font-bold text-black uppercase tracking-wider mb-6 pb-3 border-b border-slate-200">
          {unit ? "Edit Unit" : "Add Unit"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Plate + Body Number */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Plate Number
              </label>

              <input
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                required
                placeholder="Plate Number"
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Body Number
              </label>

              <input
                name="bodyNumber"
                value={form.bodyNumber}
                onChange={handleChange}
                required
                placeholder="Body Number"
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              />
            </div>
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Route
            </label>

            <input
              name="route"
              value={form.route}
              onChange={handleChange}
              placeholder="Route"
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
            />
          </div>

          {/* Unit Type + Fuel Type */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Unit Type
              </label>

              <input
                name="unitType"
                value={form.unitType}
                onChange={handleChange}
                required
                placeholder="Unit Type"
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Fuel Type
              </label>

              <input
                name="fuelType"
                value={form.fuelType}
                onChange={handleChange}
                required
                placeholder="Fuel Type"
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              />
            </div>
          </div>

          {/* Capacity + Availability + Maintenance */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Capacity
              </label>

              <input
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                required
                placeholder="Capacity"
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Availability
              </label>

              <select
                name="availabilityStatus"
                value={form.availabilityStatus}
                onChange={handleChange}
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              >
                <option value="Available">Available</option>
                <option value="On Route">On Route</option>
                <option value="Under Maintenance">
                  Under Maintenance
                </option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                Maintenance
              </label>

              <select
                name="maintenanceStatus"
                value={form.maintenanceStatus}
                onChange={handleChange}
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full"
              >
                <option value="Good">Good</option>
                <option value="Needs Maintenance">
                  Needs Maintenance
                </option>
                <option value="Under Repair">
                  Under Repair
                </option>
              </select>
            </div>
          </div>

          {/* Registration Expiry */}
          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Registration Expiry
            </label>

            <div className="relative flex items-center">
              <input
                name="registrationExpiry"
                type="date"
                value={form.registrationExpiry?.slice(0, 10) || ""}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />

              <Calendar
                size={18}
                className="absolute right-3 text-black pointer-events-none z-10"
              />
            </div>
          </div>

          {/* Insurance Expiry */}
          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Insurance Expiry
            </label>

            <div className="relative flex items-center">
              <input
                name="insuranceExpiry"
                type="date"
                value={form.insuranceExpiry?.slice(0, 10) || ""}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />

              <Calendar
                size={18}
                className="absolute right-3 text-black pointer-events-none z-10"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-black bg-rose-50 border border-rose-200 rounded-lg p-4 text-base font-semibold">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-7 border-t border-slate-200 pt-5">
            <button
              type="button"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-semibold rounded-lg border border-slate-300 transition-all duration-150 active:scale-95"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95 hover:shadow-md"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UnitFormModal;