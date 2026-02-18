import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, tap, switchMap, catchError, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

export interface CacheOptions {
  /** Cache key (defaults to endpoint) */
  key?: string;
  /** Time to live in milliseconds */
  ttl?: number;
  /** Skip cache and fetch fresh */
  skipCache?: boolean;
  /** Force refresh but still update cache */
  forceRefresh?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  private readonly baseUrl = environment.apiUrl;

  // In-flight request cache to prevent duplicate simultaneous requests
  private readonly inFlightRequests = new Map<string, Observable<unknown>>();

  /**
   * GET request with caching support
   */
  get<T>(endpoint: string, params?: HttpParams, cacheOptions?: CacheOptions): Observable<T> {
    const cacheKey = cacheOptions?.key || `GET:${endpoint}${params?.toString() || ''}`;
    const ttl = cacheOptions?.ttl || this.cache.CACHE_DURATIONS.MEDIUM;
    const skipCache = cacheOptions?.skipCache || false;
    const forceRefresh = cacheOptions?.forceRefresh || false;

    // If skip cache, just fetch
    if (skipCache) {
      return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params });
    }

    // Check if there's already an in-flight request for this key
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey) as Observable<T>;
    }

    // Create the request observable
    const request$ = from(this.cache.get<T>(cacheKey)).pipe(
      switchMap(cachedData => {
        // If we have cached data and not forcing refresh, return it
        if (cachedData && !forceRefresh) {
          // Still fetch in background to update cache (stale-while-revalidate)
          this.http.get<T>(`${this.baseUrl}${endpoint}`, { params }).pipe(
            tap(freshData => this.cache.set(cacheKey, freshData, ttl)),
            catchError(() => of(null))
          ).subscribe();
          
          return of(cachedData);
        }

        // Fetch fresh data
        return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params }).pipe(
          tap(data => this.cache.set(cacheKey, data, ttl))
        );
      }),
      tap(() => this.inFlightRequests.delete(cacheKey)),
      catchError(error => {
        this.inFlightRequests.delete(cacheKey);
        throw error;
      }),
      shareReplay(1)
    );

    this.inFlightRequests.set(cacheKey, request$);
    return request$;
  }

  /**
   * POST request - invalidates related cache
   */
  post<T>(endpoint: string, body: unknown, invalidatePrefix?: string): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => {
        if (invalidatePrefix) {
          this.cache.deleteByPrefix(invalidatePrefix);
        }
      })
    );
  }

  /**
   * PUT request - invalidates related cache
   */
  put<T>(endpoint: string, body: unknown, invalidatePrefix?: string): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => {
        if (invalidatePrefix) {
          this.cache.deleteByPrefix(invalidatePrefix);
        }
      })
    );
  }

  /**
   * PATCH request - invalidates related cache
   */
  patch<T>(endpoint: string, body: unknown, invalidatePrefix?: string): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => {
        if (invalidatePrefix) {
          this.cache.deleteByPrefix(invalidatePrefix);
        }
      })
    );
  }

  /**
   * DELETE request - invalidates related cache
   */
  delete<T>(endpoint: string, invalidatePrefix?: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`).pipe(
      tap(() => {
        if (invalidatePrefix) {
          this.cache.deleteByPrefix(invalidatePrefix);
        }
      })
    );
  }

  /**
   * Upload file
   */
  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData);
  }

  /**
   * Clear all API cache
   */
  clearCache(): Promise<void> {
    return this.cache.clear();
  }

  /**
   * Invalidate cache by prefix
   */
  invalidateCache(prefix: string): Promise<void> {
    return this.cache.deleteByPrefix(`GET:${prefix}`);
  }
}
