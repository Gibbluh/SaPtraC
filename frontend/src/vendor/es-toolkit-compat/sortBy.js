export function sortBy(array, iteratees) {
  if (!array) return [];
  const fns = (Array.isArray(iteratees) ? iteratees : [iteratees]).map(it =>
    typeof it === 'function' ? it : (item) => (item != null ? item[it] : undefined)
  );
  return [...array].sort((a, b) => {
    for (const fn of fns) {
      const valA = fn(a);
      const valB = fn(b);
      if (valA < valB) return -1;
      if (valA > valB) return 1;
    }
    return 0;
  });
}

export default sortBy;

