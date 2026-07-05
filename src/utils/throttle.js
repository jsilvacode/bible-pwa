/**
 * @param {(...args: unknown[]) => void} fn
 * @param {number} waitMs
 */
export function throttle(fn, waitMs) {
  let last = 0;
  let pending = null;

  return (...args) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);

    if (remaining <= 0) {
      if (pending) {
        clearTimeout(pending);
        pending = null;
      }
      last = now;
      fn(...args);
      return;
    }

    if (!pending) {
      pending = setTimeout(() => {
        last = Date.now();
        pending = null;
        fn(...args);
      }, remaining);
    }
  };
}
