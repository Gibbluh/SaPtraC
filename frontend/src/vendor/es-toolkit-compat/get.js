export function get(obj, path, defaultValue) {
  if (!obj) return defaultValue;
  const keys = Array.isArray(path) ? path : String(path).replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

export default get;

