import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OrderTableComponent } from '../components/order-table/order-table';
import type { Order, OrderTableRow } from '../models/order.model';
import { OrderService } from '../services/order.service';
import { calculateNetTotal, formatThaiDateTime, groupOrdersByNumber } from '../utils/order-transform';

@Component({
  selector: 'app-order-dashboard',
  imports: [DecimalPipe, OrderTableComponent],
  templateUrl: './order-dashboard.html',
  styleUrl: './order-dashboard.css',
})
export class OrderDashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly orders = signal<readonly Order[]>([]);
  readonly state = signal<'normal' | 'loading' | 'error'>('loading');
  protected readonly query = signal('');
  protected readonly expandedRow = signal<number | null>(null);
  protected readonly filteredOrders = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.orders().filter(order =>
      order.shop.toLowerCase().includes(query) || order.number.toLowerCase().includes(query),
    );
  });
  protected readonly orderGroups = computed(() => groupOrdersByNumber(this.filteredOrders()));
  protected readonly netTotal = computed(() => calculateNetTotal(this.filteredOrders()));
  protected readonly displayOrders = computed<readonly OrderTableRow[]>(() =>
    this.filteredOrders().map(order => ({
      ...order,
      net: calculateNetTotal([order]),
      thaiDate: formatThaiDateTime(`${order.date} ${order.time}`),
    })),
  );

  ngOnInit(): void {
    this.loadOrders();
  }

  protected retry(searchInput: HTMLInputElement): void {
    if (this.state() !== 'loading') this.loadOrders(searchInput);
  }

  private loadOrders(searchInput?: HTMLInputElement): void {
    this.state.set('loading');
    this.expandedRow.set(null);
    const done = this.pendingTasks.add();
    this.orderService.getOrders().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(done),
    ).subscribe({
      next: orders => {
        this.orders.set(orders);
        this.state.set('normal');
        searchInput?.focus();
      },
      error: () => this.state.set('error'),
    });
  }

  protected toggleDetails(id: number): void {
    this.expandedRow.update(current => current === id ? null : id);
  }
}
