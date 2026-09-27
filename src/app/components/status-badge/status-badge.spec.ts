import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  it('keeps readable status text when its input changes', async () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'ชำระเงินแล้ว');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.paid').textContent).toBe('ชำระเงินแล้ว');
    fixture.componentRef.setInput('status', 'ส่งของแล้ว');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.shipped').textContent).toBe('ส่งของแล้ว');
  });
});
