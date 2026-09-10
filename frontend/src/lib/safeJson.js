// Safe JSON polyfill and cycle protection
// Prevents "TypeError: cyclic object value" / "TypeError: Converting circular structure to JSON"
// across the entire application, third-party libraries, and iframe loggers.

if (typeof window !== "undefined" && typeof JSON !== "undefined") {
  const originalStringify = JSON.stringify;

  JSON.stringify = function (value, replacer, space) {
    try {
      const seen = new WeakSet();
      return originalStringify(
        value,
        function (key, val) {
          if (typeof val === "object" && val !== null) {
            // Avoid serializing DOM elements or events directly
            if (typeof HTMLElement !== "undefined" && val instanceof HTMLElement) {
              return `[Element <${val.tagName.toLowerCase()}>]`;
            }
            if (typeof Event !== "undefined" && val instanceof Event) {
              return `[Event ${val.type}]`;
            }
            if (val.nativeEvent) {
              return "[SyntheticEvent]";
            }
            if (seen.has(val)) {
              return "[Circular]";
            }
            seen.add(val);
          }
          if (typeof replacer === "function") {
            return replacer.call(this, key, val);
          }
          if (Array.isArray(replacer) && key !== "" && !replacer.includes(key)) {
            return undefined;
          }
          return val;
        },
        space
      );
    } catch {
      try {
        return originalStringify(
          {
            _notice: "Cyclic or complex object safely serialized",
            type: typeof value,
          },
          null,
          space
        );
      } catch {
        return "\"[Unserializable Object]\"";
      }
    }
  };
}

export const safeJsonStringify = (val, space = 2) => {
  try {
    return JSON.stringify(val, null, space);
  } catch {
    return "[Unserializable]";
  }
};

