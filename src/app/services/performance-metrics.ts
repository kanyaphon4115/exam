import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PerformanceSnapshot {
  apiCalls: { method: string; url: string }[];
  transforms: { name: string; count: number; ms: number }[];
  renders: { orderRows: number; tableRows: number; ms: number }[];
}

@Injectable({ providedIn: 'root' })
export class PerformanceMetrics {
  readonly enabled = environment.performanceTesting && environment.mockApi.performanceTestMode;
  readonly data: PerformanceSnapshot = { apiCalls: [], transforms: [], renders: [] };
  private renderStart: number | null = null;

  constructor() {
    if (this.enabled) {
      (window as Window & { __orderPerformance?: PerformanceSnapshot }).__orderPerformance = this.data;
    }
  }

  request(method: string, url: string): void {
    if (this.enabled) this.data.apiCalls.push({ method, url });
  }

  measure<T>(name: string, count: number, work: () => T): T {
    if (!this.enabled) return work();
    const start = performance.now();
    const value = work();
    this.data.transforms.push({ name, count, ms: performance.now() - start });
    return value;
  }

  beginRender(): void {
    if (this.enabled) this.renderStart = performance.now();
  }

  rendered(element: HTMLElement): void {
    if (this.renderStart === null) return;
    this.data.renders.push({
      orderRows: element.querySelectorAll('tbody tr:not(.details-row)').length,
      tableRows: element.querySelectorAll('tbody tr').length,
      ms: performance.now() - this.renderStart,
    });
    this.renderStart = null;
  }
}
