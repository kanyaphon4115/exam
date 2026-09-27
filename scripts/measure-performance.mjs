// Usage: node scripts/measure-performance.mjs /path/to/agent-browser.js before|after
// Start npm start first. The browser dependency is external; no package installation needed.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [cli, phase] = process.argv.slice(2);
if (!cli || !['before', 'after'].includes(phase)) throw new Error('Provide agent-browser.js path and before|after');
function browser(args, input) {
  const result = spawnSync(process.execPath, [cli, '--session', 'order-performance', ...args], {
    input, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

browser(['open', 'http://127.0.0.1:4200/?perf=5000']);
browser(['set', 'viewport', '1440', '900']);
const raw = browser(['eval', '--stdin'], `
(async () => {
  const waitFor = async (predicate) => {
    const start = performance.now();
    while (!predicate()) {
      if (performance.now() - start > 60000) throw new Error('Measurement timed out');
      await new Promise(requestAnimationFrame);
    }
  };
  await waitFor(() => window.__orderPerformance?.renders.length > 0);
  const metrics = window.__orderPerformance;
  const initial = structuredClone(metrics);
  const submit = () => document.querySelector('search form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}));
  const settle = async () => {
    // The call starts synchronously on submit; await the DOM only if a request began.
    await waitFor(() => !document.querySelector('[aria-busy=true]'));
    await new Promise(requestAnimationFrame);
  };
  const callsBeforeSubmit = metrics.apiCalls.length;
  submit(); await settle(); submit(); await settle();
  const repeatedSubmitCalls = metrics.apiCalls.length - callsBeforeSubmit;
  const callsBeforeSearch = metrics.apiCalls.length;
  const search = document.getElementById('order-search');
  for (const value of ['I','Ic','Ico','Icom','Icomputer']) {
    search.value = value;
    search.dispatchEvent(new Event('input', {bubbles:true}));
  }
  await waitFor(() => metrics.apiCalls.length > callsBeforeSearch);
  await settle();
  const rapidSearchCalls = metrics.apiCalls.length - callsBeforeSearch;
  const detailButton = () => document.querySelector('tbody button');
  const callsBeforeDetails = metrics.apiCalls.length;
  detailButton().click();
  await waitFor(() => document.querySelector('app-order-status-form'));
  detailButton().click(); await new Promise(requestAnimationFrame);
  detailButton().click();
  await waitFor(() => document.querySelector('app-order-status-form'));
  return {browser:navigator.userAgent, timestamp:new Date().toISOString(), dataset:5000,
    viewport:{width:innerWidth,height:innerHeight}, initial, repeatedSubmitCalls, rapidSearchCalls,
    repeatedDetailCalls:metrics.apiCalls.length-callsBeforeDetails, all:structuredClone(metrics)};
})()
`);
const data = JSON.parse(raw);
writeFileSync(`docs/performance-${phase}.json`, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data, null, 2));
browser(['close']);
