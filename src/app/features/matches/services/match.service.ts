import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Match, MatchCreateRequest, MatchStatistics, MatchResult, MatchType } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiService = inject(ApiService);
  private cache = inject(CacheService);

  getAllMatches(): Observable<Match[]> {
    return this.apiService.get<Match[]>(
      '/matches',
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getMatchById(id: number): Observable<Match> {
    return this.apiService.get<Match>(
      `/matches/${id}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getMatchesByStudent(studentId: number): Observable<Match[]> {
    return this.apiService.get<Match[]>(
      `/matches/student/${studentId}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    ).pipe(
      catchError(() => of([])),
      map(matches => matches || [])
    );
  }

  getMatchStatsByStudent(studentId: number): Observable<MatchStatistics> {
    return this.getMatchesByStudent(studentId).pipe(
      map(matches => this.calculateStats(matches))
    );
  }

  createMatch(request: MatchCreateRequest): Observable<Match> {
    return this.apiService.post<Match>('/matches', request).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/matches');
        return response;
      })
    );
  }

  updateMatch(id: number, request: MatchCreateRequest): Observable<Match> {
    return this.apiService.put<Match>(`/matches/${id}`, request).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/matches');
        return response;
      })
    );
  }

  deleteMatch(id: number): Observable<void> {
    return this.apiService.delete<void>(`/matches/${id}`).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/matches');
        return response;
      })
    );
  }

  private calculateStats(matches: Match[]): MatchStatistics {
    const stats: MatchStatistics = {
      totalMatches: matches.length,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      singlesWins: 0,
      singlesLosses: 0,
      doublesWins: 0,
      doublesLosses: 0
    };

    matches.forEach(match => {
      if (match.result === MatchResult.WIN) {
        stats.wins++;
        if (match.matchType === MatchType.SINGLES) {
          stats.singlesWins++;
        } else if (match.matchType === MatchType.DOUBLES) {
          stats.doublesWins++;
        }
      } else if (match.result === MatchResult.LOSS) {
        stats.losses++;
        if (match.matchType === MatchType.SINGLES) {
          stats.singlesLosses++;
        } else if (match.matchType === MatchType.DOUBLES) {
          stats.doublesLosses++;
        }
      } else {
        stats.draws++;
      }
    });

    stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
    return stats;
  }

}
