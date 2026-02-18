import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, of, timeout } from 'rxjs';

/**
 * Service to preload/warm up the backend API
 * Helps reduce cold start times on free tier hosting (Render)
 */
@Injectable({
  providedIn: 'root'
})
export class PreloadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private warmedUp = false;

  /**
   * Ping the backend to wake it up from cold start
   * Called on app initialization
   */
  warmUpBackend(): void {
    if (this.warmedUp) return;
    
    // Make a lightweight request to wake up the server
    // Using a public endpoint that doesn't require auth
    this.http.get(`${this.baseUrl}/auth/health`, { 
      responseType: 'text' 
    }).pipe(
      timeout(30000), // 30 second timeout for cold start
      catchError(() => {
        // Try swagger endpoint as fallback
        return this.http.get(`${this.baseUrl.replace('/api', '')}/v3/api-docs`, {
          responseType: 'text'
        }).pipe(
          timeout(30000),
          catchError(() => of(null))
        );
      })
    ).subscribe({
      next: () => {
        this.warmedUp = true;
        console.log('Backend warmed up successfully');
      },
      error: () => {
        console.log('Backend warmup attempted');
      }
    });
  }

  /**
   * Check if backend is warmed up
   */
  isWarmedUp(): boolean {
    return this.warmedUp;
  }
}
