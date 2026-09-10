export function maxBy(array, iteratee) {
  if (!array || !array.length) return undefined;
  const fn = typeof iteratee === 'function' ? iteratee : (item) => (item != null ? item[iteratee] : undefined);
  let maxItem = array[0];
  let maxValue = fn(maxItem);
  for (let i = 1; i < array.length; i++) {
    const val = fn(array[i]);
    if (val != null && (maxValue == null || val > maxValue)) {
      maxValue = val;
      maxItem = array[i];
    }
  }
  return maxItem;
}

export default maxBy;

