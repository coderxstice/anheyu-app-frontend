/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * 在 frontend 目录运行：
 * node --expose-gc "src/providers/query-provider.ssr.bench.cjs"
 * 仅进行 React SSR，不访问后端；before 在内存中恢复原 gcTime 配置。
 */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { useQuery, timeoutManager } = require("@tanstack/react-query");

if (!global.gc) throw new Error("请使用 node --expose-gc 运行");
const providerPath = path.join(__dirname, "query-provider.tsx");
const source = fs.readFileSync(providerPath, "utf8");
const previousSource = source.replace(
  'gcTime: typeof window === "undefined" ? Infinity : 1000 * 60 * 60,',
  "gcTime: 1000 * 60 * 60,"
);
if (previousSource === source) throw new Error("未找到 SSR gcTime 配置，需更新基准的历史实现");

function loadProvider(providerSource) {
  const compiled = ts.transpileModule(providerSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const providerModule = new Module(providerPath, module);
  providerModule.filename = providerPath;
  providerModule.paths = Module._nodeModulePaths(__dirname);
  providerModule._compile(compiled.outputText, providerPath);
  return providerModule.exports.QueryProvider;
}

const setNodeTimeout = global.setTimeout;
const clearNodeTimeout = global.clearTimeout;
const timers = new Set();
let queryExecutions = 0;
timeoutManager.setTimeoutProvider({
  setTimeout(callback, delay) {
    const timer = setNodeTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    // 保留真实定时器及闭包，允许诊断进程正常退出。
    timer.unref();
    timers.add(timer);
    return timer;
  },
  clearTimeout(timer) {
    timers.delete(timer);
    clearNodeTimeout(timer);
  },
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
});

function QueryContent({ index }) {
  useQuery({
    queryKey: ["ssr-benchmark", index],
    queryFn: async () => {
      queryExecutions++;
      return index;
    },
  });
  return React.createElement("span", null, "loading");
}

function clearTimers() {
  for (const timer of timers) clearNodeTimeout(timer);
  timers.clear();
}

function measure(Provider) {
  clearTimers();
  global.gc();
  const initialHeap = process.memoryUsage().heapUsed;
  const initialExecutions = queryExecutions;
  const started = performance.now();
  for (let request = 0; request < 1000; request++) {
    renderToString(
      React.createElement(
        Provider,
        null,
        Array.from({ length: 10 }, (_, index) => React.createElement(QueryContent, { key: index, index }))
      )
    );
  }
  global.gc();
  return {
    requests: 1000,
    queriesPerRequest: 10,
    retainedTimers: timers.size,
    retainedHeapBytes: process.memoryUsage().heapUsed - initialHeap,
    elapsedMs: Math.round(performance.now() - started),
    queryExecutions: queryExecutions - initialExecutions,
  };
}

try {
  const PreviousProvider = loadProvider(previousSource);
  const CurrentProvider = loadProvider(source);
  console.log(JSON.stringify({
    before: measure(PreviousProvider),
    after: measure(CurrentProvider),
  }, null, 2));
} finally {
  clearTimers();
}
