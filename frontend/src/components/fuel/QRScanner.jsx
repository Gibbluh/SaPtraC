import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import api from "../../lib/axios";

const QRScanner = ({ type, onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
           await html5QrCode.stop();
           await html5QrCode.clear();

            scannerRef.current = null;

            let res;

            if (type === "driver") {
              res = await api.get(
                `/drivers/qr/${encodeURIComponent(decodedText)}`
              );
            } else {
              res = await api.get(
                `/units/qr/${encodeURIComponent(decodedText)}`
              );
            }
            console.log("SCAN SUCCESS");
            console.log("RES:", res.data);


            const entity =
              type === "driver"
                ? res.data.driver
                : res.data.unit;

            onScanSuccess(entity);
          } catch (err) {
            setError(err.response?.data?.message || "Lookup failed");
          }
        },
        () => {}
      )
      .catch((err) => {
        setError(err);
      });

   return () => {
  if (scannerRef.current?.isScanning) {
    scannerRef.current
      .stop()
      .then(() => {
        scannerRef.current.clear();
      })
      .catch(() => {});
  }
};
  }, [type, onScanSuccess]);

  const handleManualLookup = async () => {
    try {
      let res;

      if (type === "driver") {
        res = await api.get(
          `/drivers/qr/${encodeURIComponent(manualCode)}`
        );
      } else {
        res = await api.get(
          `/units/qr/${encodeURIComponent(manualCode)}`
        );
      }

      const entity =
        type === "driver"
          ? res.data.driver
          : res.data.unit;

      setInfo(entity);
      onScanSuccess(entity);
    } catch (err) {
      setError(err.response?.data?.message || "Lookup failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-5 w-[420px]">

        <h2 className="font-bold mb-3">
          Scan {type === "driver" ? "Driver" : "Unit"} QR
        </h2>

        <div id="reader" />

        <div className="flex gap-2 mt-4">
          <input
            className="border rounded px-2 py-1 flex-1"
            value={manualCode}
            onChange={(e)=>setManualCode(e.target.value)}
            placeholder="Paste QR data"
          />

          <button
            onClick={handleManualLookup}
            className="bg-blue-600 text-white px-3 rounded"
          >
            Lookup
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-3">
            {error}
          </div>
        )}

        {info && (
          <pre className="bg-gray-100 p-2 mt-3 rounded text-xs overflow-auto">
            {JSON.stringify(info,null,2)}
          </pre>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-1 rounded"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRScanner;