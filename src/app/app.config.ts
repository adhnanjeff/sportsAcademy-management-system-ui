import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { PreloadService } from './core/services/preload.service';
import { CacheService } from './core/services/cache.service';

/**
 * Initialize app by warming up backend and cleaning expired cache
 */
function initializeApp(preload: PreloadService, cache: CacheService) {
  return () => {
    // Warm up the backend (async, don't block app load)
    preload.warmUpBackend();
    // Clean up expired cache entries
    cache.cleanupExpired();
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const preload = inject(PreloadService);
        const cache = inject(CacheService);
        return initializeApp(preload, cache);
      },
      multi: true
    }
  ]
};
