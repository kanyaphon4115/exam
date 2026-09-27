/** One product row, matching the existing Order List mock data. */
export interface Order {
  readonly id: number;
  readonly shop: string;
  readonly status: 'ชำระเงินแล้ว' | 'ส่งของแล้ว';
  /** Gregorian date in YYYY-MM-DD format. */
  readonly date: string;
  /** Local wall-clock time in HH:mm:ss format. */
  readonly time: string;
  readonly number: string;
  readonly item: string;
  readonly option: string;
  readonly quantity: number;
  /** Line subtotal, already including quantity; monetary values use two decimals. */
  readonly total: number;
  readonly shipping: number;
  readonly discount: number;
  /** Original supplied value; transformations recalculate rather than trust it. */
  readonly net: number;
}

export interface OrderGroup {
  readonly number: string;
  readonly items: readonly Order[];
  readonly netTotal: number;
}

export interface OrderTableRow extends Order {
  readonly thaiDate: string;
}

export interface OrderQuery {
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly status?: Order['status'];
  /** One-based page; mock page size is 10. */
  readonly page?: number;
}
