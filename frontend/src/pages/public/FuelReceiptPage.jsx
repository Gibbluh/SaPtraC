import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFuelApi } from "../../lib/fuelApi";

const FuelReceiptPage = () => {
  const { id } = useParams();
  const { getPublicFuelTransaction } = useFuelApi();

  const [fuel, setFuel] = useState(null);

  const loadFuel = async () => {
    const res = await getPublicFuelTransaction(id);
    console.log("API RESPONSE:", res);
    setFuel(res);
  };

  useEffect(() => {
    loadFuel();
  }, [id, getPublicFuelTransaction]);

  if (!fuel) return <div>Loading...</div>;

  return (
  <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
    <div className="bg-white shadow-2xl rounded-2xl p-8 w-[550px] border border-gray-200">

      <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
        Fuel Transaction Receipt
      </h1>

      <p className="text-center text-black mb-8">
        San Pedro Transport Cooperative
      </p>

      <div className="space-y-4">

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Date</span>
          <span className="text-black">
            {new Date(fuel.transactionDate).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Driver</span>
          <span className="text-black">
            {fuel.driver?.firstName} {fuel.driver?.lastName}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Unit</span>
          <span className="text-black">
            {fuel.unit?.bodyNumber || fuel.unit?.plateNumber}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Route</span>
          <span className="text-black">{fuel.route}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Fuel Station</span>
          <span className="text-black">{fuel.fuelStation}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Fuel Liters</span>
          <span className="text-black">{fuel.fuelLiters} L</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Fuel Cost</span>
          <span className="text-black">
            ₱{fuel.fuelCost}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Boundary</span>
          <span className="text-black">
            ₱{fuel.totalBoundary}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold text-gray-700">Receipt No</span>
          <span className="text-black">
            {fuel.receiptNumber || "N/A"}
          </span>
        </div>
      </div>

      <div className="mt-8 border-t pt-4 text-center">
        <p className="font-semibold text-gray-700">
          San Pedro Transport Cooperative
        </p>

        <p className="text-sm text-gray-500">
          Fuel Management System
        </p>

        <p className="text-xs text-gray-400 mt-1">
          Generated via QR Code
        </p>
      </div>
      </div>
    </div>
  );
};

export default FuelReceiptPage;
