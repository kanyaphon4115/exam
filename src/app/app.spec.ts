import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockOrdersInterceptor } from './services/mock-orders.interceptor';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([mockOrdersInterceptor]))] }));
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Order Management Dashboard');
  });
});
