export function minBy(array, iteratee) {
  if (!array || !array.length) return undefined;
  const fn = typeof iteratee === 'function' ? iteratee : (item) => (item != null ? item[iteratee] : undefined);
  let minItem = array[0];
  let minValue = fn(minItem);
  for (let i = 1; i < array.length; i++) {
    const val = fn(array[i]);
    if (val != null && (minValue == null || val < minValue)) {
      minValue = val;
      minItem = array[i];
    }
  }
  return minItem;
}

export default minBy;

