const { format } = require('date-fns');
const crypto = require('crypto');

/**
 * Generate a unique receipt number (e.g., REM-YYYYMMDD-XXXXXX)
 */
function generateReceiptNumber(remittanceId) {
  const datePart = format(new Date(), 'yyyyMMdd');
  const hash = crypto.createHash('md5').update(remittanceId + Date.now()).digest('hex').slice(0, 6).toUpperCase();
  return `REM-${datePart}-${hash}`;
}

/**
 * Format receipt data for PDF/thermal printing
 * @param {Object} params
 * @param {Object} params.driver
 * @param {Object} params.unit
 * @param {Object} params.remittance
 * @param {Object} params.schedule
 * @returns {Object} structured receipt data
 */
function formatReceipt({ driver, unit, remittance, schedule }) {
  return {
    receiptNumber: remittance.receiptNumber,
    driver: {
      name: driver?.name || '',
      id: driver?._id?.toString() || '',
      ...(driver?.licenseNumber && { licenseNumber: driver.licenseNumber }),
    },
    unit: {
      name: unit?.name || '',
      id: unit?._id?.toString() || '',
      ...(unit?.plateNumber && { plateNumber: unit.plateNumber }),
    },
    schedule: {
      id: schedule?._id?.toString() || '',
      date: schedule?.date ? format(new Date(schedule.date), 'yyyy-MM-dd') : '',
    },
    breakdown: {
  totalEarnings: remittance.totalEarnings || 0,
  baseSalary: remittance.baseSalary || 0,

  totalExpense:
    remittance.totalExpense ??
    remittance.totalExpenses ??
    0,

  totalFuelDeduction:
    remittance.totalFuelDeduction ??
    remittance.fuelDeduction ??
    0,

  totalSalaryDeduction:
    remittance.totalSalaryDeduction ??
    remittance.salaryDeduction ??
    0,

  cooperativeIncome: remittance.cooperativeIncome || 0,
  driverNetIncome: remittance.driverNetIncome || 0,
  remainingBalance: remittance.remainingBalance || 0,

  hasNegativeBalance:
    remittance.hasNegativeBalance ||
    remittance.negativeBalance > 0,
    },
    verification: {
      status: remittance.verificationStatus,
      verifiedBy: remittance.verifiedBy || '',
      verificationTimestamp: remittance.verificationTimestamp
        ? format(new Date(remittance.verificationTimestamp), 'yyyy-MM-dd HH:mm:ss')
        : '',
    },
    timestamps: {
      createdAt: format(new Date(remittance.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(new Date(remittance.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
    },
  };
}

/**
 * Generate a printable receipt string (thermal-printer friendly)
 * @param {Object} receiptData - output of formatReceipt
 * @returns {string}
 */
function generatePrintableReceipt(receiptData) {
  const {
    receiptNumber,
    driver,
    unit,
    schedule,
    breakdown,
    verification,
    timestamps,
  } = receiptData;
  return [
    '*** REMITTANCE RECEIPT ***',
    `Receipt #: ${receiptNumber}`,
    `Date: ${timestamps.createdAt}`,
    '',
    `Driver: ${driver.name} (${driver.id})`,
    driver.licenseNumber ? `License: ${driver.licenseNumber}` : '',
    `Unit: ${unit.name} (${unit.id})`,
    unit.plateNumber ? `Plate: ${unit.plateNumber}` : '',
    `Schedule: ${schedule.date}`,
    '',
    '--- Breakdown ---',
    `Total Earnings: ₱${(breakdown.totalEarnings || 0).toFixed(2)}`,
    `Base Salary: ₱${(breakdown.baseSalary || 0).toFixed(2)}`,
    `Fuel Deduction: ₱${(breakdown.totalFuelDeduction || 0).toFixed(2)}`,
    `Salary Deduction: ₱${(breakdown.totalSalaryDeduction || 0).toFixed(2)}`,
    `Other Expenses: ₱${((breakdown.totalExpense || 0) - (breakdown.totalFuelDeduction || 0)).toFixed(2)}`,
    `Coop Income: ₱${(breakdown.cooperativeIncome || 0).toFixed(2)}`,
    `Net Income: ₱${(breakdown.driverNetIncome || 0).toFixed(2)}`,
    `Remaining Balance: ₱${(breakdown.remainingBalance || 0).toFixed(2)}`,
    breakdown.hasNegativeBalance ? 'WARNING: NEGATIVE BALANCE!' : '',
    '',
    `Verification: ${verification.status}`,
    verification.verifiedBy ? `By: ${verification.verifiedBy}` : '',
    verification.verificationTimestamp ? `At: ${verification.verificationTimestamp}` : '',
    '',
    `Created: ${timestamps.createdAt}`,
    `Updated: ${timestamps.updatedAt}`,
    '--------------------------',
    'Thank you!',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  generateReceiptNumber,
  formatReceipt,
  generatePrintableReceipt,
};
