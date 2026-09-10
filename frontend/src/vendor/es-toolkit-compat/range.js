export function range(start, end, step) {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  step = step === undefined ? (start < end ? 1 : -1) : step;
  const result = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else if (step < 0) {
    for (let i = start; i > end; i += step) result.push(i);
  }
  return result;
}

export default range;

