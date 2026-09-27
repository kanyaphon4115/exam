import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { buddhistDateToIso, buddhistDateValidator, dateRangeValidator, supportedStatusValidator } from '../utils/order-validators';
import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, PendingTasks, signal, viewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, timer, defer, filter, EMPTY, exhaustMap, finalize, map, merge, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { OrderTableComponent } from '../components/order-table/order-table';
import type { Order, OrderTableRow } from '../models/order.model';
import { OrderService } from '../services/order.service';
import { calculateNetTotal, formatThaiDateTime, groupOrdersByNumber } from '../utils/order-transform';

@Component({
  selector: 'app-order-dashboard',
  imports: [DecimalPipe, OrderTableComponent, ReactiveFormsModule],
  templateUrl: './order-dashboard.html',
  styleUrl: './order-dashboard.css',
})
export class OrderDashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly orders = signal<readonly Order[]>([]);
  readonly state = signal<'normal' | 'loading' | 'error'>('loading');
  readonly filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    status: new FormControl('', { nonNullable: true, validators: [supportedStatusValidator] }),
    dateFrom: new FormControl('', { nonNullable: true, validators: [buddhistDateValidator] }),
    dateTo: new FormControl('', { nonNullable: true, validators: [buddhistDateValidator] }),
  }, { validators: dateRangeValidator });
  private query = '';
  private appliedSearch = '';
  private readonly searchTerms = new Subject<string>();
  private readonly reload = new Subject<HTMLInputElement>();
  private finishDebounce?: () => void;
  protected readonly expandedRow = signal<number | null>(null);
  protected readonly detail = signal<OrderTableRow | null>(null);
  protected readonly detailState = signal<'idle' | 'loading' | 'normal' | 'error'>('idle');
  protected readonly saveState = signal<'idle' | 'saving' | 'success' | 'error'>('idle');
  private readonly detailRequests = new Subject<number | null>();
  private readonly statusRequests = new Subject<Order['status']>();
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
    this.detailRequests.pipe(
      switchMap(id => {
        this.expandedRow.set(id);
        this.detail.set(null);
        this.saveState.set('idle');
        this.detailState.set(id === null ? 'idle' : 'loading');
        if (id === null) return EMPTY;
        return defer(() => {
          const done = this.pendingTasks.add();
          return this.orderService.getOrderById(id).pipe(
            tap(order => {
              this.detail.set(this.toTableRow(order));
              this.detailState.set('normal');
            }),
            catchError(() => {
              this.detailState.set('error');
              return EMPTY;
            }),
            finalize(done),
          );
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.statusRequests.pipe(
      exhaustMap(status => {
        const order = this.detail();
        if (!order) return EMPTY;
        this.saveState.set('saving');
        let result: 'idle' | 'success' | 'error' = 'idle';
        const done = this.pendingTasks.add();
        return this.orderService.updateOrderStatus(order.id, status).pipe(
          tap(updated => {
            this.orders.update(orders => orders.map(item => item.id === updated.id ? updated : item));
            this.detail.set(this.toTableRow(updated));
            result = 'success';
          }),
          catchError(() => {
            result = 'error';
            return EMPTY;
          }),
          takeUntil(this.detailRequests),
          finalize(() => {
            if (this.saveState() === 'saving') this.saveState.set(result);
            done();
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    const searches = this.searchTerms.pipe(
      switchMap(search => timer(300).pipe(map(() => search), takeUntil(this.reload))),
      tap(() => {
        this.finishDebounce?.();
        this.finishDebounce = undefined;
      }),
      filter(search => search !== this.appliedSearch),
      map(search => ({ search, focus: undefined as HTMLInputElement | undefined })),
    );
    merge(
      of({ search: '', focus: undefined as HTMLInputElement | undefined }),
      searches,
      this.reload.pipe(map(focus => ({ search: this.query, focus }))),
    ).pipe(
      filter(() => this.filterForm.valid),
      switchMap(({ search, focus }) => defer(() => {
        this.appliedSearch = search;
        this.state.set('loading');
        this.detailRequests.next(null);
        const done = this.pendingTasks.add();
        this.finishDebounce?.();
        this.finishDebounce = undefined;
        const { status, dateFrom, dateTo } = this.filterForm.getRawValue();
        return this.orderService.getOrders({
          search,
          ...(status ? { status: status as Order['status'] } : {}),
          ...(dateFrom ? { dateFrom: buddhistDateToIso(dateFrom)! } : {}),
          ...(dateTo ? { dateTo: buddhistDateToIso(dateTo)! } : {}),
          page: 1,
        }).pipe(
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

  protected submitFilters(searchInput: HTMLInputElement): void {
    this.filterForm.controls.search.setValue(this.filterForm.controls.search.value.trim());
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) return;
    this.query = this.filterForm.controls.search.value.toLowerCase();
    this.reload.next(searchInput);
  }

  protected resetFilters(searchInput: HTMLInputElement): void {
    this.filterForm.reset();
    this.query = '';
    this.reload.next(searchInput);
  }

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected retrySearch(): void {
    const input = this.searchInput()?.nativeElement;
    if (input) this.retry(input);
  }

  protected retry(searchInput: HTMLInputElement): void {
    if (this.state() !== 'loading' && this.filterForm.valid) this.reload.next(searchInput);
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
    this.detailRequests.next(this.expandedRow() === id ? null : id);
  }

  protected retryDetails(): void {
    const id = this.expandedRow();
    if (id !== null && this.detailState() !== 'loading') this.detailRequests.next(id);
  }

  protected saveStatus(status: Order['status']): void {
    this.statusRequests.next(status);
  }

  private toTableRow(order: Order): OrderTableRow {
    return { ...order, net: calculateNetTotal([order]), thaiDate: formatThaiDateTime(`${order.date} ${order.time}`) };
  }
}
