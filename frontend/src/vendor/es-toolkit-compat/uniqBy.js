export function uniqBy(array, iteratee) {
  if (!array) return [];
  const fn = typeof iteratee === 'function' ? iteratee : (item) => (item != null ? item[iteratee] : item);
  const seen = new Set();
  const result = [];
  for (const item of array) {
    const key = fn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export default uniqBy;

