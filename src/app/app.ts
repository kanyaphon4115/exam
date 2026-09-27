import { Component } from '@angular/core';
import { OrderDashboardComponent } from './order-dashboard/order-dashboard';

@Component({
  imports: [OrderDashboardComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
