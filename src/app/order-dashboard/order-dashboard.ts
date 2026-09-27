import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { buddhistDateToIso, buddhistDateValidator, dateRangeValidator, supportedStatusValidator } from '../utils/order-validators';
import { DecimalPipe } from '@angular/common';
import { afterEveryRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, PendingTasks, signal, viewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, defer, filter, EMPTY, exhaustMap, finalize, map, merge, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { OrderTableComponent } from '../components/order-table/order-table';
import type { Order, OrderQuery, OrderTableRow } from '../models/order.model';
import { OrderService } from '../services/order.service';
import { PerformanceMetrics } from '../services/performance-metrics';
import { calculateNetTotal, formatThaiDateTime, groupOrdersByNumber } from '../utils/order-transform';

@Component({
  selector: 'app-order-dashboard',
  imports: [DecimalPipe, OrderTableComponent, ReactiveFormsModule],
  templateUrl: './order-dashboard.html',
  styleUrl: './order-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly metrics = inject(PerformanceMetrics);
  protected readonly performanceMode = this.metrics.enabled;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
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
  private appliedQuery: OrderQuery | null = null;
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / 50)));
  protected readonly firstItem = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * 50 + 1);
  protected readonly lastItem = computed(() => Math.min(this.page() * 50, this.total()));
  private readonly searchTerms = new Subject<string>();
  private readonly reload = new Subject<{ focus?: HTMLInputElement; refresh: boolean; query?: OrderQuery }>();
  private finishDebounce?: () => void;
  protected readonly expandedRow = signal<number | null>(null);
  protected readonly detail = signal<OrderTableRow | null>(null);
  protected readonly detailState = signal<'idle' | 'loading' | 'normal' | 'error'>('idle');
  protected readonly saveState = signal<'idle' | 'saving' | 'success' | 'error'>('idle');
  private readonly detailRequests = new Subject<number | null>();
  private readonly statusRequests = new Subject<Order['status']>();
  protected readonly filteredOrders = this.orders.asReadonly();
  protected readonly orderGroups = computed(() => this.metrics.measure('group', this.filteredOrders().length, () => groupOrdersByNumber(this.filteredOrders())));
  protected readonly netTotal = computed(() => calculateNetTotal(this.filteredOrders()));
  protected readonly displayOrders = computed<readonly OrderTableRow[]>(() =>
    this.metrics.measure('rows', this.filteredOrders().length, () => this.filteredOrders().map(order => ({
      ...order,
      net: calculateNetTotal([order]),
      thaiDate: formatThaiDateTime(`${order.date} ${order.time}`),
    }))),
  );

  constructor() {
    afterEveryRender(() => this.metrics.rendered(this.element.nativeElement));
  }

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

    const searches = merge(this.searchTerms, this.reload.pipe(map(() => null))).pipe(
      // A submit/reset replaces a pending term with null, preventing a delayed stale search.
      debounceTime(300),
      tap(() => {
        this.finishDebounce?.();
        this.finishDebounce = undefined;
      }),
      filter((search): search is string => search !== null),
      map(search => ({ query: this.filterQuery(search), refresh: false, focus: undefined as HTMLInputElement | undefined })),
    );
    merge(
      of({ query: this.filterQuery(''), refresh: false, focus: undefined as HTMLInputElement | undefined }),
      searches,
      this.reload.pipe(map(event => ({ ...event, query: event.query ?? this.filterQuery(this.query) }))),
    ).pipe(
      filter(() => this.filterForm.valid),
      // Compare the whole normalized query, including page, across every trigger.
      // Retry/refresh and recovery after an error intentionally bypass this guard.
      distinctUntilChanged((previous, next) => !next.refresh && this.state() !== 'error'
        && JSON.stringify(previous.query) === JSON.stringify(next.query)),
      switchMap(({ query, focus, refresh }) => defer(() => {
        this.appliedQuery = query;
        this.page.set(query.page ?? 1);
        this.state.set('loading');
        this.detailRequests.next(null);
        const done = this.pendingTasks.add();
        this.finishDebounce?.();
        this.finishDebounce = undefined;
        return this.orderService.getOrdersPage(query, refresh).pipe(
          tap(result => {
            this.metrics.beginRender();
            this.orders.set(result.items);
            this.total.set(result.total);
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
    this.finishDebounce?.();
    this.finishDebounce = undefined;
    this.reload.next({ focus: searchInput, refresh: false });
  }

  protected resetFilters(searchInput: HTMLInputElement): void {
    this.filterForm.reset();
    this.query = '';
    this.finishDebounce?.();
    this.finishDebounce = undefined;
    this.reload.next({ focus: searchInput, refresh: true });
  }

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected retrySearch(): void {
    const input = this.searchInput()?.nativeElement;
    if (input) this.retry(input);
  }

  protected retry(searchInput: HTMLInputElement): void {
    if (this.state() !== 'loading' && this.filterForm.valid) {
      this.reload.next({ focus: searchInput, refresh: true, query: this.appliedQuery ?? undefined });
    }
  }

  protected changePage(page: number): void {
    if (this.state() === 'loading' || this.filterForm.invalid || page < 1 || page > this.pageCount() || !this.appliedQuery) return;
    this.reload.next({ refresh: false, query: { ...this.appliedQuery, page } });
  }

  private filterQuery(search: string): OrderQuery {
    const { status, dateFrom, dateTo } = this.filterForm.getRawValue();
    return {
      search,
      ...(status ? { status: status as Order['status'] } : {}),
      ...(dateFrom ? { dateFrom: buddhistDateToIso(dateFrom)! } : {}),
      ...(dateTo ? { dateTo: buddhistDateToIso(dateTo)! } : {}),
      page: 1,
    };
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
