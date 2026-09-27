import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Order, OrderTableRow } from '../../models/order.model';
import { OrderStatusFormComponent } from '../order-status-form/order-status-form';
import { StatusBadgeComponent } from '../status-badge/status-badge';

@Component({
  selector: 'app-order-table',
  imports: [DecimalPipe, StatusBadgeComponent, OrderStatusFormComponent],
  templateUrl: './order-table.html',
  styleUrl: './order-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderTableComponent {
  readonly orders = input.required<readonly OrderTableRow[]>();
  /** Unique per table instance to keep accessible help/detail IDs distinct. */
  readonly tableId = input.required<string>();
  readonly expandedRow = input<number | null>(null);
  readonly detailsRequested = output<number>();
  readonly detail = input<OrderTableRow | null>(null);
  readonly detailState = input<'idle' | 'loading' | 'normal' | 'error'>('idle');
  readonly saveState = input<'idle' | 'saving' | 'success' | 'error'>('idle');
  readonly detailRetry = output<void>();
  readonly statusRequested = output<Order['status']>();
}
