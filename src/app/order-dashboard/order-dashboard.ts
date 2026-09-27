import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, defer, distinctUntilChanged, EMPTY, finalize, map, merge, of, Subject, switchMap, tap } from 'rxjs';
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
  private query = '';
  private readonly searchTerms = new Subject<string>();
  private readonly reload = new Subject<HTMLInputElement>();
  private finishDebounce?: () => void;
  protected readonly expandedRow = signal<number | null>(null);
  protected readonly filteredOrders = this.orders.asReadonly();
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
    const searches = this.searchTerms.pipe(
      debounceTime(300),
      tap(() => {
        this.finishDebounce?.();
        this.finishDebounce = undefined;
      }),
      distinctUntilChanged(),
      map(search => ({ search, focus: undefined as HTMLInputElement | undefined })),
    );
    merge(
      of({ search: '', focus: undefined as HTMLInputElement | undefined }),
      searches,
      this.reload.pipe(map(focus => ({ search: this.query, focus }))),
    ).pipe(
      switchMap(({ search, focus }) => defer(() => {
        this.state.set('loading');
        this.expandedRow.set(null);
        const done = this.pendingTasks.add();
        this.finishDebounce?.();
        this.finishDebounce = undefined;
        return this.orderService.getOrders({ search, page: 1 }).pipe(
          tap(orders => {
            this.orders.set(orders);
            this.state.set('normal');
            focus?.focus();
          }),
          // Catch inside switchMap so one error does not end future searches.
          catchError(() => {
            this.state.set('error');
            return EMPTY;
          }),
          finalize(done),
        );
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
    this.destroyRef.onDestroy(() => this.finishDebounce?.());
  }

  protected retry(searchInput: HTMLInputElement): void {
    if (this.state() !== 'loading') this.reload.next(searchInput);
  }

  protected search(value: string): void {
    const query = value.trim().toLowerCase();
    if (query === this.query) return;
    this.query = query;
    this.finishDebounce?.();
    this.finishDebounce = this.pendingTasks.add();
    this.searchTerms.next(query);
  }

  protected toggleDetails(id: number): void {
    this.expandedRow.update(current => current === id ? null : id);
  }
}
