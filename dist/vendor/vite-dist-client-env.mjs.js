const context = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  } else if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();
const defines = {"__DEV__": true, "__PROD__": false, "process.env.VITE_API_BASE_URL": "http://localhost:5000/api", "process.env.VITE_DEBUG": true, "process.env.VITE_ENVIRONMENT": "development", "process.env.VITE_LOG_LEVEL": "debug"};
Object.keys(defines).forEach((key) => {
  const segments = key.split(".");
  let target = context;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i === segments.length - 1) {
      target[segment] = defines[key];
    } else {
      target = target[segment] || (target[segment] = {});
    }
  }
});
