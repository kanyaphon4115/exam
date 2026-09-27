import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-status-form',
  templateUrl: './order-status-form.html',
  styleUrl: './order-status-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusFormComponent {
  readonly order = input.required<Order>();
  readonly controlId = input.required<string>();
  readonly state = input<'idle' | 'saving' | 'success' | 'error'>('idle');
  readonly statusSubmitted = output<Order['status']>();

  protected submit(event: Event, status: string): void {
    event.preventDefault();
    if (this.state() !== 'saving' && (status === 'ชำระเงินแล้ว' || status === 'ส่งของแล้ว')) {
      this.statusSubmitted.emit(status);
    }
  }
}
