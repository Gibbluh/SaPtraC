import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { createWorker } from "tesseract.js";
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Receipt,
} from "lucide-react";

/*
 * =========================================================
 * RECEIPT OCR HELPERS
 * =========================================================
 */

const normalizeText = (text = "") => {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
};

const cleanNumber = (value = "") => {
  if (!value) return "";

  return String(value)
    .replace(/[₱PpHh]/g, "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "")
    .trim();
};

/*
 * =========================================================
 * FUEL STATION EXTRACTION
 * =========================================================
 */

const extractFuelStation = (text) => {
  const lines = text
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean);

  /*
   * Example:
   * Station Name: San Pedro Petron Service Station
   */

  const stationLine = lines.find((line) =>
    /^station\s*name\s*:/i.test(line)
  );

  if (stationLine) {
    const value = stationLine
      .replace(
        /^station\s*name\s*:/i,
        ""
      )
      .trim();

    if (value) {
      return value;
    }
  }

  /*
   * Fallback for common fuel stations.
   */

  const knownStation = lines.find(
    (line) =>
      /\b(petron|shell|caltex|phoenix|seaoil|unioil|cleanfuel)\b/i.test(
        line
      )
  );

  return knownStation || "";
};

/*
 * =========================================================
 * FUEL LITERS EXTRACTION
 * =========================================================
 */

const extractFuelLiters = (text) => {
  const patterns = [
    /quantity\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i,

    /qty\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i,

    /volume\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i,

    /fuel\s*liters?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i,

    /liters?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i,

    /([\d,]+(?:\.\d+)?)\s*l(?:iters?)?\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanNumber(match[1]);
    }
  }

  return "";
};

/*
 * =========================================================
 * FUEL COST EXTRACTION
 * =========================================================
 *
 * We intentionally prioritize:
 *
 * Amount
 * Total incl. VAT
 * Grand Total
 * Total
 *
 * We do NOT use Price because Price is usually
 * the price per liter.
 *
 * Example receipt:
 *
 * Price: 86.80
 * Amount: 1,000.00
 *
 * Result:
 * fuelCost = 1000
 *
 * =========================================================
 */

