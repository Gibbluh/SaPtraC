import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

/**
 * PrintableReceipt
 * @param {Object} props
 * @param {Object} props.remittance - Remittance data (with breakdown, driver, unit, schedule, etc.)
 * @param {Object} props.verifiedBy - User who verified (optional)
 * @param {string} props.qrCodeUrl - QR code image URL for verification
 */
const PrintableReceipt = ({ remittance, verifiedBy, qrCodeUrl }) => {
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Remittance_Receipt_${remittance?.receiptNumber || ""}`,
  });

  if (!remittance) return null;

  // Helper: Format currency
  const formatCurrency = (val) =>
    typeof val === "number"
      ? val.toLocaleString("en-US", { style: "currency", currency: "PHP" })
      : val;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={printRef}
        className="w-[320px] bg-white text-black p-4 rounded shadow print:shadow-none print:bg-white print:rounded-none print:p-0"
        style={{ fontFamily: "monospace, 'Courier New', Courier" }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed pb-2 mb-2">
          <div className="text-lg font-bold tracking-widest">COOPERATIVE NAME</div>
          <div className="text-xs">Remittance Receipt</div>
          <div className="text-xs">{remittance?.receiptNumber}</div>
          <div className="text-xs">{remittance?.remittanceDate?.slice(0, 10)}</div>
        </div>
        {/* Driver/Unit/Schedule */}
        <div className="text-xs mb-2">
          <div>Driver: <span className="font-semibold">{remittance?.driver?.fullName || "-"}</span></div>
          <div>Unit: <span className="font-semibold">{remittance?.unit?.plateNumber || "-"}</span></div>
          <div>Schedule: <span>{remittance?.schedule?.shiftDate?.slice(0,10)} {remittance?.schedule?.shiftType}</span></div>
        </div>
        {/* Breakdown */}
        <div className="border-t border-b border-dashed py-2 my-2 text-xs">
          <div className="flex justify-between">
            <span>Total Expense</span>
            <span>{formatCurrency(remittance?.totalExpense)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fuel Deduction</span>
            <span>{formatCurrency(remittance?.totalFuelDeduction)}</span>
          </div>
          <div className="flex justify-between">
            <span>Salary Deduction</span>
            <span>{formatCurrency(remittance?.totalSalaryDeduction)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Coop Income</span>
            <span>{formatCurrency(remittance?.cooperativeIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span>Driver Net</span>
            <span>{formatCurrency(remittance?.driverNetIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining Balance</span>
            <span>{formatCurrency(remittance?.remainingBalance)}</span>
          </div>
        </div>
        {/* Verification */}
        <div className="text-xs mb-2">
          <div>Status: <span className="font-semibold">{remittance?.verificationStatus}</span></div>
          {verifiedBy && (
            <div>Verified By: <span>{verifiedBy?.fullName || verifiedBy?.name}</span></div>
          )}
          {remittance?.verifiedAt && (
            <div>Verified At: <span>{remittance.verifiedAt.slice(0, 19).replace('T', ' ')}</span></div>
          )}
        </div>
        {/* QR Code */}
        <div className="flex flex-col items-center mt-2 mb-1">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="Receipt QR"
              className="w-20 h-20 mx-auto border border-dashed"
            />
          )}
          <div className="text-[10px] text-center mt-1">Scan to verify receipt</div>
        </div>
        {/* Footer */}
        <div className="text-center text-[10px] mt-2 border-t border-dashed pt-1">
          <div>Thank you for your remittance!</div>
          <div>Printed: {new Date().toLocaleString()}</div>
        </div>
      </div>
      {/* Print Button (hidden on print) */}
      <button
        onClick={handlePrint}
        className="btn btn-primary btn-sm mt-4 print:hidden"
      >
        Print Receipt
      </button>
    </div>
  );
};

export default PrintableReceipt;
