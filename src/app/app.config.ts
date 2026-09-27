import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockOrdersInterceptor } from './services/mock-orders.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([mockOrdersInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
