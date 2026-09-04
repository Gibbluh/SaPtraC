import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFuelApi } from "../../lib/fuelApi";

const DailyFuelReceiptPage = () => {
  const { dateKey } = useParams();
  const navigate = useNavigate();
  const { getDailyFuelReceiptHistory } = useFuelApi();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const res = await getDailyFuelReceiptHistory();
        const receipts = res?.receipts || [];
        const found = receipts.find((r) => r.dateKey === dateKey);
        setReceipt(found || null);
      } catch (err) {
        console.error("Failed loading daily receipt", err);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [dateKey, getDailyFuelReceiptHistory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-black">Loading receipt...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">
            Receipt not found
          </h1>
          <p className="text-black mb-4">
            No daily fuel receipt found for {dateKey}.
          </p>
          <button
            onClick={() => navigate("/fuel")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
            Fuel Transaction Receipt
          </h1>
          <p className="text-slate-900 mt-2">
            San Pedro Transport Cooperative
          </p>
        </div>

        <div className="space-y-4 text-black">
  <div className="flex justify-between border-b pb-2">
    <span className="font-semibold">Receipt</span>
    <span>{receipt.receiptNumber}</span>
  </div>
  
  <div className="flex justify-between border-b pb-2">
    <span className="font-semibold">Date</span>
    <span>{new Date(receipt.date).toLocaleDateString()}</span>
  </div>
   
  <div className="flex justify-between border-b pb-2">
    <span>Total Boundary</span>
    <span>₱{receipt.boundaryTotal.toLocaleString()}</span>
  </div>
  
  <div className="flex justify-between border-b pb-2">
    <span>Total Fuel Cost</span>
    <span>₱{receipt.fuelCostTotal.toLocaleString()}</span>
  </div>
  
  <div className="flex justify-between border-b pb-2">
    <span>Total Liters</span>
    <span>{receipt.litersTotal} L</span>
  </div>
  
  <div className="flex justify-between">
    <span>Total Transactions</span>
    <span>{receipt.transactionCount}</span>
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

export default DailyFuelReceiptPage;