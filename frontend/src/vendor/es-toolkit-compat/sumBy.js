export function sumBy(array, iteratee) {
  if (!array) return 0;
  const fn = typeof iteratee === 'function' ? iteratee : (item) => (item != null ? item[iteratee] : 0);
  return array.reduce((sum, item) => sum + (Number(fn(item)) || 0), 0);
}

export default sumBy;

