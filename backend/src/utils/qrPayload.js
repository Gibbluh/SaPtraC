function buildEntityQRPayload(type, id) {
  if (!type || !id) {
    throw new Error("QR payload requires both type and id.");
  }

  const baseUrl = (process.env.QR_PUBLIC_BASE_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("QR_PUBLIC_BASE_URL or FRONTEND_URL must be configured.");
  }

  if (type === "driver") return `${baseUrl}/driver/${String(id)}`;
  if (type === "unit") return `${baseUrl}/unit/${String(id)}`;

  throw new Error(`Unsupported QR payload type: ${type}`);
}

function decodeEntityQRPayload(code) {
  if (typeof code !== "string") {
    return code;
  }

  try {
    return JSON.parse(code);
  } catch {
    return code;
  }
}

function extractEntityId(payload, type) {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    const marker = type === "driver" ? "/driver/" : type === "unit" ? "/unit/" : null;
    if (marker && payload.includes(marker)) {
      return payload.split(marker)[1].split(/[?#]/)[0];
    }

    return null;
  }

  if (type === "driver") {
    return payload.driverId || payload.id || payload.entityId || null;
  }

  if (type === "unit") {
    return payload.unitId || payload.id || payload.entityId || null;
  }

  return payload.id || payload.entityId || null;
}

module.exports = {
  buildEntityQRPayload,
  decodeEntityQRPayload,
  extractEntityId,
};
