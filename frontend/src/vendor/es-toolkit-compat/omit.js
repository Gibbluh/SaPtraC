export function omit(obj, keys) {
  if (!obj) return {};
  const omitSet = new Set(Array.isArray(keys) ? keys : [keys]);
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!omitSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export default omit;

