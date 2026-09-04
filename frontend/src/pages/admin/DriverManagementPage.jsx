import { useState } from "react";
import DriverTable from "../../components/drivers/DriverTable";
import DriverFormModal from "../../components/drivers/DriverFormModal";
import DriverDetailsModal from "../../components/drivers/DriverDetailsModal";
import DriverSearchBar from "../../components/drivers/DriverSearchBar";
import DriverPagination from "../../components/drivers/DriverPagination";

const DriverManagementPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-black">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
          Driver Management
        </h1>

        <p className="text-base text-black mt-2">
          Manage transport driver profiles, status updates, and credentials.
        </p>
      </div>

      <DriverSearchBar
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusFilter={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <DriverTable
        search={search}
        status={status}
        page={page}
        refreshKey={refreshKey}
        onShowDetails={(driver) => {
          setSelectedDriver(driver);
          setShowDetails(true);
        }}
        onAddDriver={() => setShowForm(true)}
        onTotalPagesChange={setTotalPages}
      />

      <DriverPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <DriverFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setRefreshKey((r) => r + 1);
        }}
      />

      <DriverDetailsModal
        open={showDetails}
        driver={selectedDriver}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
};

export default DriverManagementPage;