import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supportedStatusValidator } from '../../utils/order-validators';
import type { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-status-form',
  imports: [ReactiveFormsModule],
  templateUrl: './order-status-form.html',
  styleUrl: './order-status-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusFormComponent {
  readonly order = input.required<Order>();
  readonly controlId = input.required<string>();
  readonly state = input<'idle' | 'saving' | 'success' | 'error'>('idle');
  readonly statusSubmitted = output<Order['status']>();

  readonly statusForm = new FormGroup({
    status: new FormControl('', { nonNullable: true, validators: [Validators.required, supportedStatusValidator] }),
  });

  constructor() {
    effect(() => {
      const order = this.order();
      const state = this.state();
      if (state === 'saving') this.statusForm.disable({ emitEvent: false });
      else {
        this.statusForm.enable({ emitEvent: false });
        this.statusForm.reset({ status: order.status });
      }
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.statusForm.markAllAsTouched();
    const status = this.statusForm.controls.status.value;
    if (this.statusForm.valid && this.state() !== 'saving' && (status === 'ชำระเงินแล้ว' || status === 'ส่งของแล้ว')) {
      this.statusSubmitted.emit(status);
    }
  }
}