const extractFuelCost = (text) => {
  const patterns = [
    /amount\s*[:\-]?\s*(?:php|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /total\s*\(?(?:incl\.?|including)?\s*vat\)?\s*[:\-]?\s*(?:php|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /grand\s*total\s*[:\-]?\s*(?:php|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /total\s*[:\-]?\s*(?:php|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanNumber(match[1]);
    }
  }

  return "";
};

/*
 * =========================================================
 * PARSE RECEIPT
 * =========================================================
 */

const parseFuelReceipt = (rawText) => {
  const text = normalizeText(rawText);

  return {
    fuelStation:
      extractFuelStation(text),

    fuelLiters:
      extractFuelLiters(text),

    fuelCost:
      extractFuelCost(text),
  };
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const FuelReceiptOCRScanner = ({
  open,
  onClose,
  onExtract,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [ocrError, setOcrError] =
    useState("");

  const [processing, setProcessing] =
    useState(false);

  const [rawText, setRawText] =
    useState("");

  const [result, setResult] =
    useState({
      fuelStation: "",
      fuelLiters: "",
      fuelCost: "",
    });

  /*
   * =========================================================
   * CAMERA
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    setCameraError("");
    setCameraReady(false);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Camera access is not supported by this browser."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
              width: {
                ideal: 1920,
              },
              height: {
                ideal: 1080,
              },
            },
            audio: false,
          }
        );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        setCameraReady(true);
      }
    } catch (error) {
      console.error(
        "Receipt OCR camera error:",
        error
      );

      setCameraError(
        "Unable to access the camera. Please allow camera permission and try again."
      );
    }
  };

  /*
   * =========================================================
   * STOP CAMERA
   * =========================================================
   */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  /*
   * =========================================================
   * CAPTURE RECEIPT + OCR
   * =========================================================
   */

  const captureReceipt = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      processing
    ) {
      return;
    }

    setProcessing(true);
    setOcrError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        throw new Error(
          "Camera frame is not ready."
        );
      }

      canvas.width = width;
      canvas.height = height;

      const context =
        canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Unable to access canvas."
        );
      }

      /*
       * Capture current camera frame.
       */

      context.drawImage(
        video,
        0,
        0,
        width,
        height
      );

      const image =
        canvas.toDataURL(
          "image/jpeg",
          0.95
        );

      /*
       * Create OCR worker once.
       */

      if (!workerRef.current) {
        workerRef.current =
          await createWorker("eng");
      }

      const ocrResult =
        await workerRef.current.recognize(
          image
        );

      const text =
        ocrResult?.data?.text || "";

      console.log(
        "===== RECEIPT OCR TEXT ====="
      );

      console.log(text);

      setRawText(text);

      /*
       * Extract only the fields needed
       * by the existing Fuel Monitoring form.
       */

      const extracted =
        parseFuelReceipt(text);

      console.log(
        "===== OCR EXTRACTED DATA ====="
      );

      console.log(extracted);

      setResult(extracted);
    } catch (error) {
      console.error(
        "Receipt OCR error:",
        error
      );

      setOcrError(
        "Unable to read the receipt clearly. Try positioning the receipt inside the guide and scan again."
      );
    } finally {
      setProcessing(false);
    }
  };

  /*
   * =========================================================
   * APPLY OCR VALUES
   * =========================================================
   *
   * IMPORTANT:
   * This does NOT submit the transaction.
   *
   * It only fills the existing form.
   * =========================================================
   */

  const handleUseValues = () => {
    if (typeof onExtract === "function") {
      onExtract({
        fuelStation:
          result.fuelStation || "",

        fuelLiters:
          result.fuelLiters || "",

        fuelCost:
          result.fuelCost || "",
      });
    }

    if (typeof onClose === "function") {
      onClose();
    }
  };

  /*
   * =========================================================
   * RESET RESULTS
   * =========================================================
   */

  const handleClear = () => {
    setRawText("");

    setResult({
      fuelStation: "",
      fuelLiters: "",
      fuelCost: "",
    });

    setOcrError("");
  };

  /*
   * =========================================================
   * OCR CLEANUP
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current
          .terminate()
          .catch(() => {});

        workerRef.current = null;
      }

      stopCamera();
    };
  }, []);

  /*
   * =========================================================
   * DON'T RENDER WHEN CLOSED
   * =========================================================
   */

  if (!open) {
    return null;
  }

  const hasResult = Boolean(
    result.fuelStation ||
      result.fuelLiters ||
      result.fuelCost
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-950">
              <Receipt size={22} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-black">
                Scan Fuel Receipt
              </h2>

              <p className="mt-1 text-sm font-medium text-black">
                Position the fuel receipt clearly inside the camera frame.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-black transition hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Close"
          >
            <X size={21} />
          </button>

        </div>

        {/* =====================================================
            BODY
        ====================================================== */}

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2">

          {/* ===================================================
              CAMERA
          ==================================================== */}

          <div>

            <div className="relative overflow-hidden rounded-2xl bg-black">

              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-[4/3] w-full object-cover"
              />

              {/* GUIDE */}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="h-[78%] w-[82%] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.22)]" />

              </div>

              {!cameraReady &&
                !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">

                    <div className="text-center">

                      <Loader2
                        size={34}
                        className="mx-auto mb-3 animate-spin"
                      />

                      <p className="font-semibold">
                        Starting camera...
                      </p>

                    </div>

                  </div>
                )}

            </div>

            {cameraError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  {cameraError}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={captureReceipt}
                disabled={
                  !cameraReady ||
                  processing
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >

                {processing ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Reading Receipt...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Scan Receipt
                  </>
                )}

              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleClear}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <RotateCcw size={18} />
                Clear
              </button>

            </div>

            {ocrError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <p className="text-sm font-semibold text-amber-800">
                  {ocrError}
                </p>

              </div>
            )}

          </div>

          {/* ===================================================
              RESULTS
          ==================================================== */}

          <div className="flex min-h-0 flex-col">

            <div className="rounded-2xl border border-slate-200 bg-white">

              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

                <h3 className="font-extrabold text-black">
                  Extracted Fuel Information
                </h3>

                <p className="mt-1 text-sm font-medium text-black">
                  Review the detected values before applying them.
                </p>

              </div>

              <div className="space-y-4 p-5">

                {/* FUEL STATION */}

                <div>

                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-black">
                    Fuel Station
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={
                      result.fuelStation
                    }
                    placeholder="Not detected"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-black outline-none"
                  />

                </div>

                {/* FUEL LITERS */}

                <div>

                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-black">
                    Fuel Liters
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={
                      result.fuelLiters
                    }
                    placeholder="Not detected"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-black outline-none"
                  />

                </div>

                {/* FUEL COST */}

                <div>

                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-black">
                    Fuel Cost
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={
                      result.fuelCost
                    }
                    placeholder="Not detected"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-black outline-none"
                  />

                </div>

                {hasResult && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                    <div className="flex items-start gap-3">

                      <CheckCircle
                        size={20}
                        className="mt-0.5 shrink-0 text-blue-800"
                      />

                      <div>

                        <p className="text-sm font-extrabold text-black">
                          Receipt data detected
                        </p>

                        <p className="mt-1 text-sm font-medium text-black">
                          Verify the values before applying them to the form.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>
            </div>

            {rawText && (
              <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">

                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-black">
                  Show OCR text
                </summary>

                <pre className="max-h-52 overflow-auto border-t border-slate-200 p-4 text-xs leading-relaxed text-black">
                  {rawText}
                </pre>

              </details>
            )}

          </div>

        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              processing ||
              !hasResult
            }
            onClick={handleUseValues}
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            Use Extracted Values
          </button>

        </div>

        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>
    </div>
  );
};

/*
 * =========================================================
 * DEFAULT EXPORT
 * =========================================================
 */

export default FuelReceiptOCRScanner;