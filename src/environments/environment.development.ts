// Development only: true = 5,000 generated orders; false = the original 3 orders.
export const PERFORMANCE_TEST_MODE = true;

export const environment = {
  performanceTesting: true,
  apiBaseUrl: '/api',
  mockApi: { enabled: true, latencyMs: 600, forceError: false, performanceTestMode: PERFORMANCE_TEST_MODE },
};
