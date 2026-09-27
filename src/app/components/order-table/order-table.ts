import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { OrderTableRow } from '../../models/order.model';
import { StatusBadgeComponent } from '../status-badge/status-badge';

@Component({
  selector: 'app-order-table',
  imports: [DecimalPipe, StatusBadgeComponent],
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
}
