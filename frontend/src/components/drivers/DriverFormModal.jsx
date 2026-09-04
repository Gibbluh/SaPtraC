import { useState } from "react";
import api from "../../lib/axios";
import { Calendar } from "lucide-react";

const DriverFormModal = ({ open, onClose, initialData }) => {
  const [form, setForm] = useState(
    initialData || {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      emergencyContact: {
        name: "",
        phone: "",
        relation: "",
      },
      licenseNumber: "",
      licenseType: "",
      licenseExpiry: "",
      status: "Active",
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");

      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        emergencyContact: {
          name: form.emergencyContact?.name || "",
          phone: form.emergencyContact?.phone || "",
          relation: form.emergencyContact?.relation || "",
        },
        licenseNumber: form.licenseNumber,
        licenseType: form.licenseType,
        licenseExpiry: form.licenseExpiry,
        status: form.status,
      };

      if (form._id) {
        await api.put(`/drivers/${form._id}`, payload);
      } else {
        await api.post(`/drivers`, payload);
      }

      onClose();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationMessages = Array.isArray(err.response?.data?.errors)
        ? err.response.data.errors.join(" ")
        : "";

      setError(
        apiMessage ||
          validationMessages ||
          err.message ||
          "Failed to save driver"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        className="bg-white border border-slate-200 rounded-2xl shadow-xl p-7 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-black uppercase tracking-wider mb-6 pb-3 border-b border-slate-200">
          {form._id ? "Edit Driver" : "Add Driver"}
        </h2>

        {error && (
          <div className="text-black bg-rose-50 border border-rose-200 rounded-lg p-4 text-base font-semibold mb-5">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              First Name
            </label>

            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Middle Name
            </label>

            <input
              name="middleName"
              value={form.middleName}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Last Name
            </label>

            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Email
            </label>

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Phone
            </label>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Address
            </label>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <fieldset className="border border-slate-300 rounded-xl p-5 bg-slate-50">
              <legend className="px-2 text-sm font-bold text-black uppercase tracking-wider">
                Emergency Contact
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                    Name
                  </label>

                  <input
                    name="emergencyContact.name"
                    value={form.emergencyContact.name}
                    onChange={handleChange}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                    Phone
                  </label>

                  <input
                    name="emergencyContact.phone"
                    value={form.emergencyContact.phone}
                    onChange={handleChange}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
                    Relation
                  </label>

                  <input
                    name="emergencyContact.relation"
                    value={form.emergencyContact.relation}
                    onChange={handleChange}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              License Number
            </label>

            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              License Type
            </label>

            <input
              name="licenseType"
              value={form.licenseType}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              License Expiry
            </label>

            <div className="relative flex items-center">
              <input
                name="licenseExpiry"
                type="date"
                value={form.licenseExpiry}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />

              <Calendar
                size={18}
                className="absolute right-3 text-black pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-2">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-7 border-t border-slate-200 pt-5">
          <button
            type="button"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-semibold rounded-lg border border-slate-300 transition-all duration-150 active:scale-95"
            onClick={onClose}
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
  );
};

export default DriverFormModal;
