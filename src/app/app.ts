import { Component } from '@angular/core';
import { OrderListComponent } from './order-list/order-list';

@Component({
  imports: [OrderListComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
