import { useState } from "react";
import { Search } from "lucide-react";
import { ChevronDown } from "lucide-react";

const DriverSearchBar = ({ onSearch, onStatusFilter }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch && onSearch(query);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatus(value);
    onStatusFilter && onStatusFilter(value);
  };

  return (
    <form
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSearch}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">

        {/* Search */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
            Search Drivers
          </label>

          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black"
            />

            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-base font-medium text-black shadow-sm outline-none transition-all duration-150 placeholder:text-black focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search drivers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="w-full md:w-56">
          <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
            Driver Status
          </label>

         <div className="relative">
  <select
    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-11 text-base font-medium text-black shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
    value={status}
    onChange={handleStatusChange}
  >
    <option value="">All Statuses</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
    <option value="Suspended">Suspended</option>
  </select>

  <ChevronDown
    size={20}
    strokeWidth={2}
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"
  />
</div>
        </div>

        {/* Search Button */}
        <button
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-95"
          type="submit"
        >
          <Search size={19} />
          Search
        </button>

      </div>
    </form>
  );
};

export default DriverSearchBar;