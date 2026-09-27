import type { Order } from '../models/order.model';

export const MOCK_ORDERS: readonly Order[] = Object.freeze(([
    { id: 2, shop: 'IT24H Star', status: 'ชำระเงินแล้ว', date: '2021-02-01', time: '10:10:12', number: 'TH202102143', item: 'Apple Magic Mouse', option: 'สีเงิน', quantity: 1, total: 2200, shipping: 30, discount: 0, net: 2230 },
    { id: 4, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'Keyboard ไร้สาย', option: 'สีดำ', quantity: 1, total: 9190, shipping: 15, discount: 30, net: 9175 },
    { id: 5, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'แผ่นรองเมาส์', option: 'ขนาดใหญ่', quantity: 1, total: 560, shipping: 15, discount: 0, net: 575 },
  ] satisfies readonly Order[]).map(order => Object.freeze(order)));

