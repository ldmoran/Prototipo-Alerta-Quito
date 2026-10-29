import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { maquetaInterceptor } from './core/maqueta.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // PROTOTIPO: en lugar del servicio real, las llamadas a /api las responde una maqueta con datos de ejemplo.
    provideHttpClient(withInterceptors([maquetaInterceptor])),
  ],
};
