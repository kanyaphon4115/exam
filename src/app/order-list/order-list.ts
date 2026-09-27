import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import type { Order } from '../models/order';
import { calculateNetTotal, formatThaiDateTime, groupOrdersByNumber } from '../utils/order-transform';

@Component({
  selector: 'app-order-list',
  imports: [DecimalPipe],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderListComponent {
  // Public so mock UI states can also be exercised with Angular DevTools.
  readonly state = signal<'normal' | 'loading' | 'error'>('normal');
  private readonly destroyRef = inject(DestroyRef);
  private reloadTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.reloadTimer));
  }

  protected retry(searchInput: HTMLInputElement): void {
    if (this.state() === 'loading') return;
    this.state.set('loading');
    this.expandedRow.set(null);
    clearTimeout(this.reloadTimer);
    // Simulate loading local mock data; no network request is made.
    this.reloadTimer = setTimeout(() => {
      this.state.set('normal');
      searchInput.focus();
    }, 600);
  }

  protected readonly query = signal('');
  protected readonly expandedRow = signal<number | null>(null);
  protected readonly orders: readonly Order[] = [
    { id: 2, shop: 'IT24H Star', status: 'ชำระเงินแล้ว', date: '2021-02-01', time: '10:10:12', number: 'TH202102143', item: 'Apple Magic Mouse', option: 'สีเงิน', quantity: 1, total: 2200, shipping: 30, discount: 0, net: 2230 },
    { id: 4, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'Keyboard ไร้สาย', option: 'สีดำ', quantity: 1, total: 9190, shipping: 15, discount: 30, net: 9175 },
    { id: 5, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'แผ่นรองเมาส์', option: 'ขนาดใหญ่', quantity: 1, total: 560, shipping: 15, discount: 0, net: 575 },
  ];
  protected readonly filteredOrders = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.orders.filter(order =>
      order.shop.toLowerCase().includes(query) || order.number.toLowerCase().includes(query),
    );
  });

  protected readonly orderGroups = computed(() => groupOrdersByNumber(this.filteredOrders()));
  protected readonly netTotal = computed(() => calculateNetTotal(this.filteredOrders()));
  protected readonly displayOrders = computed(() => this.filteredOrders().map(order => ({
    ...order,
    net: calculateNetTotal([order]),
    thaiDate: formatThaiDateTime(`${order.date} ${order.time}`),
  })));

  protected toggleDetails(id: number): void {
    this.expandedRow.update(current => current === id ? null : id);
  }
}
