import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Order } from '../../models/order.model';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class.paid]="status() === 'ชำระเงินแล้ว'"
    [class.shipped]="status() === 'ส่งของแล้ว'">{{ status() }}</span>`,
  styleUrl: './status-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<Order['status']>();
}
